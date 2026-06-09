const Team = require("../models/Team");
const User = require("../models/User");

// Create Team
const createTeam = async (req, res) => {
  try {
    const { name, department } = req.body;
    const team = await Team.create({
      name,
      leader: req.user._id,
      department,
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teams
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("leader", "name email")
      .populate("members", "name email");
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get team by ID
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("leader")
      .populate("members");
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTeam, getTeams, getTeamById };
