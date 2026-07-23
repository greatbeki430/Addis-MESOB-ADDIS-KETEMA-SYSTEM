// backend/src/routes/registrationRoutes.js
const express = require("express");
const router = express.Router();
const PendingRegistration = require("../models/PendingRegistration");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");
const { approveRegistration, rejectRegistration } = require("../services/telegramService");

// GET /api/registrations/pending - Get all pending registrations
router.get("/pending", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const registrations = await PendingRegistration.find({
      status: "pending_approval",
    }).sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    console.error("Error fetching pending registrations:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/registrations/:id/approve - Approve a registration
router.put("/:id/approve", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const reviewer = {
      _id: req.user._id,
      name: req.user.name || req.user.email,
    };
    const result = await approveRegistration(req.params.id, reviewer);
    res.json({
      success: true,
      message: "Registration approved successfully",
      pending: result.pending,
      user: result.user,
    });
  } catch (error) {
    console.error("Error approving registration:", error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/registrations/:id/reject - Reject a registration
router.put("/:id/reject", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const reviewer = {
      _id: req.user._id,
      name: req.user.name || req.user.email,
    };
    const result = await rejectRegistration(req.params.id, reviewer, reason);
    res.json({
      success: true,
      message: "Registration rejected",
      pending: result,
    });
  } catch (error) {
    console.error("Error rejecting registration:", error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
