const Evaluation = require("../models/Evaluation");

// Create Evaluation (with weighted scores)
const createEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEvaluationsByTeam = async (req, res) => {
  try {
    const evaluations = await Evaluation.find({
      team: req.params.teamId,
    }).populate("scores.member", "name");
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEvaluation, getEvaluationsByTeam };
