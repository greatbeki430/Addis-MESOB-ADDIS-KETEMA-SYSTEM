// backend/src/routes/departmentRoutes.js

const express = require("express");
const router = express.Router();
const { protect, anyRole, leaderOrAdmin } = require("../middleware/auth");

const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

// ── Reads: anyone signed in ─────────────────────────────────
router.get("/", protect, anyRole, getDepartments);
router.get("/:id", protect, anyRole, getDepartment);

// ── Writes: leader/admin/superadmin ─────────────────────────
// NOTE: deleteDepartment is destructive (though it refuses to delete
// departments that still have employees). If you have a stricter
// "adminOnly" middleware elsewhere in the app, consider swapping it in
// for the DELETE route specifically.
router.post("/", protect, leaderOrAdmin, createDepartment);
router.put("/:id", protect, leaderOrAdmin, updateDepartment);
router.delete("/:id", protect, leaderOrAdmin, deleteDepartment);

module.exports = router;
