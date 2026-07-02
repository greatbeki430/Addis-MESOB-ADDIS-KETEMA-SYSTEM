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
const { protect } = require("../middleware/auth");

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

// POST /api/services/seed - Safe seed (UPSERT, never deletes)
router.post("/seed", protect, seedServices);

// POST /api/services/preview-import - Preview Excel import
router.post("/preview-import", protect, upload.single("file"), previewImport);

// POST /api/services/import-excel - Import from Excel/CSV
router.post(
  "/import-excel",
  protect,
  upload.single("file"),
  importServicesFromExcel,
);

// POST /api/services - Add single service
router.post("/", protect, addService);

// PUT /api/services/:id - Update service
router.put("/:id", protect, updateService);

// DELETE /api/services/:id - Delete service
router.delete("/:id", protect, deleteService);

module.exports = router;
