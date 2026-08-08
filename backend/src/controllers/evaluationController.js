const Evaluation = require("../models/Evaluation");

const isAdminTier = (role) => role === "admin" || role === "superadmin";
const isLeaderTier = (role) =>
  role === "leader" || role === "admin" || role === "superadmin";
const sameTeam = (userTeam, evalTeam) => {
  if (!userTeam || !evalTeam) return false;
  return userTeam.toString() === evalTeam.toString();
};

// ✅ Create Evaluation (with enhanced data)
const createEvaluation = async (req, res) => {
  try {
    const evaluationData = {
      ...req.body,
      evaluatedBy: req.user.name || req.user.email || "Unknown",
      createdBy: req.user._id,
      // If team is provided as teamName but not team ID, keep it
    };

    // If teamName is provided but no team ID, we keep it as is
    const evaluation = await Evaluation.create(evaluationData);
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
      .populate("team", "name");
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
// Any team member can still edit while it's a draft (they're filling it in
// together), but once submitted/approved, only the team's leader or an
// admin/superadmin can make changes — this was previously wide open to
// anyone, letting any employee alter any team's finalized evaluation.
const updateEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    const isCreator =
      evaluation.createdBy?.toString() === req.user._id.toString();
    const isTeamLeader =
      req.user.role === "leader" && sameTeam(req.user.team, evaluation.team);
    const canEditFreely = isAdminTier(req.user.role) || isTeamLeader;
    const canEditDraft = isCreator && evaluation.status === "draft";

    if (!canEditFreely && !canEditDraft) {
      return res.status(403).json({
        message:
          "This evaluation has already been submitted. Only your team leader or an admin can edit it further.",
      });
    }

    const updated = await Evaluation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );
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

module.exports = {
  createEvaluation,
  getEvaluationById,
  getAllEvaluations,
  getEvaluationsByTeam,
  updateEvaluation,
  deleteEvaluation,
};
