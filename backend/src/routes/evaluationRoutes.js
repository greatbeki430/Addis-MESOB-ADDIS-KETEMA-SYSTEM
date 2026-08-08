const express = require("express");
const {
  createEvaluation,
  getEvaluationById,
  getAllEvaluations,
  getEvaluationsByTeam,
  updateEvaluation,
  deleteEvaluation,
  addComment,
  deleteComment,
  toggleReaction,
} = require("../controllers/evaluationController");
const { protect, leaderOrAdmin } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Read access: every role, including Employee — they're evaluated, and
// can see and discuss evaluations across teams, just never create/edit one.
router.get("/", getAllEvaluations);
router.get("/team/:teamId", getEvaluationsByTeam);
router.get("/:id", getEvaluationById);

// ── Write access: Team Leader and above only — an employee is evaluated,
// not the evaluator.
router.post("/", leaderOrAdmin, createEvaluation);
router.put("/:id", leaderOrAdmin, updateEvaluation);
router.delete("/:id", leaderOrAdmin, deleteEvaluation);

// ── Discussion: everyone can comment on / react to an evaluation —
// this is the employee's actual privilege here.
router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment);
router.post("/:id/reactions", toggleReaction);

module.exports = router;
