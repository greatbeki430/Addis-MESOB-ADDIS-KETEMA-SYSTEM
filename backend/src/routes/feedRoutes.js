// backend/routes/feedRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getUnifiedFeed,
  getFeedItemById,
} = require("../controllers/feedController");

// All routes require authentication
router.use(protect);

// Get unified feed (daily + forum reports)
router.get("/", getUnifiedFeed);

// Get single feed item by ID and type
router.get("/:type/:id", getFeedItemById);

module.exports = router;
