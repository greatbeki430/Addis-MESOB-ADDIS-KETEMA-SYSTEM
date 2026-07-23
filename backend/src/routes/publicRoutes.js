// backend/src/routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const Service = require("../models/Service");

// GET /api/public/services - Public endpoint (no auth required)
// Shows only active services for the landing page
router.get("/services", async (req, res) => {
  try {
    const { page = 1, limit = 12, search, department } = req.query;

    const query = { active: true }; // Only show active services

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { nameEn: { $regex: search, $options: "i" } },
        { dept: { $regex: search, $options: "i" } },
        { deptEn: { $regex: search, $options: "i" } },
      ];
    }

    // Department filter
    if (department && department !== "All") {
      query.dept = department;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      Service.find(query).skip(skip).limit(parseInt(limit)).sort({ name: 1 }),
      Service.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: services,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching public services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch services",
    });
  }
});

// GET /api/public/services/departments - Get all departments for filter
router.get("/services/departments", async (req, res) => {
  try {
    // Get distinct departments from active services only
    const departments = await Service.distinct("dept", { active: true });
    const departmentsEn = await Service.distinct("deptEn", { active: true });

    // Combine and deduplicate
    const allDepts = [...new Set([...departments, ...departmentsEn])].filter(
      Boolean,
    );

    res.json({
      success: true,
      data: allDepts,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch departments",
    });
  }
});

module.exports = router;
