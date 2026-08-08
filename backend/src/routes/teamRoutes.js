// backend/src/routes/teamRoutes.js
const express = require("express");
const {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");
const { protect, anyRole, adminOrSuperAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// ⚠️ Reading the team list/detail was previously locked to admin/superadmin
// only — but the Peer Forum page (team selector for filing a report) and
// the Sidebar (showing "my team") are used by EVERY role and both call
// these exact endpoints. Employees and team leaders were silently failing
// to load their own team every time. Only name/email/photo are returned
// here (no sensitive HR data), so read access for any authenticated user
// is safe. Creating, editing, and deleting teams stays admin/superadmin —
// that's a structural org-config change, not something every role needs.
router.get("/", anyRole, getTeams);
router.get("/:id", anyRole, getTeamById);

router.post("/", adminOrSuperAdmin, createTeam);
router.put("/:id", adminOrSuperAdmin, updateTeam);
router.delete("/:id", adminOrSuperAdmin, deleteTeam);

module.exports = router;
