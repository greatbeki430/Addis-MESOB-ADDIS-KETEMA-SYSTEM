// backend/controllers/feedController.js
const DailyReport = require("../models/DailyReport");
const Meeting = require("../models/Meeting");
const User = require("../models/User");

const isAdminTier = (role) => role === "admin" || role === "superadmin";

// Feed item types
const FEED_TYPES = {
  DAILY_REPORT: "daily_report",
  FORUM_REPORT: "forum_report",
};

// Populate fields for daily reports
const DAILY_REPORT_POPULATE = [
  { path: "createdBy", select: "name email role profilePhotoUrl team" },
  { path: "team", select: "name nameEn" },
];

// Populate fields for forum reports
const FORUM_REPORT_POPULATE = [
  { path: "createdBy", select: "name email role profilePhotoUrl" },
  { path: "teamId", select: "name nameEn" },
  { path: "present", select: "name email" },
];

/**
 * Get unified feed with both Daily Reports and Forum Reports
 * Supports filtering by team, date range, and type
 */
const getUnifiedFeed = async (req, res) => {
  try {
    const {
      team,
      type, // 'daily' | 'forum' | 'all'
      start,
      end,
      limit = 50,
      skip = 0,
    } = req.query;

    const userId = req.user._id;
    const userRole = req.user.role;
    const userTeam = req.user.team;

    let filters = [];

    // ─── Daily Reports Filter ─────────────────────────────────
    if (type === "all" || type === "daily") {
      const dailyFilter = { status: { $in: ["submitted", "approved"] } };

      // Team filtering
      if (team) {
        dailyFilter.team = team;
      } else if (!isAdminTier(userRole)) {
        dailyFilter.team = userTeam;
      }

      // Date range
      if (start && end) {
        dailyFilter.date = { $gte: new Date(start), $lte: new Date(end) };
      }

      filters.push({
        type: FEED_TYPES.DAILY_REPORT,
        query: DailyReport.find(dailyFilter)
          .populate(DAILY_REPORT_POPULATE)
          .sort({ createdAt: -1 })
          .lean(),
        transform: (doc) => ({
          id: doc._id,
          type: FEED_TYPES.DAILY_REPORT,
          title: "Daily Report",
          summary: doc.summary || "No summary provided",
          author: doc.createdBy || null,
          team: doc.team || null,
          date: doc.date || doc.createdAt,
          createdAt: doc.createdAt,
          entries: doc.entries || [],
          grandTotal: doc.grandTotal || 0,
          status: doc.status,
          comments: doc.comments || [],
          reactions: doc.reactions || [],
          entryCount: doc.entries?.length || 0,
        }),
      });
    }

    // ─── Forum Reports Filter ────────────────────────────────
    if (type === "all" || type === "forum") {
      const forumFilter = {};

      // Team filtering
      if (team) {
        forumFilter.teamId = team;
      } else if (!isAdminTier(userRole)) {
        forumFilter.teamId = userTeam;
      }

      // Date range
      if (start && end) {
        forumFilter.date = { $gte: new Date(start), $lte: new Date(end) };
      }

      filters.push({
        type: FEED_TYPES.FORUM_REPORT,
        query: Meeting.find(forumFilter)
          .populate(FORUM_REPORT_POPULATE)
          .sort({ createdAt: -1 })
          .lean(),
        transform: (doc) => ({
          id: doc._id,
          type: FEED_TYPES.FORUM_REPORT,
          title: "Forum Report",
          summary: doc.explanation || "No explanation provided",
          author: doc.createdBy || null,
          team: doc.teamId || null,
          date: doc.date || doc.createdAt,
          createdAt: doc.createdAt,
          topics: doc.topics || [],
          present: doc.present || [],
          absent: doc.absent || [],
          agreements: doc.agreements || [],
          gaps: doc.gaps || [],
          entryCount: doc.topics?.length || 0,
          attendeeCount: doc.present?.length || 0,
        }),
      });
    }

    // ─── Execute all queries ──────────────────────────────────
    const results = await Promise.all(
      filters.map(async (filter) => {
        const docs = await filter.query;
        return docs.map((doc) => filter.transform(doc));
      }),
    );

    // ─── Combine and sort ─────────────────────────────────────
    let feedItems = results.flat();

    // Sort by createdAt (newest first)
    feedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Paginate
    const total = feedItems.length;
    const paginated = feedItems.slice(
      parseInt(skip),
      parseInt(skip) + parseInt(limit),
    );

    res.status(200).json({
      success: true,
      count: paginated.length,
      total: total,
      data: paginated,
      filters: {
        team,
        type,
        start,
        end,
        limit,
        skip,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching unified feed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed",
      error: error.message,
    });
  }
};

/**
 * Get a single feed item by ID and type
 */
const getFeedItemById = async (req, res) => {
  try {
    const { id, type } = req.params;

    let item = null;

    if (type === FEED_TYPES.DAILY_REPORT) {
      const doc = await DailyReport.findById(id)
        .populate(DAILY_REPORT_POPULATE)
        .lean();

      if (doc) {
        item = {
          id: doc._id,
          type: FEED_TYPES.DAILY_REPORT,
          title: "Daily Report",
          summary: doc.summary || "No summary provided",
          author: doc.createdBy || null,
          team: doc.team || null,
          date: doc.date || doc.createdAt,
          createdAt: doc.createdAt,
          entries: doc.entries || [],
          grandTotal: doc.grandTotal || 0,
          status: doc.status,
          comments: doc.comments || [],
          reactions: doc.reactions || [],
          entryCount: doc.entries?.length || 0,
        };
      }
    } else if (type === FEED_TYPES.FORUM_REPORT) {
      const doc = await Meeting.findById(id)
        .populate(FORUM_REPORT_POPULATE)
        .lean();

      if (doc) {
        item = {
          id: doc._id,
          type: FEED_TYPES.FORUM_REPORT,
          title: "Forum Report",
          summary: doc.explanation || "No explanation provided",
          author: doc.createdBy || null,
          team: doc.teamId || null,
          date: doc.date || doc.createdAt,
          createdAt: doc.createdAt,
          topics: doc.topics || [],
          present: doc.present || [],
          absent: doc.absent || [],
          agreements: doc.agreements || [],
          gaps: doc.gaps || [],
          entryCount: doc.topics?.length || 0,
          attendeeCount: doc.present?.length || 0,
        };
      }
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Feed item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("❌ Error fetching feed item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed item",
      error: error.message,
    });
  }
};

module.exports = {
  getUnifiedFeed,
  getFeedItemById,
  FEED_TYPES,
};
