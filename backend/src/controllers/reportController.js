const Report = require("../models/Report");
const Team = require("../models/Team");

// Create a new report
const createReport = async (req, res) => {
  try {
    const { title, type, period, startDate, endDate, team, data, summary } =
      req.body;

    let teamName = "";
    let teamId = null;

    if (team) {
      const teamDoc = await Team.findById(team);
      if (teamDoc) {
        teamName = teamDoc.name;
        teamId = teamDoc._id;
      }
    }

    const report = await Report.create({
      title,
      type,
      period,
      startDate,
      endDate,
      team: teamId,
      teamName,
      generatedBy: req.user._id,
      generatedByName: req.user.name,
      data,
      summary,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all reports (with filters)
const getReports = async (req, res) => {
  try {
    const { type, period, startDate, endDate, team } = req.query;
    const filter = { isDeleted: false };

    if (type) filter.type = type;
    if (period) filter.period = period;
    if (team) filter.team = team;
    if (startDate) filter.createdAt = { $gte: new Date(startDate) };
    if (endDate)
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };

    // If user is not admin, only show their own reports
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      filter.generatedBy = req.user._id;
    }

    const reports = await Report.find(filter)
      .populate("generatedBy", "name email")
      .populate("team", "name")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reports by team
const getReportsByTeam = async (req, res) => {
  try {
    const reports = await Report.find({
      team: req.params.teamId,
      isDeleted: false,
    })
      .populate("generatedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get reports by user
const getReportsByUser = async (req, res) => {
  try {
    const reports = await Report.find({
      generatedBy: req.params.userId,
      isDeleted: false,
    })
      .populate("team", "name")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single report
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("generatedBy", "name email")
      .populate("team", "name");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if user has access
    if (
      req.user.role !== "admin" &&
      req.user.role !== "superadmin" &&
      report.generatedBy._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this report" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete report (soft delete)
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.isDeleted = true;
    await report.save();

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  deleteReport,
  getReportsByTeam,
  getReportsByUser,
};
