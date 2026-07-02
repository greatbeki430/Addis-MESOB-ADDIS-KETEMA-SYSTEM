// backend/src/controllers/serviceController.js
const Service = require("../models/Service");
const SERVICES = require("../constants/services");
const cloudinary = require("../config/cloudinary");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// ============================================================
// GET /api/services
// Get all services with pagination, search, and filtering
// ============================================================
const getServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      dept = "",
      active,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { nameEn: { $regex: search, $options: "i" } },
        { dept: { $regex: search, $options: "i" } },
        { deptEn: { $regex: search, $options: "i" } },
      ];
    }
    if (dept) filter.dept = dept;
    if (active !== undefined) filter.active = active === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [services, total] = await Promise.all([
      Service.find(filter).sort(sortOptions).skip(skip).limit(parseInt(limit)),
      Service.countDocuments(filter),
    ]);

    // ✅ Get unique departments for filter dropdown
    const departments = await Service.distinct("dept");

    res.json({
      services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      departments,
      filters: { search, dept, active },
    });
  } catch (error) {
    console.error("Get services error:", error);
    res
      .status(500)
      .json({ message: error.message, code: "GET_SERVICES_ERROR" });
  }
};

// ============================================================
// POST /api/services/seed
// Safe seed - UPSERT, never deletes existing data
// ============================================================
const seedServices = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      details: [],
    };

    // ✅ Use bulkWrite with upsert - safe, never deletes
    const operations = SERVICES.map((service) => ({
      updateOne: {
        filter: {
          // ✅ Match by unique combination: name + dept
          name: service.name,
          dept: service.dept,
        },
        update: {
          $set: {
            nameEn: service.nameEn || service.name,
            deptEn: service.deptEn || service.dept,
            active: service.active !== undefined ? service.active : true,
            stdTime: service.stdTime || "",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await Service.bulkWrite(operations, { ordered: false });

    // ✅ Parse bulkWrite results
    results.added = result.upsertedCount || 0;
    results.updated = result.modifiedCount || 0;
    results.skipped =
      SERVICES.length -
      (result.upsertedCount || 0) -
      (result.modifiedCount || 0);

    console.log(
      `📊 Seed results: ${results.added} added, ${results.updated} updated, ${results.skipped} skipped`,
    );

    res.status(200).json({
      message: "✅ Services seeded successfully!",
      ...results,
      total: SERVICES.length,
    });
  } catch (error) {
    console.error("Seed services error:", error);
    res.status(500).json({ message: error.message, code: "SEED_ERROR" });
  }
};

// ============================================================
// POST /api/services/import-excel
// Import services from Excel/CSV file
// ============================================================
const importServicesFromExcel = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data || data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "File is empty" });
    }

    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      details: [],
      duplicates: [],
    };

    // ✅ Map Excel columns to service schema
    const operations = [];
    const duplicateCheck = new Map();

    for (const row of data) {
      // ✅ Map columns (support different column names)
      const name =
        row.name ||
        row.service ||
        row.Service ||
        row.Name ||
        row["Service Name"];
      const dept =
        row.dept ||
        row.department ||
        row.Department ||
        row.Dept ||
        row["Department"];
      const nameEn =
        row.nameEn ||
        row.serviceEn ||
        row["Service Name (English)"] ||
        row["Service (English)"] ||
        name;
      const deptEn =
        row.deptEn ||
        row.departmentEn ||
        row["Department (English)"] ||
        row["Dept (English)"] ||
        dept;
      const active = row.active !== undefined ? row.active : true;
      const stdTime =
        row.stdTime || row["Standard Time"] || row["Std Time"] || "";

      if (!name || !dept) {
        results.errors.push({ row, error: "Missing name or department" });
        continue;
      }

      // ✅ Check for duplicates in the import file
      const key = `${name}|${dept}`;
      if (duplicateCheck.has(key)) {
        results.duplicates.push({
          name,
          dept,
          message: "Duplicate in import file",
        });
        continue;
      }
      duplicateCheck.set(key, true);

      operations.push({
        updateOne: {
          filter: { name, dept },
          update: {
            $set: {
              nameEn: nameEn || name,
              deptEn: deptEn || dept,
              active: active !== false,
              stdTime: stdTime || "",
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: "No valid services found in file",
        results,
      });
    }

    // ✅ Execute bulk write
    const result = await Service.bulkWrite(operations, { ordered: false });

    results.added = result.upsertedCount || 0;
    results.updated = result.modifiedCount || 0;
    results.skipped =
      operations.length -
      (result.upsertedCount || 0) -
      (result.modifiedCount || 0);

    // ✅ Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: "✅ Services imported successfully!",
      results,
      totalProcessed: operations.length,
    });
  } catch (error) {
    // ✅ Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    console.error("Import Excel error:", error);
    res.status(500).json({ message: error.message, code: "IMPORT_ERROR" });
  }
};

