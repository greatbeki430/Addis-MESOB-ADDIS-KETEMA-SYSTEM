// backend/src/controllers/adminDataController.js
const DailyReport = require("../models/DailyReport");
const Evaluation = require("../models/Evaluation");
const Meeting = require("../models/Meeting");
const User = require("../models/User");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────
// GET /admin/data/:dataType
//
// Response shape MUST match what AdminDataManagement.jsx reads:
//   { success: true, data: [...], pagination: { total, totalPages, page, limit } }
//
// Every row MUST have a string `id` (frontend uses it for React keys,
// checkboxes, delete URLs, and the view modal) and MUST expose the
// specific keys each column config reads — see the SHAPING block below.
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

    if (status && status !== "all") {
      query.status = status;
    }

    if (team && team !== "all") {
      if (mongoose.Types.ObjectId.isValid(team)) {
        query.team = team;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const re = { $regex: search.trim(), $options: "i" };
      if (dataType === "forum-reports") {
        query.$or = [
          { teamName: re },
          { topics: re },
          { explanation: re },
          { "present.name": re },
        ];
      } else if (dataType === "evaluations") {
        query.$or = [{ teamName: re }, { evaluatedBy: re }, { members: re }];
      } else if (dataType === "daily-reports") {
        query.$or = [{ summary: re }, { "entries.service": re }];
      }
    }

    const sortDir = String(sortOrder).toUpperCase() === "ASC" ? 1 : -1;
    const sort = { [sortBy]: sortDir };

    // ── Populate ─────────────────────────────────────────────
    let populateFields = [];
    if (dataType === "forum-reports") {
      populateFields = ["createdBy", "teamId"];
    } else if (dataType === "daily-reports") {
      populateFields = ["createdBy", "team"];
    } else if (dataType === "evaluations") {
      populateFields = ["createdBy", "team"];
    }

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

    // ── SHAPING: match each admin page's column config ──────
    let data;

    if (dataType === "forum-reports") {
      data = rawData.map((m) => ({
        id: m._id.toString(),
        topic:
          (Array.isArray(m.topics) && m.topics[0]) ||
          (m.explanation || "").slice(0, 60) ||
          "(no topic)",
        author_name: m.createdBy?.name || "Unknown",
        team_name: m.teamId?.name || m.teamName || "Unknown",
        replies: 0,
        createdAt: m.createdAt,
        status: m.status || "pending",
        // Full data for view modal
        _id: m._id,
        date: m.date,
        timeStart: m.timeStart,
        timeEnd: m.timeEnd,
        present: m.present || [],
        absent: m.absent || [],
        topics: m.topics || [],
        prevResults: m.prevResults || [],
        explanation: m.explanation || "",
        gaps: m.gaps || [],
        agreements: m.agreements || [],
        signatures: m.signatures || [],
        teamName: m.teamName,
        createdBy: m.createdBy,
        teamId: m.teamId,
      }));
    } else if (dataType === "daily-reports") {
      data = rawData.map((d) => ({
        id: d._id.toString(),
        employee_name:
          d.createdBy?.name || d.createdBy?.email || "Unknown Employee",
        team_name: d.team?.name || d.teamName || "—",
        date: d.date || d.createdAt,
        status: d.status || "draft",
        submittedBy: d.createdBy?.name || d.createdBy?.email || "—",
        // Full data for view modal
        _id: d._id,
        entries: d.entries || [],
        grandTotal: d.grandTotal || 0,
        summary: d.summary || "",
        comments: d.comments || [],
        reactions: d.reactions || [],
        createdAt: d.createdAt,
        createdBy: d.createdBy,
        team: d.team,
      }));
    } else if (dataType === "evaluations") {
      data = rawData.map((e) => {
        // Pick the top-scoring member as the "employee" shown in the
        // list; if the evaluation has one member (common case) this is
        // just that member.
        const topMember =
          Array.isArray(e.totalScores) && e.totalScores.length > 0
            ? [...e.totalScores].sort(
                (a, b) => (b.total || 0) - (a.total || 0),
              )[0]
            : null;

        return {
          id: e._id.toString(),
          employee_name:
            topMember?.name ||
            (Array.isArray(e.members) && e.members[0]) ||
            "—",
          team_name: e.teamName || e.team?.name || "—",
          score: e.averageScore ?? e.highestScore ?? 0,
          status: e.status || "draft",
          createdAt: e.createdAt,
          // Full data for view modal
          _id: e._id,
          members: e.members || [],
          scores: e.scores || {},
          comments: e.comments || {},
          signatures: e.signatures || {},
          totalScores: e.totalScores || [],
          evaluatedBy: e.evaluatedBy,
          evaluatedAt: e.evaluatedAt,
          bestPerformer: e.bestPerformer,
          averageScore: e.averageScore,
          highestScore: e.highestScore,
          lowestScore: e.lowestScore,
          totalMembers: e.totalMembers,
          teamName: e.teamName,
          createdBy: e.createdBy,
          team: e.team,
        };
      });
    }

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
          .populate("createdBy", "firstName lastName name email")
          .populate("team", "name");
        data = data.map((item) => ({
          Date: item.date?.toLocaleDateString() || "N/A",
          Employee:
            item.createdBy?.name ||
            (item.createdBy
              ? `${item.createdBy.firstName || ""} ${item.createdBy.lastName || ""}`.trim()
              : "N/A"),
          Team: item.team?.name || "N/A",
          Entries: item.entries?.length || 0,
          GrandTotal: item.grandTotal || 0,
          Summary: item.summary || "N/A",
          Status: item.status || "N/A",
        }));
        break;

      case "evaluations":
        model = Evaluation;
        data = await model
          .find(query)
          .populate("createdBy", "firstName lastName name email")
          .populate("team", "name");
        data = data.map((item) => ({
          Team: item.teamName || item.team?.name || "N/A",
          Members: item.members?.length || 0,
          BestPerformer: item.bestPerformer || "N/A",
          AverageScore: item.averageScore ?? "N/A",
          HighestScore: item.highestScore ?? "N/A",
          LowestScore: item.lowestScore ?? "N/A",
          EvaluatedBy: item.evaluatedBy || "N/A",
          Date: item.createdAt?.toLocaleDateString() || "N/A",
          Status: item.status || "N/A",
        }));
        break;

      case "forum-reports":
        model = Meeting;
        data = await model
          .find(query)
          .populate("createdBy", "name email")
          .populate("teamId", "name");
        data = data.map((item) => ({
          Team: item.teamId?.name || item.teamName || "N/A",
          Date: item.date?.toLocaleDateString() || "N/A",
          Attendees: item.present?.length || 0,
          Absent: item.absent?.length || 0,
          Topics: item.topics?.length || 0,
          Agreements: item.agreements?.length || 0,
          Gaps: item.gaps?.length || 0,
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
