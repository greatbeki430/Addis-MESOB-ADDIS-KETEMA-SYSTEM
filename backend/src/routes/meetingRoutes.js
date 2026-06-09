const express = require("express");
const {
  createMeeting,
  getMeetings,
  getMeetingById,
} = require("../controllers/meetingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createMeeting);
router.get("/team/:teamId", protect, getMeetings);
router.get("/:id", protect, getMeetingById);

module.exports = router;
