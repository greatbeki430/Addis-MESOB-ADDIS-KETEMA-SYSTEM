// backend/src/routes/serviceRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  getServices,
  seedServices,
  addService,
  updateService,
  deleteService,
  importServicesFromExcel,
  previewImport,
} = require("../controllers/serviceController");
const { protect, adminOrSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// ✅ Configure multer for Excel file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    // ✅ Create uploads directory if it doesn't exist
    if (!require("fs").existsSync(uploadDir)) {
      require("fs").mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `services-${uniqueSuffix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel and CSV files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// ─── Routes ────────────────────────────────────────────────────

// GET /api/services - Get all services (with pagination, search, filter)
router.get("/", getServices);

// ⚠️ These write endpoints previously required only `protect` (any logged-in
// user), meaning any employee could edit or delete the entire service
// catalog via a direct API call, even though the catalog-management UI
// (Service Manager) is restricted to admin/superadmin. Locking these down
// to match — nothing user-facing calls these except that admin page.

// POST /api/services/seed - Safe seed (UPSERT, never deletes)
router.post("/seed", protect, adminOrSuperAdmin, seedServices);

// POST /api/services/preview-import - Preview Excel import
router.post(
  "/preview-import",
  protect,
  adminOrSuperAdmin,
  upload.single("file"),
  previewImport,
);

// POST /api/services/import-excel - Import from Excel/CSV
router.post(
  "/import-excel",
  protect,
  adminOrSuperAdmin,
  upload.single("file"),
  importServicesFromExcel,
);

// POST /api/services - Add single service
router.post("/", protect, adminOrSuperAdmin, addService);

// PUT /api/services/:id - Update service
router.put("/:id", protect, adminOrSuperAdmin, updateService);

// DELETE /api/services/:id - Delete service
router.delete("/:id", protect, adminOrSuperAdmin, deleteService);

module.exports = router;
