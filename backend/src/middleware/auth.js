// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - verify token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
      code: "NO_TOKEN",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    let message = "Not authorized, token failed";
    let code = "TOKEN_INVALID";

    if (error.name === "TokenExpiredError") {
      message = "Token expired, please login again";
      code = "TOKEN_EXPIRED";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token, please login again";
      code = "TOKEN_INVALID";
    }

    return res.status(401).json({ message, code });
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      message: "Not authorized as admin",
      code: "INSUFFICIENT_ROLE",
    });
  }
};

// Leader or Admin
const leaderOrAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "leader" ||
      req.user.role === "admin" ||
      req.user.role === "superadmin")
  ) {
    next();
  } else {
    res.status(403).json({
      message: "Not authorized as team leader",
      code: "INSUFFICIENT_ROLE",
    });
  }
};

// Super Admin or Admin
const adminOrSuperAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === "admin" || req.user.role === "superadmin")
  ) {
    next();
  } else {
    res.status(403).json({
      message: "Not authorized. Admin or Super Admin required.",
      code: "INSUFFICIENT_ROLE",
    });
  }
};

// Any authenticated user (employee and above)
const anyRole = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(403).json({
      message: "Not authorized",
      code: "INSUFFICIENT_ROLE",
    });
  }
};

module.exports = {
  protect,
  admin,
  leaderOrAdmin,
  adminOrSuperAdmin,
  anyRole,
};
