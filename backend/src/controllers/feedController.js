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
//
// D1: Meeting stores the team on "team" (ObjectId ref "Team").
// There is no "teamId" field on the schema, and "present" is a
// [String] array of member names, not a set of User refs — so the
// previous populate of "teamId" and "present" was a silent no-op
// that produced team: null on every forum feed item.
const FORUM_REPORT_POPULATE = [
  { path: "createdBy", select: "name email role profilePhotoUrl" },
  { path: "team", select: "name nameEn" },
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
      // D1: Meeting stores the team on "team" — never on "teamId".
      // Using "teamId" here broke the non-admin clamp entirely:
      // the query would either return nothing or leak other teams
      // depending on the query planner. The correct path is "team".
      if (team) {
        forumFilter.team = team;
      } else if (!isAdminTier(userRole)) {
        forumFilter.team = userTeam;
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
          // D1: read the real field name. The API response key stays
          // "team" for shape-compatibility with daily_report items.
          team: doc.team || null,
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
    // B8: never return error.message or error.stack to the client.
    console.error("❌ Feed fetch failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed",
      code: "FEED_FETCH_FAILED",
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
          // D1: same correction as the list transform.
          team: doc.team || null,
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
        code: "FEED_ITEM_NOT_FOUND",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("❌ Feed item fetch failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed item",
      code: "FEED_ITEM_FETCH_FAILED",
    });
  }
};

module.exports = {
  getUnifiedFeed,
  getFeedItemById,
  FEED_TYPES,
};
