const express = require("express");
const {
  createTeam,
  getTeams,
  getTeamById,
} = require("../controllers/teamController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createTeam);
router.get("/", protect, getTeams);
router.get("/:id", protect, getTeamById);

module.exports = router;
