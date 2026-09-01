// backend/src/controllers/teamController.js
const Team = require("../models/Team");
const User = require("../models/User");

// Create Team
const createTeam = async (req, res) => {
  try {
    const { name, department, leader, members = [] } = req.body;

    // ✅ FIX: Use the provided leader ID, fallback to creator if not provided
    const leaderId = leader || req.user._id;

    // Create the team
    const team = await Team.create({
      name,
      leader: leaderId, // ✅ Use the selected leader from form
      department,
      members: [leaderId, ...members], // ✅ Add leader as member
      createdBy: req.user._id, // ✅ Track who created it
    });

    // ✅ Update the leader's team field
    await User.findByIdAndUpdate(leaderId, { team: team._id });

    // ✅ Update any members' team field (excluding leader since already updated)
    const memberIds = members.filter(
      (id) => id.toString() !== leaderId.toString(),
    );
    if (memberIds.length > 0) {
      await User.updateMany({ _id: { $in: memberIds } }, { team: team._id });
    }

    // Return populated team
    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "name email role")
      .populate("members", "name email role")
      .populate("createdBy", "name email");

    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all teams
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("leader", "name email role profilePhotoUrl")
      .populate("members", "name email role")
      .populate("createdBy", "name email");
    res.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get team by ID
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("leader", "name email role profilePhotoUrl")
      .populate("members", "name email role")
      .populate("createdBy", "name email");
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update team
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

    // ✅ FIX: Handle leader change properly
    if (leader && leader !== team.leader.toString()) {
      // Remove old leader from members if they were added as member
      // (Keep them in members if they were already there)

      // Update new leader
      team.leader = leader;
      await User.findByIdAndUpdate(leader, { team: team._id });
    }

    // Update members
    if (members) {
      // Remove team from old members (except leader)
      const oldMemberIds = team.members.filter(
        (id) => id.toString() !== team.leader.toString(),
      );
      if (oldMemberIds.length > 0) {
        await User.updateMany(
          { _id: { $in: oldMemberIds } },
          { $unset: { team: "" } },
        );
      }

      team.members = members;

      // Add team to new members
      const memberIds = members.filter(
        (id) => id.toString() !== team.leader.toString(),
      );
      if (memberIds.length > 0) {
        await User.updateMany({ _id: { $in: memberIds } }, { team: team._id });
      }
    }

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "name email role profilePhotoUrl")
      .populate("members", "name email role")
      .populate("createdBy", "name email");

    res.json(populatedTeam);
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete team
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
    console.error("Error deleting team:", error);
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
