const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - verify token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

// Leader or Admin
const leaderOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "leader" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as team leader" });
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
    res.status(403).json({ message: "Not authorized" });
  }
};
// Any authenticated user (employee and above)
const anyRole = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized" });
  }
};

// module.exports = { protect, admin, leaderOrAdmin };
module.exports = { protect, admin, leaderOrAdmin, adminOrSuperAdmin, anyRole };
