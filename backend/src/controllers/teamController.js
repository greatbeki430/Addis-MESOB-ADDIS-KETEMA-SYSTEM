// backend/src/controllers/teamController.js
const Team = require("../models/Team");
const User = require("../models/User");

// Create Team
const createTeam = async (req, res) => {
  try {
    const { name, department, members = [] } = req.body;

    // Create the team
    const team = await Team.create({
      name,
      leader: req.user._id,
      department,
      members: [req.user._id, ...members], // ✅ Add creator as member
    });

    // ✅ Update the creator's team field
    await User.findByIdAndUpdate(req.user._id, { team: team._id });

    // ✅ Update any members' team field
    if (members && members.length > 0) {
      await User.updateMany({ _id: { $in: members } }, { team: team._id });
    }

    // Return populated team
    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "name email")
      .populate("members", "name email");

    res.status(201).json(populatedTeam);
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

// ✅ Add update team function
const updateTeam = async (req, res) => {
  try {
    const { name, department, leader, members } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Update team details
    if (name) team.name = name;
    if (department) team.department = department;
    if (leader) team.leader = leader;

    // Update members
    if (members) {
      // Remove team from old members
      await User.updateMany(
        { _id: { $in: team.members } },
        { $unset: { team: "" } },
      );

      team.members = members;

      // Add team to new members
      await User.updateMany({ _id: { $in: members } }, { team: team._id });
    }

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "name email")
      .populate("members", "name email");

    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Add delete team function
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Remove team from all members
    await User.updateMany(
      { _id: { $in: team.members } },
      { $unset: { team: "" } },
    );

    await team.deleteOne();
    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
};
