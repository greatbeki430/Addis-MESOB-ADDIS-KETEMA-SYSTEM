const express = require("express");
const {
  getServices,
  seedServices,
} = require("../controllers/serviceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", getServices);
router.post("/seed", protect, seedServices);

module.exports = router;
