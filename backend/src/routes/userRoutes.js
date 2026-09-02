// backend/src/routes/userRoutes.js
const express = require("express");
const { protect, adminOrSuperAdmin, anyRole } = require("../middleware/auth");
const User = require("../models/User");
const Team = require("../models/Team");

const router = express.Router();

// ──────────────────────────────────────────────────────────────
// 👤 GET ALL USERS - Admin/SuperAdmin only
// ──────────────────────────────────────────────────────────────
router.get("/", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("team", "name");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 👤 GET SINGLE USER - Any authenticated user can view
// ──────────────────────────────────────────────────────────────
router.get("/:id", protect, anyRole, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("team", "name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// ⭐ GOLDEN MONDAY ADMIN TOGGLE - Admin/SuperAdmin only
// Grants/revokes leader-level access scoped ONLY to Golden Monday
// routes (see goldenMondayAdminOrAbove middleware). Kept as its own
// endpoint, separate from the general profile-edit route, so it's an
// explicit, auditable action rather than something that can be
// silently overwritten by an unrelated form save.
// ──────────────────────────────────────────────────────────────
router.put(
  "/:id/golden-monday-admin",
  protect,
  adminOrSuperAdmin,
  async (req, res) => {
    try {
      const { isGoldenMondayAdmin } = req.body;
      if (typeof isGoldenMondayAdmin !== "boolean") {
        return res
          .status(400)
          .json({ message: "isGoldenMondayAdmin (boolean) is required" });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.isGoldenMondayAdmin = isGoldenMondayAdmin;
      await user.save();

      const populatedUser = await User.findById(user._id)
        .select("-password")
        .populate("team", "name");

      res.json(populatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// ──────────────────────────────────────────────────────────────
// ✏️ UPDATE USER - Admin/SuperAdmin only
// ──────────────────────────────────────────────────────────────
router.put("/:id", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const { name, email, role, phone, team } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // ⚠️ The frontend's Edit User form already limits a plain "admin" to
    // only assigning Employee/Team Leader roles (getAvailableRoles() in
    // UserManagement.jsx), but that was never enforced here — meaning
    // anyone hitting this API directly as an "admin" could hand out (or
    // take) Admin/Super Admin access. Enforcing the same rule server-side:
    // only a Super Admin can grant Admin/Super Admin, or edit an existing
    // Admin/Super Admin account at all.
    const RANK = { employee: 1, leader: 2, admin: 3, superadmin: 4 };
    const isSuperAdminCaller = req.user.role === "superadmin";

    if (!isSuperAdminCaller) {
      if (
        (user.role === "admin" || user.role === "superadmin") &&
        user._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message:
            "Only a Super Admin can modify an Admin or Super Admin account",
        });
      }
      if (role && RANK[role] >= RANK.admin) {
        return res.status(403).json({
          message:
            "Only a Super Admin can assign the Admin or Super Admin role",
        });
      }
    }

    // Prevent demoting last superadmin
    if (user.role === "superadmin" && role !== "superadmin") {
      const superAdminCount = await User.countDocuments({ role: "superadmin" });
      if (superAdminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot demote the last Super Admin" });
      }
    }

    // ✅ If team is changing, update both user and team members
    if (team !== undefined && team !== user.team?.toString()) {
      // Remove user from old team
      if (user.team) {
        await Team.findByIdAndUpdate(user.team, {
          $pull: { members: user._id },
        });
      }
      // Add user to new team
      if (team) {
        await Team.findByIdAndUpdate(team, {
          $addToSet: { members: user._id },
        });
        user.team = team;
      } else {
        user.team = null;
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.phone = phone || user.phone;

    await user.save();

    const populatedUser = await User.findById(user._id)
      .select("-password")
      .populate("team", "name");

    res.json(populatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 🗑️ DELETE USER - SuperAdmin only
// ──────────────────────────────────────────────────────────────
router.delete("/:id", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent deleting the last superadmin
    if (user.role === "superadmin") {
      const superAdminCount = await User.countDocuments({ role: "superadmin" });
      if (superAdminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Cannot delete the last Super Admin" });
      }
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    // ✅ Remove user from team
    if (user.team) {
      await Team.findByIdAndUpdate(user.team, {
        $pull: { members: user._id },
      });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
