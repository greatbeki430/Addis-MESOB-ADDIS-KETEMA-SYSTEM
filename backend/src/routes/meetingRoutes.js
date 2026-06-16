const express = require("express");
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");
const {
  protect,
  leaderOrAdmin,
  adminOrSuperAdmin,
} = require("../middleware/auth"); // ✅ Add leaderOrAdmin and adminOrSuperAdmin here

const router = express.Router();

// router.post("/", protect, createMeeting);
router.post("/", protect, leaderOrAdmin, createMeeting); // only leaders/admins can create
// router.get("/team/:teamId", protect, getMeetings);
router.get("/team/:teamId", protect, getMeetings); // all can view
router.get("/:id", protect, getMeetingById);
router.put("/:id", protect, updateMeeting);
// router.delete("/:id", protect, deleteMeeting);
router.delete("/:id", protect, adminOrSuperAdmin, deleteMeeting); // only admin can delete

module.exports = router;
