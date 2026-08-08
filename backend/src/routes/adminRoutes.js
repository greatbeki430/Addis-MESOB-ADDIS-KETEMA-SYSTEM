// backend/src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminDataController = require("../controllers/adminDataController");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");

// Every route on this router requires login. Admin-tier restriction is
// applied per-route-group below instead of globally — the self-service
// digital check-in/out endpoints are for EVERY employee, not just admins.
router.use(protect);

// ── Digital Check-in/out/history/status — every employee's own record ──
// ⚠️ Previously these sat behind a blanket `router.use(adminOrSuperAdmin)`,
// which meant no employee or team leader could ever check themselves in or
// out digitally, or see their own check-in history — despite the frontend
// Digital Attendance page (open to everyone) calling exactly these routes.
// Ownership is now enforced inside the controller (self, or admin/superadmin
// acting on someone's behalf) instead of blocking the whole role.
router.post("/attendance/digital-checkin", adminController.digitalCheckIn);
router.post("/attendance/digital-checkout", adminController.digitalCheckOut);
router.get("/attendance/current/:userId", adminController.getCurrentAttendance);
router.get(
  "/digital-attendance/history/:userId",
  adminController.getDigitalHistory,
);

// ── Everything below is genuine admin/superadmin oversight ──
router.use(adminOrSuperAdmin);

// ── Admin Data Management (Evaluations / Daily Reports / Forum Reports) ──
// These back the "Manage ..." admin pages, which previously called an
// endpoint that didn't exist on the backend at all.
router.get("/data/:dataType", adminDataController.getData);
router.post("/data/:dataType/bulk-action", adminDataController.bulkAction);
router.post("/data/:dataType/export", adminDataController.exportData);
router.delete("/data/:dataType/:id", adminDataController.deleteItem);

// ── Digital Attendance Routes (org-wide oversight) ──
router.get("/digital-attendance", adminController.getDigitalAttendances);
router.put(
  "/digital-attendance/:id/verify",
  adminController.verifyDigitalAttendance,
);
router.post("/digital-attendance/bulk-action", adminController.bulkAction);

// ── Alert Routes ──
router.get("/alerts", adminController.getAlerts);
router.put("/alerts/:id/resolve", adminController.resolveAlert);
router.post("/alerts/bulk-action", adminController.bulkAction);

module.exports = router;
