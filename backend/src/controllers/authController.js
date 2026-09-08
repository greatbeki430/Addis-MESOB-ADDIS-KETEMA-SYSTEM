// backend/src/controllers/authController.js
const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const bcrypt = require("bcryptjs");
const Team = require("../models/Team");

/**
 * Core account-creation logic
 * ✅ FIXED: Include ALL fields including position
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
  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    const err = new Error("User already exists");
    err.code = "USER_EXISTS";
    throw err;
  }

  // Ensure password is provided
  if (!password) {
    const err = new Error("Password is required");
    err.code = "PASSWORD_REQUIRED";
    throw err;
  }

  // ✅ FIX: Include ALL fields in User.create()
  const user = await User.create({
    name,
    email,
    password, // ← This will be hashed by pre('save') hook
    role: role || "employee",
    phone: phone || "",
    branch: branch || "Addis Ketema",
    position: position || "", // ✅ ADDED position
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

  // ✅ DEBUG: Log the created user
  console.log(`✅ User created: ${user.email}`);
  console.log(`✅ Password hash: ${user.password.substring(0, 20)}...`);

  return user;
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, branch, position, team } =
      req.body;

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
    if (error.code === "PASSWORD_REQUIRED") {
      return res.status(400).json({ message: "Password is required" });
    }
    console.error("❌ Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ DEBUG: Log login attempt
    console.log(`🔐 Login attempt: ${email}`);

    const user = await User.findOne({ email }).populate(
      "team",
      "name department",
    );

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ DEBUG: Check password
    console.log(`🔐 Stored hash: ${user.password.substring(0, 20)}...`);
    console.log(`🔐 Password length: ${password.length}`);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔐 Password match: ${isMatch}`);

    if (isMatch) {
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
      console.log(`❌ Invalid password for: ${email}`);
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("❌ Login error:", error);
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

    user.password = newPassword;
    await user.save();

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

    user.password = newPassword;
    await user.save();

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
