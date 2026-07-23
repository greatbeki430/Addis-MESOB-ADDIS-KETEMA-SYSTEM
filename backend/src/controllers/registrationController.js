// backend/src/controllers/registrationController.js
const PendingRegistration = require("../models/PendingRegistration");
const {
  approveRegistration,
  rejectRegistration,
} = require("../services/telegramService");

// GET /api/registrations?status=pending_approval
const listRegistrations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const registrations = await PendingRegistration.find(filter).sort({
      createdAt: -1,
    });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/registrations/:id/approve
const approve = async (req, res) => {
  try {
    const { pending, user } = await approveRegistration(
      req.params.id,
      req.user,
    );
    res.json({ pending, userId: user._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/registrations/:id/reject
const reject = async (req, res) => {
  try {
    const pending = await rejectRegistration(
      req.params.id,
      req.user,
      req.body.reason,
    );
    res.json(pending);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { listRegistrations, approve, reject };
