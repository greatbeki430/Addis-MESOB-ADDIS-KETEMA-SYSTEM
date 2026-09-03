// backend/src/controllers/evaluationController.js
const Evaluation = require("../models/Evaluation");
const { notifyAdmins } = require("../services/notificationService");

const isAdminTier = (role) => role === "admin" || role === "superadmin";
const isLeaderTier = (role) =>
  role === "leader" || role === "admin" || role === "superadmin";
const sameTeam = (userTeam, evalTeam) => {
  if (!userTeam || !evalTeam) return false;
  return userTeam.toString() === evalTeam.toString();
};

// ✅ Create Evaluation (with enhanced data)
// Employees are evaluated, not evaluators — only team leaders and above can
// create an evaluation. (Also enforced by `leaderOrAdmin` at the route
// level; checked again here so this stays safe even if the route changes.)
const createEvaluation = async (req, res) => {
  try {
    if (!isLeaderTier(req.user.role)) {
      return res.status(403).json({
        message:
          "Only a Team Leader, Admin, or Super Admin can create an evaluation.",
      });
    }

    const evaluationData = {
      ...req.body,
      evaluatedBy: req.user.name || req.user.email || "Unknown",
      createdBy: req.user._id,
      team: req.body.team || req.user.team || undefined,
      // If team is provided as teamName but not team ID, keep it
    };

    // If teamName is provided but no team ID, we keep it as is
    const evaluation = await Evaluation.create(evaluationData);

    // ✅ NOTIFICATION: New evaluation created
    const teamName = evaluation.teamName || "Untitled Team";
    await notifyAdmins(
      "evaluation_submitted",
      `📋 New Evaluation Submitted`,
      `${req.user.name || "A team leader"} submitted an evaluation for "${teamName}" with ${evaluation.members?.length || 0} members.`,
      `/evaluation/${evaluation._id}`,
      {
        evaluationId: evaluation._id,
        teamName: teamName,
        memberCount: evaluation.members?.length || 0,
        submittedBy: req.user.name || req.user.email,
      },
    );

    res.status(201).json(evaluation);
  } catch (error) {
    console.error("Create evaluation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get evaluation by ID
const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }
    res.json(evaluation);
  } catch (error) {
    console.error("Get evaluation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all evaluations (with optional filters)
const getAllEvaluations = async (req, res) => {
  try {
    const { teamId, userId, status } = req.query;
    const filter = {};

    if (teamId) filter.team = teamId;
    if (userId) filter["scores.member"] = userId;
    if (status) filter.status = status;

    const evaluations = await Evaluation.find(filter)
      .sort({ createdAt: -1 })
      .populate("team", "name")
      .populate("discussion.user", "name role profilePhotoUrl");
    res.json(evaluations);
  } catch (error) {
    console.error("Get evaluations error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get evaluations by team (supports both team ID and teamName)
const getEvaluationsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Try to find by team ID first, then by team name
    let evaluations = await Evaluation.find({
      $or: [{ team: teamId }, { teamName: { $regex: teamId, $options: "i" } }],
    }).populate("team", "name");

    res.json(evaluations);
  } catch (error) {
    console.error("Get team evaluations error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update evaluation
// Employees never edit scores — only the team's leader (their own team) or
// an admin/superadmin (any team) can create/adjust an evaluation, at any
// stage. This replaces the earlier "creator can edit while draft" rule,
// since employees should not be the creator of an evaluation at all now.
const updateEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const isTeamLeader =
      req.user.role === "leader" && sameTeam(req.user.team, evaluation.team);
    if (!isAdminTier(req.user.role) && !isTeamLeader) {
      return res.status(403).json({
        message: "Only your team leader or an admin can edit an evaluation.",
      });
    }

    // ✅ Check if this is a "Pass to Super Admin" action
    const isPassToSuperAdmin =
      req.body.submittedTo === "superadmin" && !evaluation.submittedTo; // Only notify once

    const updated = await Evaluation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );

    // ✅ NOTIFICATION: Evaluation passed to Super Admin
    if (isPassToSuperAdmin) {
      const teamName = updated.teamName || "Untitled Team";
      await notifyAdmins(
        "evaluation_passed_to_superadmin",
        `📤 Evaluation Passed to Super Admin`,
        `${req.user.name || "A team leader"} passed the evaluation for "${teamName}" to Super Admin for review.`,
        `/evaluation/${updated._id}`,
        {
          evaluationId: updated._id,
          teamName: teamName,
          memberCount: updated.members?.length || 0,
          passedBy: req.user.name || req.user.email,
          passedAt: new Date().toISOString(),
        },
      );
    }

    res.json(updated);
  } catch (error) {
    console.error("Update evaluation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete evaluation
// Deleting a performance record is consequential, so this is restricted to
// the team's leader or admin/superadmin — never any employee, and never for
// a team you don't lead (previously anyone could delete anyone's record).
const deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const isTeamLeader =
      req.user.role === "leader" && sameTeam(req.user.team, evaluation.team);
    if (!isAdminTier(req.user.role) && !isTeamLeader) {
      return res.status(403).json({
        message: "Only your team leader or an admin can delete an evaluation.",
      });
    }

    await evaluation.deleteOne();
    res.json({ message: "Evaluation deleted successfully" });
  } catch (error) {
    console.error("Delete evaluation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Discussion comment — this is the employee's actual privilege here:
// they can't score anyone, but they CAN discuss and react to a finalized
// evaluation. Open to anyone (any team can view/discuss any evaluation, per
// the intended visibility), same pattern as Daily Report's team feed.
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }
    evaluation.discussion.push({ user: req.user._id, text: text.trim() });
    await evaluation.save();
    await evaluation.populate("discussion.user", "name role profilePhotoUrl");
    res.status(201).json(evaluation);
  } catch (error) {
    console.error("Add evaluation comment error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }
    const comment = evaluation.discussion.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const isCommentOwner = comment.user?.toString() === req.user._id.toString();
    const isTeamLeader =
      req.user.role === "leader" && sameTeam(req.user.team, evaluation.team);
    if (!isCommentOwner && !isTeamLeader && !isAdminTier(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }
    comment.deleteOne();
    await evaluation.save();
    await evaluation.populate("discussion.user", "name role profilePhotoUrl");
    res.json(evaluation);
  } catch (error) {
    console.error("Delete evaluation comment error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Toggle a reaction (one per user, same emoji again = un-react)
const toggleReaction = async (req, res) => {
  try {
    const emoji = req.body.emoji || "👍";
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }
    const idx = evaluation.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString(),
    );
    if (idx === -1) {
      evaluation.reactions.push({ user: req.user._id, emoji });
    } else if (evaluation.reactions[idx].emoji === emoji) {
      evaluation.reactions.splice(idx, 1);
    } else {
      evaluation.reactions[idx].emoji = emoji;
    }
    await evaluation.save();
    res.json(evaluation);
  } catch (error) {
    console.error("Toggle evaluation reaction error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEvaluation,
  getEvaluationById,
  getAllEvaluations,
  getEvaluationsByTeam,
  updateEvaluation,
  deleteEvaluation,
  addComment,
  deleteComment,
  toggleReaction,
};
