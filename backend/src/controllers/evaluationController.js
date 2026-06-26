const Evaluation = require("../models/Evaluation");

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
const updateEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
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
const deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
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
