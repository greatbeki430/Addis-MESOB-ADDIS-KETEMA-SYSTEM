const DailyReport = require("../models/DailyReport");

const isAdminTier = (role) => role === "admin" || role === "superadmin";
const isLeaderTier = (role) =>
  role === "leader" || role === "admin" || role === "superadmin";

const sameTeam = (userTeam, reportTeam) => {
  if (!userTeam || !reportTeam) return false;
  return userTeam.toString() === reportTeam.toString();
};

const REPORT_POPULATE = [
  { path: "team", select: "name nameEn" },
  {
    path: "createdBy",
    select: "name role position profilePhotoUrl firstName lastName email",
  },
  {
    path: "comments.user",
    select: "name role profilePhotoUrl firstName lastName",
  },
];

// ─── Create / upsert today's own report ─────────────────────────────────────
const createDailyReport = async (req, res) => {
  try {
    const entries = req.body.entries || req.body.data || [];
    const grandTotal = entries.reduce(
      (sum, entry) => sum + (entry.total || 0),
      0,
    );
    const summary = req.body.summary || "";
    const date = new Date(req.body.date);
    const team = req.body.team || req.user?.team || null;
    const status = req.body.status || "draft";

    const existingReport = await DailyReport.findOne({
      date,
      createdBy: req.user._id,
    });

    if (existingReport) {
      existingReport.entries = entries;
      existingReport.grandTotal = grandTotal;
      existingReport.summary = summary;
      existingReport.status = status;
      if (team) existingReport.team = team;
      const updated = await existingReport.save();
      await updated.populate(REPORT_POPULATE);
      return res.json(updated);
    }

    const report = await DailyReport.create({
      date,
      team,
      entries,
      grandTotal,
      summary,
      status,
      createdBy: req.user._id,
    });
    await report.populate(REPORT_POPULATE);
    res.status(201).json(report);
  } catch (error) {
    // Duplicate key = a race where the report was created between the
    // findOne and create above; retry as an update.
    if (error.code === 11000) {
      try {
        const entries = req.body.entries || req.body.data || [];
        const grandTotal = entries.reduce(
          (sum, entry) => sum + (entry.total || 0),
          0,
        );
        const existing = await DailyReport.findOneAndUpdate(
          { date: new Date(req.body.date), createdBy: req.user._id },
          {
            entries,
            grandTotal,
            summary: req.body.summary || "",
            status: req.body.status || "draft",
          },
          { new: true },
        ).populate(REPORT_POPULATE);
        return res.json(existing);
      } catch (retryError) {
        return res.status(500).json({ message: retryError.message });
      }
    }
    res.status(500).json({ message: error.message });
  }
};

// ─── Admin/leader listing across a team or the whole org ───────────────────
const getDailyReports = async (req, res) => {
  try {
    const { start, end, date, team } = req.query;
    const filter = {};

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (start && end) {
      filter.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    // Employees and leaders are scoped to their own team; only admins and
    // superadmins can pull reports across every team.
    if (!isAdminTier(req.user.role)) {
      if (team && !sameTeam(req.user.team, team)) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this team's reports" });
      }
      filter.team = req.user.team;
    } else if (team) {
      filter.team = team;
    }

    const reports = await DailyReport.find(filter)
      .populate(REPORT_POPULATE)
      .sort({ date: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get the CALLER's own report for a date (for the "New Report" form) ────
const getReportByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const report = await DailyReport.findOne({
      date: { $gte: startDate, $lte: endDate },
      createdBy: req.user._id,
    }).populate(REPORT_POPULATE);

    if (!report) {
      return res.status(404).json({ message: "No report found for this date" });
    }

    res.json(report.entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get the CALLER's own full report for a date (form pre-fill, incl. summary) ──
const getMyReportByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const report = await DailyReport.findOne({
      date: { $gte: startDate, $lte: endDate },
      createdBy: req.user._id,
    }).populate(REPORT_POPULATE);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "No report found for this date" });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete the CALLER's own report for a date ──────────────────────────────
const deleteReportByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const result = await DailyReport.deleteOne({
      date: { $gte: startDate, $lte: endDate },
      createdBy: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No report found for this date" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Weekly / Cumulative Summary ───────────────────────────────
const getSummaryReport = async (req, res) => {
  try {
    const { start, end, team, fiscalYearStart } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "start and end query params are required (YYYY-MM-DD)",
      });
    }

    let scopedTeam = team;
    if (!isAdminTier(req.user.role)) {
      if (team && !sameTeam(req.user.team, team)) {
        return res
          .status(403)
          .json({ message: "Not authorized to view this team's summary" });
      }
      scopedTeam = req.user.team;
    }

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const filter = { date: { $gte: startDate, $lte: endDate } };
    if (scopedTeam) filter.team = scopedTeam;

    const reports = await DailyReport.find(filter)
      .populate("team", "name nameEn")
      .sort({ date: 1 });

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

    let cumulative = null;
    if (fiscalYearStart) {
      const fyStart = new Date(fiscalYearStart);
      fyStart.setHours(0, 0, 0, 0);
      const fyFilter = { date: { $gte: fyStart, $lte: endDate } };
      if (scopedTeam) fyFilter.team = scopedTeam;

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

// ─── Get the CALLER's own report history ────────────────────────────────────
const getUserHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 100, skip = 0 } = req.query;

    const reports = await DailyReport.find({ createdBy: userId })
      .populate(REPORT_POPULATE)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await DailyReport.countDocuments({ createdBy: userId });

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
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

// ─── Team feed: everyone's reports for a team ──────────────────────────────
const getTeamFeed = async (req, res) => {
  try {
    const { date, start, end, team, limit = 50, skip = 0 } = req.query;

    let targetTeam = team || req.user.team;

    // ✅ Return empty array instead of 400 error
    if (!targetTeam) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No team assigned",
      });
    }

    if (!isAdminTier(req.user.role) && !sameTeam(req.user.team, targetTeam)) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this team's feed" });
    }

    const filter = { team: targetTeam };

    // By default, show today's reports
    if (!date && !start && !end) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filter.date = { $gte: today, $lt: tomorrow };
    } else if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (start && end) {
      filter.date = { $gte: new Date(start), $lte: new Date(end) };
    }

    // Only show submitted/approved reports in the feed
    filter.status = { $in: ["submitted", "approved"] };

    const reports = await DailyReport.find(filter)
      .populate(REPORT_POPULATE)
      .sort({ date: -1, createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res
      .status(200)
      .json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    console.error("❌ Error fetching team feed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team feed",
      error: error.message,
    });
  }
};
// ─── Get single report by ID ────────────────────────────────────────────────
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await DailyReport.findById(id).populate(REPORT_POPULATE);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const isOwner =
      report.createdBy?._id?.toString() === req.user._id.toString();
    const isTeammate = sameTeam(req.user.team, report.team?._id || report.team);
    if (!isOwner && !isTeammate && !isAdminTier(req.user.role)) {
      return res.status(404).json({
        success: false,
        message: "Report not found or you don't have permission to view it",
      });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("❌ Error fetching report by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};

// ─── Update report by ID (owner only) ──────────────────────────────────────
const updateReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const { entries, date, team, grandTotal, summary, status } = req.body;

    const report = await DailyReport.findOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found or you don't have permission to update it",
      });
    }

    if (entries) report.entries = entries;
    if (date) report.date = new Date(date);
    if (team) report.team = team;
    if (grandTotal !== undefined) report.grandTotal = grandTotal;
    if (summary !== undefined) report.summary = summary;
    if (status) report.status = status;

    await report.save();
    await report.populate(REPORT_POPULATE);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("❌ Error updating report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update report",
      error: error.message,
    });
  }
};

