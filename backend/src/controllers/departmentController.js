// backend/src/controllers/departmentController.js
// CRUD for the standalone Department registry, plus a helper to show
// how many employees (GoldenMondayPresenter roster entries) currently
// sit in each department — since department assignment on an employee
// is still just a free-text string, this join is done in application
// code rather than a real foreign key.

const Department = require("../models/Department");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");

// ============================================================
// GET /api/departments
// List all departments, with a live employee headcount attached.
// ============================================================
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });

    // Count employees per department name in one pass rather than
    // N queries.
    const counts = await GoldenMondayPresenter.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      if (c._id) countMap[c._id] = c.count;
    });

    const withCounts = departments.map((d) => ({
      ...d.toObject(),
      employeeCount: countMap[d.name] || 0,
    }));

    res.json(withCounts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load departments", error: error.message });
  }
};

// ============================================================
// GET /api/departments/:id
// ============================================================
const getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department)
      return res.status(404).json({ message: "Department not found" });
    res.json(department);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load department", error: error.message });
  }
};

// ============================================================
// POST /api/departments  { name, description?, head?, headName? }
// ============================================================
const createDepartment = async (req, res) => {
  try {
    const { name, description, head, headName } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const existing = await Department.findOne({
      name: new RegExp(`^${name.trim()}$`, "i"),
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A department with this name already exists" });
    }

    const department = await Department.create({
      name: name.trim(),
      description: description || "",
      head: head || null,
      headName: headName || "",
      createdBy: req.user._id,
      createdByName: req.user.name,
    });

    res.status(201).json(department);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create department", error: error.message });
  }
};

// ============================================================
// PUT /api/departments/:id  { name?, description?, head?, headName?, isActive? }
// ============================================================
const updateDepartment = async (req, res) => {
  try {
    const { name, description, head, headName, isActive } = req.body;
    const update = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res
          .status(400)
          .json({ message: "Department name cannot be empty" });
      }
      const existing = await Department.findOne({
        name: new RegExp(`^${name.trim()}$`, "i"),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res
          .status(409)
          .json({ message: "A department with this name already exists" });
      }
      update.name = name.trim();
    }
    if (description !== undefined) update.description = description;
    if (head !== undefined) update.head = head || null;
    if (headName !== undefined) update.headName = headName;
    if (isActive !== undefined) update.isActive = isActive;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );
    if (!department)
      return res.status(404).json({ message: "Department not found" });

    // If the department was renamed, keep existing employee records in
    // sync so headcounts and filters don't silently orphan.
    if (name !== undefined && update.name) {
      const oldDept = await Department.findById(req.params.id).select("name");
      if (oldDept && oldDept.name !== update.name) {
        await GoldenMondayPresenter.updateMany(
          { department: oldDept.name },
          { $set: { department: update.name } },
        );
      }
    }

    res.json(department);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update department", error: error.message });
  }
};

// ============================================================
// DELETE /api/departments/:id
// Refuses to delete if employees are still assigned to it — caller
// should reassign or deactivate instead.
// ============================================================
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department)
      return res.status(404).json({ message: "Department not found" });

    const employeeCount = await GoldenMondayPresenter.countDocuments({
      department: department.name,
    });
    if (employeeCount > 0) {
      return res.status(409).json({
        message: `Cannot delete: ${employeeCount} employee(s) are still assigned to this department. Reassign them first or deactivate the department instead.`,
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete department", error: error.message });
  }
};

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
