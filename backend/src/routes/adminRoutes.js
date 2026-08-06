// backend/src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminDataController = require("../controllers/adminDataController");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");

// All routes require authentication and admin/superadmin role
router.use(protect);
router.use(adminOrSuperAdmin);

// ── Admin Data Management (Evaluations / Daily Reports / Forum Reports) ──
// These back the "Manage ..." admin pages, which previously called an
// endpoint that didn't exist on the backend at all.
router.get("/data/:dataType", adminDataController.getData);
router.post("/data/:dataType/bulk-action", adminDataController.bulkAction);
router.post("/data/:dataType/export", adminDataController.exportData);
router.delete("/data/:dataType/:id", adminDataController.deleteItem);

// ── Digital Attendance Routes ──
router.get("/digital-attendance", adminController.getDigitalAttendances);
router.get(
  "/digital-attendance/history/:userId",
  adminController.getDigitalHistory,
);
router.put(
  "/digital-attendance/:id/verify",
  adminController.verifyDigitalAttendance,
);
router.post("/digital-attendance/bulk-action", adminController.bulkAction);

// ── Digital Check-in/out (Employees) ──
router.post("/attendance/digital-checkin", adminController.digitalCheckIn);
router.post("/attendance/digital-checkout", adminController.digitalCheckOut);
router.get("/attendance/current/:userId", adminController.getCurrentAttendance);

// ── Alert Routes ──
router.get("/alerts", adminController.getAlerts);
router.put("/alerts/:id/resolve", adminController.resolveAlert);
router.post("/alerts/bulk-action", adminController.bulkAction);

module.exports = router;
