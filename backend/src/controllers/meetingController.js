const Meeting = require("../models/Meeting");

// Create Acha Forum Meeting Report
const createMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all meetings for a team
const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ team: req.params.teamId })
      .populate("present", "name")
      .populate("absent.member", "name")
      .sort({ date: -1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("present")
      .populate("absent.member");
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createMeeting, getMeetings, getMeetingById };
