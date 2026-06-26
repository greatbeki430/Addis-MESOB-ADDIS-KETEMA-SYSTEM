const express = require("express");
const {
  getServices,
  seedServices,
  addService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getServices);

// Admin only routes
router.post("/seed", protect, seedServices);
router.post("/", protect, addService);
router.put("/:id", protect, updateService);
router.delete("/:id", protect, deleteService);

module.exports = router;
