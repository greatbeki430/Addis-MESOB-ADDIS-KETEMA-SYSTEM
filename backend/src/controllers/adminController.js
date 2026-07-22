// backend/src/controllers/adminController.js
const DigitalAttendance = require("../models/DigitalAttendance");
const Alert = require("../models/Alert");
const User = require("../models/User");
const Team = require("../models/Team");
const mongoose = require("mongoose");

// ──────────────────────────────────────────────────────────────
// DIGITAL ATTENDANCE - Check In (Backup for Biometrics)
// ──────────────────────────────────────────────────────────────
exports.digitalCheckIn = async (req, res) => {
  try {
    const { userId, teamId, location, deviceInfo, reason } = req.body;

    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already checked in today
    const existing = await DigitalAttendance.findOne({
      userId,
      date: today,
      checkOut: { $exists: false },
    });

    if (existing) {
      return res.status(400).json({
        error: "You already have an active digital attendance for today",
      });
    }

    // Create digital attendance record
    const attendance = await DigitalAttendance.create({
      userId,
      teamId: teamId || user.team,
      date: today,
      checkIn: new Date(),
      checkInLocation: location,
      deviceInfo: deviceInfo,
      status: "pending_verification",
      reasonForDigitalCheckIn: reason || "Biometrics system unavailable",
    });

    // Create alert for admin
    await Alert.create({
      type: "biometrics_failure",
      severity: "high",
      title: "Biometrics System Down - Digital Attendance Used",
      description: `Employee ${user.name} used digital attendance due to biometrics failure`,
      userId: user._id,
      teamId: user.team,
      metadata: {
        attendanceId: attendance._id,
        location,
        reason: reason || "Biometrics system unavailable",
        deviceInfo,
      },
      status: "pending",
    });

    // Populate for response
    const populated = await DigitalAttendance.findById(attendance._id)
      .populate("userId", "name email")
      .populate("teamId", "name");

    res.status(201).json({
      success: true,
      message: "Digital check-in successful. Admin notified.",
      data: populated,
    });
  } catch (error) {
    console.error("Digital check-in error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// DIGITAL ATTENDANCE - Check Out
// ──────────────────────────────────────────────────────────────
exports.digitalCheckOut = async (req, res) => {
  try {
    const { userId, location, notes } = req.body;

    const today = new Date().toISOString().split("T")[0];

    const attendance = await DigitalAttendance.findOne({
      userId,
      date: today,
      checkOut: { $exists: false },
    });

    if (!attendance) {
      return res.status(404).json({
        error: "No active digital attendance found for today",
      });
    }

    const checkOutTime = new Date();
    const hours = (
      (checkOutTime - attendance.checkIn) /
      (1000 * 60 * 60)
    ).toFixed(2);

    attendance.checkOut = checkOutTime;
    attendance.checkOutLocation = location;
    attendance.notes = notes;
    attendance.hours = parseFloat(hours);
    attendance.status = "completed";
    await attendance.save();

    res.json({
      success: true,
      message: "Digital check-out successful",
      data: attendance,
    });
  } catch (error) {
    console.error("Digital check-out error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// GET CURRENT ATTENDANCE STATUS
// ──────────────────────────────────────────────────────────────
exports.getCurrentAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    // Check digital attendance first
    const digital = await DigitalAttendance.findOne({
      userId,
      date: today,
      checkOut: { $exists: false },
    });

    if (digital) {
      return res.json({
        success: true,
        data: {
          ...digital.toObject(),
          type: "digital",
        },
      });
    }

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error("Error checking attendance:", error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// GET DIGITAL ATTENDANCE HISTORY
// ──────────────────────────────────────────────────────────────
exports.getDigitalHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 30 } = req.query;

    const history = await DigitalAttendance.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("verifiedBy", "name");

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// GET ALL DIGITAL ATTENDANCES (Admin/SuperAdmin)
// ──────────────────────────────────────────────────────────────
exports.getDigitalAttendances = async (req, res) => {
  try {
    const {
      status,
      team,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const matchStage = {};
    if (status && status !== "all") matchStage.status = status;
    if (team && team !== "all") {
      matchStage.teamId = new mongoose.Types.ObjectId(team);
    }
    if (startDate && endDate) {
      matchStage.date = { $gte: startDate, $lte: endDate };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $lookup: {
          from: "teams",
          localField: "teamId",
          foreignField: "_id",
          as: "team",
        },
      },
      { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          employee_name: "$employee.name",
          team_name: "$team.name",
          date: 1,
          checkIn: 1,
          checkOut: 1,
          hours: 1,
          status: 1,
          reasonForDigitalCheckIn: 1,
          deviceInfo: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const [data, totalCount] = await Promise.all([
      DigitalAttendance.aggregate(pipeline),
      DigitalAttendance.countDocuments(matchStage),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching digital attendances:", error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// VERIFY DIGITAL ATTENDANCE (Admin/SuperAdmin)
// ──────────────────────────────────────────────────────────────
exports.verifyDigitalAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const attendance = await DigitalAttendance.findById(id);
    if (!attendance) {
      return res
        .status(404)
        .json({ error: "Digital attendance record not found" });
    }

    attendance.status = status; // 'verified' or 'rejected'
    attendance.verifiedBy = req.user._id;
    attendance.verifiedAt = new Date();
    if (notes) attendance.notes = notes;

    await attendance.save();

    // Update related alert
    await Alert.findOneAndUpdate(
      { "metadata.attendanceId": id },
      {
        status: "resolved",
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        description: `Attendance ${status} by ${req.user.name}`,
      },
    );

    res.json({
      success: true,
      message: `Digital attendance ${status}`,
      data: attendance,
    });
  } catch (error) {
    console.error("Error verifying attendance:", error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// GET ALERTS
// ──────────────────────────────────────────────────────────────
exports.getAlerts = async (req, res) => {
  try {
    const { status, type, severity, page = 1, limit = 20 } = req.query;

    const matchStage = {};
    if (status && status !== "all") matchStage.status = status;
    if (type && type !== "all") matchStage.type = type;
    if (severity && severity !== "all") matchStage.severity = severity;

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(matchStage)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("userId", "name email")
        .populate("teamId", "name")
        .populate("resolvedBy", "name"),
      Alert.countDocuments(matchStage),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// RESOLVE ALERT
// ──────────────────────────────────────────────────────────────
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    alert.status = "resolved";
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    if (resolution) {
      alert.metadata = { ...alert.metadata, resolution };
    }

    await alert.save();

    res.json({
      success: true,
      message: "Alert resolved successfully",
      data: alert,
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ error: error.message });
  }
};

// ──────────────────────────────────────────────────────────────
// BULK ACTION
// ──────────────────────────────────────────────────────────────
exports.bulkAction = async (req, res) => {
  try {
    const { action, ids } = req.body;
    const { type } = req.params;

    let model;
    if (type === "digital-attendance") {
      model = DigitalAttendance;
    } else if (type === "alerts") {
      model = Alert;
    } else {
      return res.status(400).json({ error: "Invalid model type" });
    }

    let result;
    switch (action) {
      case "approve":
        result = await model.updateMany(
          { _id: { $in: ids } },
          {
            status: "verified",
            verifiedBy: req.user._id,
            verifiedAt: new Date(),
          },
        );
        break;
      case "reject":
        result = await model.updateMany(
          { _id: { $in: ids } },
          {
            status: "rejected",
            verifiedBy: req.user._id,
            verifiedAt: new Date(),
          },
        );
        break;
      case "resolve":
        result = await model.updateMany(
          { _id: { $in: ids } },
          {
            status: "resolved",
            resolvedBy: req.user._id,
            resolvedAt: new Date(),
          },
        );
        break;
      case "delete":
        result = await model.deleteMany({ _id: { $in: ids } });
        break;
      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    res.json({
      success: true,
      message: `Bulk action ${action} completed`,
      result,
    });
  } catch (error) {
    console.error("Bulk action error:", error);
    res.status(500).json({ error: error.message });
  }
};
