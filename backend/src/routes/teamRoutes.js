// backend/src/routes/teamRoutes.js
const express = require("express");
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// All team routes require authentication and admin/superadmin
router.use(protect);
router.use(adminOrSuperAdmin);

router.post("/", createTeam);
router.get("/", getTeams);
router.get("/:id", getTeamById);
router.put("/:id", updateTeam);
router.delete("/:id", deleteTeam);

module.exports = router;
