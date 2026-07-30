// backend/src/controllers/authController.js
const User = require("../models/User");
const { generateToken } = require("../config/jwt");
const bcrypt = require("bcryptjs");

/**
 * Core account-creation logic, usable outside of an HTTP request/response
 * cycle (e.g. from the Telegram registration approval flow). Throws on
 * failure — callers decide how to surface that (HTTP response, Telegram
 * message, etc). Password hashing still happens via the User model's
 * existing pre-save hook — nothing about that changes.
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
    ...(telegramChatId ? { telegramChatId } : {}),
    ...(profilePhotoUrl ? { profilePhotoUrl } : {}),
    ...(profilePhotoPublicId ? { profilePhotoPublicId } : {}),
  });

  return user;
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, branch } = req.body;
    const user = await createUserAccount({
      name,
      email,
      password,
      role,
      phone,
      branch,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhotoUrl: user.profilePhotoUrl || "",
      branch: user.branch || "Addis Ketema",
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
    team: user.team
      ? {
          _id: user.team._id,
          name: user.team.name,
          department: user.team.department || "",
        }
      : null,
  });
};

module.exports = { registerUser, loginUser, getMe, createUserAccount };