// ─── Delete report by ID ────────────────────────────────────────────────────
const deleteReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await DailyReport.findById(id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const isOwner = report.createdBy?.toString() === req.user._id.toString();
    const canModerate =
      isAdminTier(req.user.role) ||
      (req.user.role === "leader" && sameTeam(req.user.team, report.team));

    if (!isOwner && !canModerate) {
      return res.status(404).json({
        success: false,
        message: "Report not found or you don't have permission to delete it",
      });
    }

    await DailyReport.deleteOne({ _id: id });

    res
      .status(200)
      .json({ success: true, message: "Report deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
};

// ─── Comments: any teammate can comment on a report ────────────────────────
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }

    const report = await DailyReport.findById(id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const isOwner = report.createdBy?.toString() === req.user._id.toString();
    const isTeammate = sameTeam(req.user.team, report.team);
    if (!isOwner && !isTeammate && !isAdminTier(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to comment on this report",
      });
    }

    report.comments.push({
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    });
    await report.save();
    await report.populate(REPORT_POPULATE);

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    const report = await DailyReport.findById(id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const comment = report.comments.id(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const isCommentOwner = comment.user?.toString() === req.user._id.toString();
    const isReportOwner =
      report.createdBy?.toString() === req.user._id.toString();
    const canModerate =
      isAdminTier(req.user.role) ||
      (req.user.role === "leader" && sameTeam(req.user.team, report.team));

    if (!isCommentOwner && !isReportOwner && !canModerate) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    comment.deleteOne();
    await report.save();
    await report.populate(REPORT_POPULATE);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};

// ─── Reactions: one reaction per user per report, toggled on/off ──────────
const toggleReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const emoji = req.body.emoji || "👍";

    const report = await DailyReport.findById(id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const isOwner = report.createdBy?.toString() === req.user._id.toString();
    const isTeammate = sameTeam(req.user.team, report.team);
    if (!isOwner && !isTeammate && !isAdminTier(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to react to this report",
      });
    }

    const existingIndex = report.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    if (existingIndex === -1) {
      report.reactions.push({
        user: req.user._id,
        emoji,
        createdAt: new Date(),
      });
    } else if (report.reactions[existingIndex].emoji === emoji) {
      // Same emoji again = remove (un-react)
      report.reactions.splice(existingIndex, 1);
    } else {
      // Different emoji = switch reaction
      report.reactions[existingIndex].emoji = emoji;
    }

    await report.save();
    await report.populate(REPORT_POPULATE);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error("❌ Error toggling reaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to react to report",
      error: error.message,
    });
  }
};

module.exports = {
  createDailyReport,
  getDailyReports,
  getReportByDate,
  getMyReportByDate,
  deleteReportByDate,
  getSummaryReport,
  getUserHistory,
  getTeamFeed,
  getReportById,
  updateReportById,
  deleteReportById,
  addComment,
  deleteComment,
  toggleReaction,
};
