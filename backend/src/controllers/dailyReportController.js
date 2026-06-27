// backend/controllers/dailyReportController.js
const DailyReport = require("../models/DailyReport");

const createDailyReport = async (req, res) => {
  try {
    // Calculate grand total from entries
    const entries = req.body.entries || req.body.data || [];
    const grandTotal = entries.reduce(
      (sum, entry) => sum + (entry.total || 0),
      0,
    );

    const reportData = {
      date: req.body.date,
      team: req.body.team || req.user?.team || null,
      entries: entries,
      grandTotal: grandTotal,
      createdBy: req.user._id,
    };

    // Check if report exists for this date and team
    const existingReport = await DailyReport.findOne({
      date: new Date(req.body.date),
      team: reportData.team,
    });

    if (existingReport) {
      // Update existing report
      existingReport.entries = entries;
      existingReport.grandTotal = grandTotal;
      const updated = await existingReport.save();
      return res.json(updated);
    }

    const report = await DailyReport.create(reportData);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDailyReports = async (req, res) => {
  try {
    const { start, end, date, team } = req.query;
    const filter = {};

    // If date is provided, use it directly
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (start && end) {
      filter.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    if (team) {
      filter.team = team;
    }

    const reports = await DailyReport.find(filter)
      .populate("team", "name nameEn")
      .populate("createdBy", "name")
      .sort({ date: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get report by date (returns entries directly for frontend)
const getReportByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const team = req.query.team || req.user?.team;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const filter = {
      date: { $gte: startDate, $lte: endDate },
    };

    if (team) {
      filter.team = team;
    }

    const report = await DailyReport.findOne(filter)
      .populate("team", "name nameEn")
      .populate("createdBy", "name");

    if (!report) {
      return res.status(404).json({ message: "No report found for this date" });
    }

    res.json(report.entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete report by date
const deleteReportByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const team = req.query.team || req.user?.team;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const filter = {
      date: { $gte: startDate, $lte: endDate },
    };

    if (team) {
      filter.team = team;
    }

    const result = await DailyReport.deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No report found for this date" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDailyReport,
  getDailyReports,
  getReportByDate,
  deleteReportByDate,
};
