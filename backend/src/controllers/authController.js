// backend/src/controllers/authController.js
const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const bcrypt = require("bcryptjs");
const Team = require("../models/Team");

/**
 * Core account-creation logic
 */
const createUserAccount = async ({
  name,
  email,
  password,
  role,
  phone,
  telegramChatId,
  profilePhotoUrl,
  profilePhotoPublicId,
  branch,
  position,
  team,
}) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    const err = new Error("User already exists");
    err.code = "USER_EXISTS";
    throw err;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "employee",
    phone,
    branch: branch || "Addis Ketema",
    position: position || "",
    team: team || null,
    ...(telegramChatId ? { telegramChatId } : {}),
    ...(profilePhotoUrl ? { profilePhotoUrl } : {}),
    ...(profilePhotoPublicId ? { profilePhotoPublicId } : {}),
  });

  if (team) {
    await Team.findByIdAndUpdate(team, {
      $addToSet: { members: user._id },
    });
  }

  return user;
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, branch, position, team } =
      req.body;

    // ⚠️ This route is now restricted to admin/superadmin callers (see
    // authRoutes.js), but a plain "admin" should still not be able to
    // mint another admin or a superadmin — only a superadmin can. Same
    // rule already enforced on PUT /auth/users/:id; applying it here too
    // now that this is reachable by an authenticated admin instead of
    // being wide open to anyone.
    const RANK = { employee: 1, leader: 2, admin: 3, superadmin: 4 };
    if (req.user.role !== "superadmin" && role && RANK[role] >= RANK.admin) {
      return res.status(403).json({
        message: "Only a Super Admin can assign the Admin or Super Admin role",
      });
    }

    const user = await createUserAccount({
      name,
      email,
      password,
      role,
      phone,
      branch,
      position,
      team,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhotoUrl: user.profilePhotoUrl || "",
      branch: user.branch || "Addis Ketema",
      position: user.position || "",
      team: user.team || null,
      token: generateToken(user._id),
    });
  } catch (error) {
    if (error.code === "USER_EXISTS") {
      return res.status(400).json({ message: "User already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate(
      "team",
      "name department",
    );

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhotoUrl: user.profilePhotoUrl || "",
        phone: user.phone || "",
        branch: user.branch || "Addis Ketema",
        position: user.position || "",
        team: user.team
          ? {
              _id: user.team._id,
              name: user.team.name,
              department: user.team.department || "",
            }
          : null,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "team",
    "name department",
  );
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhotoUrl: user.profilePhotoUrl || "",
    phone: user.phone || "",
    telegramChatId: user.telegramChatId || null,
    branch: user.branch || "Addis Ketema",
    position: user.position || "",
    team: user.team
      ? {
          _id: user.team._id,
          name: user.team.name,
          department: user.team.department || "",
        }
      : null,
  });
};

// ✅ Add this for completeness (though route is in authRoutes.js)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Password change error:", error);
    res.status(500).json({
      message: error.message || "Failed to change password",
    });
  }
};

// ─── ADMIN: Reset user password ─────────────────────────────
const resetUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    // Only admins can reset passwords
    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update using findByIdAndUpdate to ensure it works
    await User.findByIdAndUpdate(
      userId,
      { $set: { password: hashedPassword } },
      { new: true },
    );

    console.log(`🔑 Password reset for: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: `Password reset for ${user.name}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Password reset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN: Bulk reset passwords for all Team Leaders ──────
const bulkResetTeamLeaderPasswords = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await User.updateMany(
      { role: "leader" },
      { $set: { password: hashedPassword } },
    );

    console.log(`🔑 Bulk reset: Updated ${result.modifiedCount} team leaders`);

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} team leaders`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Bulk reset error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN: Reset password for a specific user by email ────
const resetPasswordByEmail = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Email and password (min 6 chars) are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: `User with email "${email}" not found` });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(
      user._id,
      { $set: { password: hashedPassword } },
      { new: true },
    );

    console.log(`🔑 Password reset for: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: `Password reset for ${user.name}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Password reset by email error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  createUserAccount,
  changePassword,
  resetUserPassword,
  bulkResetTeamLeaderPasswords,
  resetPasswordByEmail,
};
