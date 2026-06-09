const Service = require("../models/Service");

// Get all services
const getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Seed initial services (run once)
const seedServices = async (req, res) => {
  // You can put the SERVICES array from frontend here
  res.json({ message: "Services seeded" });
};

module.exports = { getServices, seedServices };
