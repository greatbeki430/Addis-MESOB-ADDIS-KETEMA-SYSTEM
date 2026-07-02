// backend/src/controllers/meetingController.js
const Meeting = require("../models/Meeting");
const User = require("../models/User");

// Create Acha Forum Meeting Report
const createMeeting = async (req, res) => {
  try {
    console.log(
      "📝 Creating meeting with data:",
      JSON.stringify(req.body, null, 2),
    );

    const {
      date,
      timeStart,
      timeEnd,
      present,
      absent,
      prevResults,
      topics,
      explanation,
      gaps,
      agreements,
      signatures,
      teamId,
      teamName,
    } = req.body;

    // ✅ Validate required fields
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // ✅ Handle team - use teamId if provided, otherwise try to find from request
    let teamObjectId = null;
    if (teamId) {
      teamObjectId = teamId;
    } else if (req.body.team) {
      teamObjectId = req.body.team;
    }

    // ✅ Convert present members to ObjectIds (if they are user IDs)
    let presentIds = [];
    if (Array.isArray(present)) {
      presentIds = present
        .filter((p) => p && p.trim && p.trim() !== "")
        .map((p) => {
          // If it's a valid ObjectId string, use it directly
          if (p.match(/^[0-9a-fA-F]{24}$/)) {
            return p;
          }
          // Otherwise, it's a name - we'll store it differently
          return p;
        });
    }

    // ✅ Handle absent members
    let absentData = [];
    if (Array.isArray(absent)) {
      absentData = absent
        .filter((a) => a && a.name && a.name.trim())
        .map((a) => ({
          name: a.name.trim(),
          reason: a.reason || "",
        }));
    }

    // ✅ Clean up string arrays
    const cleanStringArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.filter((item) => item && item.trim && item.trim() !== "");
    };

    // ✅ Build meeting data
    const meetingData = {
      date: new Date(date),
      timeStart: timeStart || "",
      timeEnd: timeEnd || "",
      present: presentIds,
      absent: absentData,
      prevResults: cleanStringArray(prevResults),
      topics: cleanStringArray(topics),
      explanation: explanation || "",
      gaps: cleanStringArray(gaps),
      agreements: cleanStringArray(agreements),
      signatures: cleanStringArray(signatures),
      team: teamObjectId,
      teamName: teamName || "Unknown Team",
      createdBy: req.user._id,
      createdByName: req.user.name || "Unknown User",
    };

    console.log(
      "📝 Meeting data to save:",
      JSON.stringify(meetingData, null, 2),
    );

    const meeting = await Meeting.create(meetingData);

    res.status(201).json({
      message: "✅ Meeting report saved successfully!",
      meeting,
    });
  } catch (error) {
    console.error("❌ Meeting creation error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      message: error.message,
      error: error.stack,
    });
  }
};

// Get all meetings for a team
const getMeetings = async (req, res) => {
  try {
    const { teamId } = req.params;

    let filter = {};
    if (teamId) {
      filter.team = teamId;
    }

    const meetings = await Meeting.find(filter)
      .populate("present", "name email")
      .populate("createdBy", "name email")
      .sort({ date: -1 });

    res.json(meetings);
  } catch (error) {
    console.error("❌ Get meetings error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("present", "name email")
      .populate("createdBy", "name email");

    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.json(meeting);
  } catch (error) {
    console.error("❌ Get meeting by ID error:", error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE MEETING
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user is authorized (creator or admin)
    if (
      meeting.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this meeting" });
    }

    // ✅ Clean up data before update
    const updates = { ...req.body };

    // Handle date conversion
    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    // Clean arrays
    ["prevResults", "topics", "gaps", "agreements", "signatures"].forEach(
      (field) => {
        if (Array.isArray(updates[field])) {
          updates[field] = updates[field].filter(
            (item) => item && item.trim && item.trim() !== "",
          );
        }
      },
    );

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    res.json({
      message: "✅ Meeting updated successfully!",
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("❌ Update meeting error:", error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE MEETING
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user is authorized
    if (
      meeting.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this meeting" });
    }

    await meeting.deleteOne();
    res.json({ message: "✅ Meeting deleted successfully" });
  } catch (error) {
    console.error("❌ Delete meeting error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
};
