// backend/src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminDataController = require("../controllers/adminDataController");
const {
  protect,
  adminOrSuperAdmin,
  leaderOrAdmin,
} = require("../middleware/auth");

// Every route on this router requires login.
router.use(protect);

// ── Digital Check-in/out/history/status — every employee's own record ──
router.post("/attendance/digital-checkin", adminController.digitalCheckIn);
router.post("/attendance/digital-checkout", adminController.digitalCheckOut);
router.get("/attendance/current/:userId", adminController.getCurrentAttendance);
router.get(
  "/digital-attendance/history/:userId",
  adminController.getDigitalHistory,
);

// ── Team Leader + Admin + Super Admin ────────────────────────────────
// Team Leaders are automatically clamped to THEIR OWN TEAM inside the
// controllers (adminDataController / adminController); admins and super
// admins remain unrestricted.
router.get("/data/:dataType", leaderOrAdmin, adminDataController.getData);
router.post(
  "/data/:dataType/bulk-action",
  leaderOrAdmin,
  adminDataController.bulkAction,
);
router.post(
  "/data/:dataType/export",
  leaderOrAdmin,
  adminDataController.exportData,
);
router.delete(
  "/data/:dataType/:id",
  leaderOrAdmin,
  adminDataController.deleteItem,
);

router.get(
  "/digital-attendance",
  leaderOrAdmin,
  adminController.getDigitalAttendances,
);
router.put(
  "/digital-attendance/:id/verify",
  leaderOrAdmin,
  adminController.verifyDigitalAttendance,
);

router.get("/alerts", leaderOrAdmin, adminController.getAlerts);
router.put("/alerts/:id/resolve", leaderOrAdmin, adminController.resolveAlert);

// ── Org-wide bulk mutations stay Admin / Super Admin only ────────────
router.post(
  "/digital-attendance/bulk-action",
  adminOrSuperAdmin,
  adminController.bulkAction,
);
router.post(
  "/alerts/bulk-action",
  adminOrSuperAdmin,
  adminController.bulkAction,
);

module.exports = router;