// ============================================================
// POST /api/services/preview-import
// Preview Excel import without saving
// ============================================================
const previewImport = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // ✅ Preview first 20 rows
    const preview = data.slice(0, 20).map((row) => ({
      name:
        row.name ||
        row.service ||
        row.Service ||
        row.Name ||
        row["Service Name"] ||
        "",
      department:
        row.dept ||
        row.department ||
        row.Department ||
        row.Dept ||
        row["Department"] ||
        "",
      nameEn:
        row.nameEn ||
        row.serviceEn ||
        row["Service Name (English)"] ||
        row["Service (English)"] ||
        "",
      departmentEn:
        row.deptEn ||
        row.departmentEn ||
        row["Department (English)"] ||
        row["Dept (English)"] ||
        "",
      active: row.active !== undefined ? row.active : true,
      stdTime: row.stdTime || row["Standard Time"] || row["Std Time"] || "",
    }));

    // ✅ Check for duplicates against existing services
    const existingServices = await Service.find({}).select("name dept").lean();
    const existingSet = new Set(
      existingServices.map((s) => `${s.name}|${s.dept}`),
    );

    const duplicates = data.filter((row) => {
      const name =
        row.name ||
        row.service ||
        row.Service ||
        row.Name ||
        row["Service Name"] ||
        "";
      const dept =
        row.dept ||
        row.department ||
        row.Department ||
        row.Dept ||
        row["Department"] ||
        "";
      return name && dept && existingSet.has(`${name}|${dept}`);
    });

    fs.unlinkSync(req.file.path);

    res.json({
      totalRows: data.length,
      preview,
      existingCount: existingServices.length,
      duplicatesFound: duplicates.length,
      columns: Object.keys(data[0] || {}),
    });
  } catch (error) {
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    console.error("Preview import error:", error);
    res.status(500).json({ message: error.message, code: "PREVIEW_ERROR" });
  }
};

// ============================================================
// POST /api/services - Add single service
// ============================================================
const addService = async (req, res) => {
  try {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "superadmin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin access required" });
    }

    const { dept, deptEn, name, nameEn, active, stdTime, image } = req.body;

    if (!dept || !name) {
      return res
        .status(400)
        .json({ message: "Department and Name are required" });
    }

    // ✅ Check for duplicate
    const existing = await Service.findOne({ name, dept });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Service already exists in this department" });
    }

    let imageUrl = "";
    let imagePublicId = "";

    if (image && image.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImage(image);
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      } catch (error) {
        return res.status(400).json({ message: "Failed to upload image" });
      }
    }

    const service = new Service({
      dept,
      deptEn: deptEn || dept,
      name,
      nameEn: nameEn || name,
      active: active !== undefined ? active : true,
      stdTime: stdTime || "",
      image: imageUrl,
      imagePublicId: imagePublicId,
    });

    await service.save();
    res.status(201).json({
      message: "✅ Service added successfully!",
      service,
    });
  } catch (error) {
    console.error("Add service error:", error);
    res.status(500).json({ message: error.message, code: "ADD_SERVICE_ERROR" });
  }
};

// ============================================================
// PUT /api/services/:id - Update service
// ============================================================
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

    const existingService = await Service.findById(id);
    if (!existingService) {
      return res.status(404).json({ message: "Service not found" });
    }

    // ✅ Handle image update with rollback
    if (updates.image) {
      if (updates.image.startsWith("data:image")) {
        if (existingService.imagePublicId) {
          await deleteImage(existingService.imagePublicId);
        }
        try {
          const uploadResult = await uploadImage(updates.image);
          updates.image = uploadResult.url;
          updates.imagePublicId = uploadResult.publicId;
        } catch (error) {
          return res.status(400).json({ message: "Failed to upload image" });
        }
      } else if (updates.image === "") {
        if (existingService.imagePublicId) {
          await deleteImage(existingService.imagePublicId);
        }
        updates.imagePublicId = "";
      }
    }

    const service = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "✅ Service updated successfully!",
      service,
    });
  } catch (error) {
    console.error("Update service error:", error);
    res
      .status(500)
      .json({ message: error.message, code: "UPDATE_SERVICE_ERROR" });
  }
};

// ============================================================
// DELETE /api/services/:id - Delete service
// ============================================================
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

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.imagePublicId) {
      await deleteImage(service.imagePublicId);
    }

    await Service.findByIdAndDelete(id);

    res.json({
      message: "✅ Service deleted successfully!",
    });
  } catch (error) {
    console.error("Delete service error:", error);
    res
      .status(500)
      .json({ message: error.message, code: "DELETE_SERVICE_ERROR" });
  }
};

// ============================================================
// HELPERS - Cloudinary Upload/Delete
// ============================================================
const uploadImage = async (base64Image) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "services",
      transformation: [
        { width: 200, height: 200, crop: "fill" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

const deleteImage = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`🗑️ Deleted image: ${publicId}`);
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};

module.exports = {
  getServices,
  seedServices,
  addService,
  updateService,
  deleteService,
  importServicesFromExcel,
  previewImport,
};
