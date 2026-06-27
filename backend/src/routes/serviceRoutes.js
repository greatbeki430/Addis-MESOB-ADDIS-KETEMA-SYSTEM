// backend/routes/serviceRoutes.js
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

router.get("/", getServices);
router.post("/seed", protect, seedServices);
router.post("/", protect, addService);
router.put("/:id", protect, updateService);
router.delete("/:id", protect, deleteService);

module.exports = router;
