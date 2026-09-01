// backend/src/controllers/teamController.js
const Team = require("../models/Team");
const User = require("../models/User");

// Create Team
const createTeam = async (req, res) => {
  try {
    const { name, department, leader, members = [] } = req.body;

    // ✅ Use the provided leader ID, fallback to creator if not provided
    const leaderId = leader || req.user._id;

    // ✅ Verify the leader exists
    const leaderUser = await User.findById(leaderId);
    if (!leaderUser) {
      return res.status(404).json({ message: "Leader not found" });
    }

    // ✅ Check if the selected leader is already leading another team
    const existingLeaderTeam = await Team.findOne({ leader: leaderId });
    if (existingLeaderTeam) {
      return res.status(400).json({
        message: `User "${leaderUser.name}" is already a leader of team "${existingLeaderTeam.name}". A user can only lead one team.`,
      });
    }

    // Create the team
    const team = await Team.create({
      name,
      leader: leaderId,
      department: department || "",
      members: [leaderId, ...members],
      createdBy: req.user._id,
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
      .populate("leader", "name email role profilePhotoUrl")
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

    // ✅ Handle leader change properly
    if (leader && leader !== team.leader.toString()) {
      // Check if the new leader is already leading another team
      const existingLeaderTeam = await Team.findOne({
        leader: leader,
        _id: { $ne: team._id },
      });
      if (existingLeaderTeam) {
        const newLeaderUser = await User.findById(leader);
        return res.status(400).json({
          message: `User "${newLeaderUser?.name || "Unknown"}" is already a leader of team "${existingLeaderTeam.name}". A user can only lead one team.`,
        });
      }

      const oldLeaderId = team.leader;
      team.leader = leader;
      await User.findByIdAndUpdate(leader, { team: team._id });

      // If old leader is not in members list, add them back as member
      if (!team.members.includes(oldLeaderId)) {
        team.members.push(oldLeaderId);
        await User.findByIdAndUpdate(oldLeaderId, { team: team._id });
      }
    }

    // Update members
    if (members) {
      const oldMemberIds = team.members.filter(
        (id) =>
          !members.includes(id.toString()) &&
          id.toString() !== team.leader.toString(),
      );
      if (oldMemberIds.length > 0) {
        await User.updateMany(
          { _id: { $in: oldMemberIds } },
          { $unset: { team: "" } },
        );
      }

      const newMemberIds = members.filter(
        (id) =>
          !team.members.includes(id) &&
          id.toString() !== team.leader.toString(),
      );
      if (newMemberIds.length > 0) {
        await User.updateMany(
          { _id: { $in: newMemberIds } },
          { team: team._id },
        );
      }

      team.members = members;
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
