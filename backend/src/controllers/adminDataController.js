// backend/src/controllers/adminDataController.js
const DailyReport = require("../models/DailyReport");
const Evaluation = require("../models/Evaluation");
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────
// GET /admin/data/:dataType
//
// Backs the admin "Manage ..." pages. Response shape MUST match
// what frontend/src/pages/admin/AdminDataManagement.jsx reads:
//
//   {
//     success: true,
//     data: [ { id, ...columns the page reads }, ... ],
//     pagination: { total, totalPages, page, limit }
//   }
//
// Every row MUST have a string `id` — the page uses it as the React
// key, the checkbox selection identifier, the delete URL segment,
// and the view-modal subject. Mongo docs have `_id`, so we map it.
// ─────────────────────────────────────────────────────────────
exports.getData = async (req, res) => {
  try {
    const { dataType } = req.params;
    const {
      page = 1,
      limit = 20,
      search,
      status,
      team,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // ── Model selection ──────────────────────────────────────
    let model;
    switch (dataType) {
      case "daily-reports":
        model = DailyReport;
        break;
      case "evaluations":
        model = Evaluation;
        break;
      case "forum-reports":
        model = Meeting;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid data type: ${dataType}`,
        });
    }

    // ── Query construction ───────────────────────────────────
    const query = {};

    // Status: only apply if explicitly requested. Never hide drafts
    // or in-progress records by default — admins should see them.
    if (status && status !== "all") {
      query.status = status;
    }

    // Team: forum reports carry a `teamId` ObjectId + `teamName`
    // string. Accept either an ObjectId or a name fragment.
    if (team && team !== "all" && dataType === "forum-reports") {
      if (mongoose.Types.ObjectId.isValid(team)) {
        query.teamId = team;
      } else {
        query.teamName = { $regex: team, $options: "i" };
      }
    }

    // Date range: use createdAt so it works uniformly across models.
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search: type-aware so we hit fields that actually exist on
    // each model, instead of the old blanket `summary`/`description`
    // which most models don't have.
    if (search && search.trim()) {
      const re = { $regex: search.trim(), $options: "i" };
      if (dataType === "forum-reports") {
        query.$or = [
          { teamName: re },
          { topics: re },
          { explanation: re },
          { "present.name": re },
          { "absent.name": re },
        ];
      } else {
        query.$or = [{ summary: re }, { description: re }, { title: re }];
      }
    }

    // ── Sort ─────────────────────────────────────────────────
    const sortDir = String(sortOrder).toUpperCase() === "ASC" ? 1 : -1;
    const sort = { [sortBy]: sortDir };

    // ── Populate ─────────────────────────────────────────────
    let populateFields = [];
    if (dataType === "forum-reports") {
      populateFields = ["createdBy", "teamId"];
    } else if (dataType === "daily-reports") {
      populateFields = ["createdBy", "team"];
    } else if (dataType === "evaluations") {
      populateFields = ["employeeId", "evaluatorId"];
    }

    // ── Execute ──────────────────────────────────────────────
    const [total, rawData] = await Promise.all([
      model.countDocuments(query),
      model
        .find(query)
        .populate(populateFields)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // ── Shape rows for the frontend ─────────────────────────
    let data;

    if (dataType === "forum-reports") {
      data = rawData.map((m) => {
        // Display topic: first topic, or a snippet of the
        // explanation if topics are empty.
        const firstTopic =
          Array.isArray(m.topics) && m.topics[0]
            ? m.topics[0]
            : (m.explanation || "").slice(0, 60) || "(no topic)";

        return {
          // Required by the frontend for keys, checkboxes, delete,
          // and the view modal.
          id: m._id.toString(),

          // Columns the frontend's `forum-reports` config reads:
          topic: firstTopic,
          author_name: m.createdBy?.name || "Unknown",
          team_name: m.teamId?.name || m.teamName || "Unknown",
          replies: 0, // wire up if you add a replies model later
          createdAt: m.createdAt,
          status: m.status || "pending",

          // Extra fields kept so the "View Details" modal shows
          // the full report, not just the columns.
          _id: m._id,
          date: m.date,
          timeStart: m.timeStart,
          timeEnd: m.timeEnd,
          teamName: m.teamName,
          present: m.present || [],
          absent: m.absent || [],
          prevResults: m.prevResults || [],
          topics: m.topics || [],
          explanation: m.explanation || "",
          gaps: m.gaps || [],
          agreements: m.agreements || [],
          signatures: m.signatures || [],
          aiGeneratedContent: m.aiGeneratedContent || "",
          isAutoSave: m.isAutoSave || false,
          createdBy: m.createdBy,
          teamId: m.teamId,
        };
      });
    } else {
      // Other types: still ensure a string `id` so row keys and
      // delete URLs work. Keep everything else untouched.
      data = rawData.map((d) => ({
        ...d,
        id: (d._id || d.id || "").toString(),
      }));
    }

    // ── Response — shape must match AdminDataManagement ─────
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch admin data",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /admin/data/:dataType/bulk-action
// ─────────────────────────────────────────────────────────────
exports.bulkAction = async (req, res) => {
  try {
    const { dataType } = req.params;
    const { action, ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "No IDs provided" });
    }

    let model;
    switch (dataType) {
      case "daily-reports":
        model = DailyReport;
        break;
      case "evaluations":
        model = Evaluation;
        break;
      case "forum-reports":
        model = Meeting;
        break;
      default:
        return res
          .status(400)
          .json({ success: false, error: "Invalid data type" });
    }

    let result;
    switch (action) {
      case "delete":
        result = await model.deleteMany({ _id: { $in: ids } });
        break;
      case "archive":
        result = await model.updateMany(
          { _id: { $in: ids } },
          { status: "archived" },
        );
        break;
      case "approve":
        result = await model.updateMany(
          { _id: { $in: ids } },
          { status: "approved" },
        );
        break;
      case "reject":
        result = await model.updateMany(
          { _id: { $in: ids } },
          { status: "rejected" },
        );
        break;
      default:
        return res
          .status(400)
          .json({ success: false, error: "Invalid action" });
    }

    return res.status(200).json({
      success: true,
      message: `${action} completed successfully`,
      result,
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to perform bulk action",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /admin/data/:dataType/export
// ─────────────────────────────────────────────────────────────
exports.exportData = async (req, res) => {
  try {
    const { dataType } = req.params;
    const { ids } = req.query;

    let model;
    let data;
    const query = ids ? { _id: { $in: ids.split(",") } } : {};

    switch (dataType) {
      case "daily-reports":
        model = DailyReport;
        data = await model
          .find(query)
          .populate("createdBy", "firstName lastName email");
        data = data.map((item) => ({
          Date: item.date?.toLocaleDateString() || "N/A",
          Employee: item.createdBy
            ? `${item.createdBy.firstName} ${item.createdBy.lastName}`
            : "N/A",
          Summary: item.summary || "N/A",
          Status: item.status || "N/A",
        }));
        break;
      default:
        return res.status(400).json({
          success: false,
          error: "Export not supported for this data type",
        });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error exporting data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to export data",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /admin/data/:dataType/:id
// ─────────────────────────────────────────────────────────────
exports.deleteItem = async (req, res) => {
  try {
    const { dataType, id } = req.params;

    let model;
    switch (dataType) {
      case "daily-reports":
        model = DailyReport;
        break;
      case "evaluations":
        model = Evaluation;
        break;
      case "forum-reports":
        model = Meeting;
        break;
      default:
        return res
          .status(400)
          .json({ success: false, error: "Invalid data type" });
    }

    const result = await model.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete item",
    });
  }
};
