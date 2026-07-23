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
    role: role || "member",
    phone,
    ...(telegramChatId ? { telegramChatId } : {}),
  });

  return user;
};

// @desc    Register user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const user = await createUserAccount({
      name,
      email,
      password,
      role,
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    if (error.code === "USER_EXISTS") {
      return res.status(400).json({ message: "User already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// module.exports = { registerUser, loginUser, getMe };
module.exports = { registerUser, loginUser, getMe, createUserAccount };
