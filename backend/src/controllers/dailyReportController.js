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

// ─── Weekly / Cumulative Summary ───────────────────────────────
// Matches the manual paper process (Adis_ketema_Mesob_Daily_Report.xlsx),
// which rolls daily entries into a weekly report ("ሳምንታዊ ሪፖርት ከ.../...")
// and a fiscal-year-to-date cumulative total ("ከጷግሜ ... እስካሁን የተሰጡ አገልግሎቶች").
// This was previously only possible by hand; the app only stored one
// day at a time with no rollup view or endpoint.
const getSummaryReport = async (req, res) => {
  try {
    const { start, end, team, fiscalYearStart } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "start and end query params are required (YYYY-MM-DD)",
      });
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (team) filter.team = team;

    const reports = await DailyReport.find(filter)
      .populate("team", "name nameEn")
      .sort({ date: 1 });

    // Roll up entries by dept + service across every day in the range
    const byService = {};
    let weekMale = 0;
    let weekFemale = 0;
    let weekTotal = 0;

    reports.forEach((report) => {
      (report.entries || []).forEach((entry) => {
        const key = `${entry.dept || ""}||${entry.service || ""}`;
        if (!byService[key]) {
          byService[key] = {
            dept: entry.dept || "",
            service: entry.service || "",
            male: 0,
            female: 0,
            total: 0,
          };
        }
        byService[key].male += entry.male || 0;
        byService[key].female += entry.female || 0;
        byService[key].total += entry.total || 0;
        weekMale += entry.male || 0;
        weekFemale += entry.female || 0;
        weekTotal += entry.total || 0;
      });
    });

    const weekly = {
      start: startDate,
      end: endDate,
      days: reports.length,
      male: weekMale,
      female: weekFemale,
      total: weekTotal,
      services: Object.values(byService),
    };

    // Optional fiscal-year-to-date cumulative total, matching the
    // xlsx column "ከጷግሜ ... እስካሁን የተሰጡ አገልግሎቶች"
    let cumulative = null;
    if (fiscalYearStart) {
      const fyStart = new Date(fiscalYearStart);
      fyStart.setHours(0, 0, 0, 0);
      const fyFilter = { date: { $gte: fyStart, $lte: endDate } };
      if (team) fyFilter.team = team;

      const fyReports = await DailyReport.find(fyFilter);
      let fyMale = 0;
      let fyFemale = 0;
      let fyTotal = 0;
      fyReports.forEach((report) => {
        (report.entries || []).forEach((entry) => {
          fyMale += entry.male || 0;
          fyFemale += entry.female || 0;
          fyTotal += entry.total || 0;
        });
      });
      cumulative = {
        start: fyStart,
        end: endDate,
        days: fyReports.length,
        male: fyMale,
        female: fyFemale,
        total: fyTotal,
      };
    }

    res.json({ weekly, cumulative });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ✅ NEW: Get user's report history ──────────────────────────────────────
const getUserHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 100, skip = 0 } = req.query;

    // Get all reports for this user, sorted by newest first
    const reports = await DailyReport.find({
      createdBy: userId,
    })
      .populate("team", "name nameEn")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await DailyReport.countDocuments({
      createdBy: userId,
    });

    res.status(200).json({
      success: true,
      count: reports.length,
      total: total,
      data: reports,
    });
  } catch (error) {
    console.error("❌ Error fetching user history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report history",
      error: error.message,
    });
  }
};

// ─── ✅ NEW: Get single report by ID ────────────────────────────────────────
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const report = await DailyReport.findOne({
      _id: id,
      createdBy: userId,
    })
      .populate("team", "name nameEn")
      .populate("createdBy", "name");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found or you don't have permission to view it",
      });
    }

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("❌ Error fetching report by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};

// ─── ✅ NEW: Update report by ID ────────────────────────────────────────────
const updateReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { entries, date, team, grandTotal } = req.body;

    const report = await DailyReport.findOne({
      _id: id,
      createdBy: userId,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found or you don't have permission to update it",
      });
    }

    // Update fields
    if (entries) report.entries = entries;
    if (date) report.date = new Date(date);
    if (team) report.team = team;
    if (grandTotal !== undefined) report.grandTotal = grandTotal;

    await report.save();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("❌ Error updating report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update report",
      error: error.message,
    });
  }
};

// ─── ✅ NEW: Delete report by ID ────────────────────────────────────────────
const deleteReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const report = await DailyReport.findOne({
      _id: id,
      createdBy: userId,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found or you don't have permission to delete it",
      });
    }

    await DailyReport.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
};

module.exports = {
  createDailyReport,
  getDailyReports,
  getReportByDate,
  deleteReportByDate,
  getSummaryReport,
  getUserHistory,
  getReportById,
  updateReportById,
  deleteReportById,
};
