const express = require("express");
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createMeeting);
router.get("/team/:teamId", protect, getMeetings);
router.get("/:id", protect, getMeetingById);
router.put("/:id", protect, updateMeeting);
router.delete("/:id", protect, deleteMeeting);

module.exports = router;
