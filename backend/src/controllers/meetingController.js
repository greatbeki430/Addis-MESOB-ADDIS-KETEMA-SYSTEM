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
      .populate("present", "name email")
      .populate("absent.member", "name email")
      .sort({ date: -1 });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate("present", "name email")
      .populate("absent.member", "name email");
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➕ ADD UPDATE MEETING
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user is authorized (creator or admin)
    if (
      meeting.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this meeting" });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.json(updatedMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ➕ ADD DELETE MEETING
const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user is authorized
    if (
      meeting.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this meeting" });
    }

    await meeting.deleteOne();
    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
};
