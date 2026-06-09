const express = require("express");
const {
  createEvaluation,
  getEvaluationsByTeam,
} = require("../controllers/evaluationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createEvaluation);
router.get("/team/:teamId", protect, getEvaluationsByTeam);

module.exports = router;
