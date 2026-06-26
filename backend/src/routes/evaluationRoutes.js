const express = require("express");
const {
  createEvaluation,
  getEvaluationById,
  getAllEvaluations,
  getEvaluationsByTeam,
  updateEvaluation,
  deleteEvaluation,
} = require("../controllers/evaluationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Main CRUD routes
router.route("/").post(createEvaluation).get(getAllEvaluations);

router
  .route("/:id")
  .get(getEvaluationById)
  .put(updateEvaluation)
  .delete(deleteEvaluation);

// Team-specific routes
router.get("/team/:teamId", getEvaluationsByTeam);

module.exports = router;
