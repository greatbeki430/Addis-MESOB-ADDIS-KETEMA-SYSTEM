const Service = require("../models/Service");
const SERVICES = require("../constants/services"); // ✅ Import from shared constants

// ✅ Get all services
const getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Seed services - Bulk import (clears existing and inserts new)
const seedServices = async (req, res) => {
  try {
    // Check if user is admin/superadmin
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    // Clear existing services
    await Service.deleteMany({});
    console.log("🗑️ Cleared existing services");

    // Insert all services from shared constants
    const result = await Service.insertMany(SERVICES);

    res.status(201).json({
      message: `✅ ${result.length} services seeded successfully!`,
      count: result.length,
      services: result,
    });
  } catch (error) {
    console.error("Seed services error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Add a single service (via UI)
const addService = async (req, res) => {
  try {
    // Check if user is admin/superadmin
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { dept, deptEn, name, nameEn, active, stdTime } = req.body;

    // Validate required fields
    if (!dept || !name) {
      return res
        .status(400)
        .json({ message: "Department and Name are required" });
    }

    // Check if service already exists
    const existing = await Service.findOne({ name, dept });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Service already exists in this department" });
    }

    const service = new Service({
      dept,
      deptEn: deptEn || dept,
      name,
      nameEn: nameEn || name,
      active: active !== undefined ? active : true,
      stdTime: stdTime || "",
    });

    await service.save();
    res.status(201).json({
      message: "✅ Service added successfully!",
      service,
    });
  } catch (error) {
    console.error("Add service error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update a service
const updateService = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { id } = req.params;
    const updates = req.body;

    const service = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({
      message: "✅ Service updated successfully!",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete a service
const deleteService = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({
      message: "✅ Service deleted successfully!",
      service,
    });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  seedServices,
  addService,
  updateService,
  deleteService,
};
