// backend/src/routes/goldenMondayRoutes.js

const express = require("express");
const router = express.Router();
// const { protect, anyRole, leaderOrAdmin } = require("../middleware/auth");
// const {
//   protect,
//   anyRole,
//   leaderOrAdmin,
//   adminOrSuperAdmin,
// } = require("../middleware/auth");
const {
  protect,
  anyRole,
  leaderOrAdmin,
  goldenMondayAdminOrAbove,
} = require("../middleware/auth");
const GoldenMondayExperience = require("../models/GoldenMondayExperience");
const GoldenMondayResult = require("../models/GoldenMondayResult");
const { suggestTagsFromText } = require("../services/tagSuggestionService");

const {
  getSessions,
  previewRecap,
  createSession,
  suggestTopics,
  getRoster,
  addToRoster,
  updateRosterEntry,
  removeFromRoster,
  previewRotation,
  assignRotation,
  reassignRotation,
  setPresentationTitle,
  uploadSessionRecording,
  removeSessionRecording,
  getLiveRecordings,
  analyzeAndCategorizePhoto,
} = require("../controllers/goldenMondayController");

const rotationService = require("../services/goldenMondayRotationService");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const GoldenMondayAttendance = require("../models/GoldenMondayAttendance");
const GoldenMondayGallery = require("../models/GoldenMondayGallery");
const GoldenMondayFolder = require("../models/GoldenMondayFolder");
const GoldenMondayCategory = require("../models/GoldenMondayCategory");
const User = require("../models/User");

// ── NEW: Multi-file upload middleware and services ──────────
const {
  galleryUpload,
  SIZE_LIMITS_BYTES,
} = require("../middleware/galleryUpload");
const { fileTypeFromBuffer } = require("file-type");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const {
  getOrCreateWeekFolder,
  getOrCreateTypeFolder,
  updateWeekFolderAggregates,
  getFileTypeLabel,
  mondayOf,
} = require("../services/galleryFolderService");
const {
  computeContentHash,
  computePerceptualHash,
  findDuplicateInFolder,
} = require("../services/galleryDedupService");
const {
  categorizeImage,
} = require("../services/galleryImageCategorizationService");
const {
  resolveGalleryCategory,
} = require("../services/galleryCategorizationService");
const { categorizeGalleryDocumentText } = require("../services/aiService");
const { BUILT_IN_CATEGORIES } = require("../constants/goldenMondayCategories");

// ── Sessions ────────────────────────────────────────────────
router.get("/", protect, anyRole, getSessions);
router.get("/suggest-topics", protect, leaderOrAdmin, suggestTopics);
router.post("/recap", protect, leaderOrAdmin, previewRecap);
router.post("/", protect, leaderOrAdmin, createSession);

// ── Sessions - Upcoming & Past ─────────────────────────────
router.get("/sessions/upcoming", protect, anyRole, async (req, res) => {
  try {
    const sessions = await GoldenMondaySession.find({
      status: { $in: ["scheduled", "ongoing"] },
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .populate("presenter", "name email department profilePhotoUrl");
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/sessions/past", protect, anyRole, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const sessions = await GoldenMondaySession.find({
      status: "completed",
      date: { $lt: new Date() },
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("presenter", "name email department profilePhotoUrl");

    const total = await GoldenMondaySession.countDocuments({
      status: "completed",
      date: { $lt: new Date() },
    });

    res.json({
      sessions,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Recordings ─────────────────────────────────────────────
router.get("/recordings/live", protect, anyRole, getLiveRecordings);

// ── Rotation roster ─────────────────────────────────────────
router.get("/roster", protect, anyRole, getRoster);
router.post("/roster", protect, leaderOrAdmin, addToRoster);
router.put("/roster/:id", protect, leaderOrAdmin, updateRosterEntry);
router.delete("/roster/:id", protect, leaderOrAdmin, removeFromRoster);

// ── Rotation engine ─────────────────────────────────────────
router.get("/rotation/preview", protect, anyRole, previewRotation);
router.get("/rotation/next", protect, anyRole, async (req, res) => {
  try {
    const next = await rotationService.getNextPresenter();
    if (!next) {
      return res.json({ name: "No presenter assigned", department: "" });
    }
    res.json(next);
  } catch (error) {
    console.error("Error in /rotation/next:", error);
    res.status(500).json({ error: error.message });
  }
});
router.post("/rotation/assign", protect, leaderOrAdmin, assignRotation);
router.post(
  "/rotation/:sessionId/reassign",
  protect,
  leaderOrAdmin,
  reassignRotation,
);

// ── Per-session actions ─────────────────────────────────────
router.put("/:sessionId/title", protect, anyRole, setPresentationTitle);
router.post(
  "/:sessionId/recording",
  protect,
  leaderOrAdmin,
  uploadSessionRecording,
);
router.delete(
  "/:sessionId/recording",
  protect,
  leaderOrAdmin,
  removeSessionRecording,
);

// ── Stats ────────────────────────────────────────────────────
router.get("/stats", protect, anyRole, async (req, res) => {
  try {
    const [
      totalSessions,
      totalPresenters,
      upcomingSessions,
      completedSessions,
    ] = await Promise.all([
      GoldenMondaySession.countDocuments(),
      GoldenMondayPresenter.countDocuments({ isEligible: true }),
      GoldenMondaySession.countDocuments({
        status: { $in: ["scheduled", "ongoing"] },
        date: { $gte: new Date() },
      }),
      GoldenMondaySession.countDocuments({ status: "completed" }),
    ]);

    const sessionsWithRatings = await GoldenMondaySession.find({
      averageRating: { $gt: 0 },
    }).select("averageRating");

    let averageRating = 0;
    if (sessionsWithRatings.length > 0) {
      const total = sessionsWithRatings.reduce(
        (sum, s) => sum + s.averageRating,
        0,
      );
      averageRating = total / sessionsWithRatings.length;
    }

    res.json({
      totalSessions,
      totalPresenters,
      upcomingSessions,
      completedSessions,
      averageRating: Math.round(averageRating * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

// ── Pillars ──────────────────────────────────────────────────
router.get("/pillars", protect, anyRole, async (req, res) => {
  try {
    const pillars = [
      {
        icon: "FiSunrise",
        title: "A weekly reset",
        body: "Every Monday morning, offices across the organization pause the routine for shared learning — a deliberate start to the work week instead of a rushed one.",
      },
      {
        icon: "FiUsers",
        title: "Peer-led, not top-down",
        body: "Sessions are usually carried by colleagues themselves — department heads, team leaders, and long-serving staff sharing real experience, not scripted lectures.",
      },
      {
        icon: "FiTrendingUp",
        title: "Built for multiskilling",
        body: "The stated goal is to push every employee beyond a single fixed skill set — technology literacy, service standards, and adaptability all get airtime over time.",
      },
    ];
    res.json(pillars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// ATTENDANCE ROUTES
// ──────────────────────────────────────────────────────────────

// GET /api/golden-monday/:sessionId/attendance
router.get("/:sessionId/attendance", protect, anyRole, async (req, res) => {
  try {
    console.log("📊 [GET ATTENDANCE] Session ID:", req.params.sessionId);

    const attendance = await GoldenMondayAttendance.find({
      session: req.params.sessionId,
    })
      .populate("user", "name email department")
      .sort({ checkedInAt: -1 });

    const allEmployees = await GoldenMondayPresenter.find({
      isEligible: true,
    }).select("user name email department");

    console.log(
      "📊 [GET ATTENDANCE] Found",
      allEmployees.length,
      "employees in roster",
    );
    console.log(
      "📊 [GET ATTENDANCE] Found",
      attendance.length,
      "attendance records",
    );

    const report = allEmployees.map((emp) => {
      const record = attendance.find(
        (a) =>
          a.user &&
          emp.user &&
          a.user._id.toString() === emp.user._id.toString(),
      );

      return {
        user: emp.user,
        userId: emp.user?._id || emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department || "",
        attended: record ? record.attended : false,
        signature: record ? record.signature : null,
        signatureType: record ? record.signatureType : "none",
        checkedInAt: record ? record.checkedInAt : null,
        feedback: record ? record.feedback : "",
        rating: record ? record.rating : null,
        role: record ? record.role : "attendee",
      };
    });

    res.json({
      sessionId: req.params.sessionId,
      totalEmployees: allEmployees.length,
      attendedCount: attendance.filter((a) => a.attended).length,
      attendance: report,
    });
  } catch (error) {
    console.error("❌ [GET ATTENDANCE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/:sessionId/attendance
// POST /api/golden-monday/:sessionId/attendance
router.post("/:sessionId/attendance", protect, anyRole, async (req, res) => {
  try {
    const {
      userId,
      signature,
      signatureType,
      signatureText,
      feedback,
      rating,
    } = req.body;

    console.log("📝 [POST ATTENDANCE] Request received:");
    console.log("  sessionId:", req.params.sessionId);
    console.log("  userId:", userId);
    console.log("  signatureType:", signatureType);
    console.log("  hasSignature:", !!signature);
    console.log("  signature length:", signature?.length || 0);
    console.log(
      "  signature preview:",
      signature ? signature.substring(0, 100) + "..." : "null",
    );

    if (!userId) {
      console.log("❌ [ATTENDANCE] Missing userId");
      return res.status(400).json({ error: "User ID is required" });
    }

    const session = await GoldenMondaySession.findById(req.params.sessionId);
    if (!session) {
      console.log("❌ [ATTENDANCE] Session not found:", req.params.sessionId);
      return res.status(404).json({ error: "Session not found" });
    }
    console.log("✅ [ATTENDANCE] Session found:", session._id);

    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ [ATTENDANCE] User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }
    console.log("✅ [ATTENDANCE] User found:", user.name, user.email);

    let attendance = await GoldenMondayAttendance.findOne({
      session: req.params.sessionId,
      user: userId,
    });

    if (attendance) {
      console.log("📝 [ATTENDANCE] Updating existing record");
      attendance.attended = true;
      attendance.checkedInAt = new Date();
      // ✅ IMPORTANT: Save signature even if it's a string
      if (signature && signature.length > 0) {
        attendance.signature = signature;
        attendance.signatureType = signatureType || "draw";
        console.log(
          "✅ [ATTENDANCE] Signature saved (length:",
          signature.length,
          ")",
        );
      } else {
        console.log("⚠️ [ATTENDANCE] No signature provided");
      }
      if (signatureText) attendance.signatureText = signatureText;
      if (feedback) attendance.feedback = feedback;
      if (rating) attendance.rating = rating;
      await attendance.save();
      console.log("✅ [ATTENDANCE] Attendance updated");
    } else {
      console.log("📝 [ATTENDANCE] Creating new record");
      attendance = new GoldenMondayAttendance({
        session: req.params.sessionId,
        user: userId,
        name: user.name,
        email: user.email,
        department: user.department || "",
        attended: true,
        signature: signature || "",
        signatureType: signatureType || "draw",
        signatureText: signatureText || "",
        feedback: feedback || "",
        rating: rating || null,
        recordedBy: req.user._id,
        recordedByName: req.user.name,
      });
      await attendance.save();
      console.log("✅ [ATTENDANCE] New attendance created:", attendance._id);
      if (attendance.signature) {
        console.log(
          "✅ [ATTENDANCE] Signature saved (length:",
          attendance.signature.length,
          ")",
        );
      }
    }

    // Also update session attendees
    const existingAttendee = session.attendees.find(
      (a) => a.user.toString() === userId,
    );
    if (existingAttendee) {
      existingAttendee.attended = true;
      existingAttendee.feedback = feedback || existingAttendee.feedback;
    } else {
      session.attendees.push({
        user: userId,
        name: user.name,
        department: user.department || "",
        attended: true,
        feedback: feedback || "",
      });
    }
    await session.save();
    console.log("✅ [ATTENDANCE] Session attendees updated");

    res.json({
      success: true,
      attendance,
      message: "Attendance recorded successfully",
    });
  } catch (error) {
    console.error("❌ [POST ATTENDANCE] Error:", error);
    console.error("❌ [POST ATTENDANCE] Stack:", error.stack);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// POST /api/golden-monday/:sessionId/attendance/bulk
router.post(
  "/:sessionId/attendance/bulk",
  protect,
  leaderOrAdmin,
  async (req, res) => {
    try {
      const { attendees } = req.body;
      if (!attendees || !Array.isArray(attendees)) {
        return res.status(400).json({ error: "Attendees array required" });
      }

      const session = await GoldenMondaySession.findById(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const results = [];
      for (const att of attendees) {
        const user = await User.findById(att.userId);
        if (!user) continue;

        let attendance = await GoldenMondayAttendance.findOne({
          session: req.params.sessionId,
          user: att.userId,
        });

        if (attendance) {
          attendance.attended = att.attended !== false;
          if (att.signature) attendance.signature = att.signature;
          if (att.signatureType) attendance.signatureType = att.signatureType;
          if (att.feedback) attendance.feedback = att.feedback;
          await attendance.save();
        } else {
          attendance = new GoldenMondayAttendance({
            session: req.params.sessionId,
            user: att.userId,
            name: user.name,
            email: user.email,
            department: user.department || "",
            attended: att.attended !== false,
            signature: att.signature || "",
            signatureType: att.signatureType || "draw",
            feedback: att.feedback || "",
            recordedBy: req.user._id,
            recordedByName: req.user.name,
          });
          await attendance.save();
        }
        results.push(attendance);
      }

      res.json({
        success: true,
        count: results.length,
        attendance: results,
      });
    } catch (error) {
      console.error("❌ [BULK ATTENDANCE] Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ──────────────────────────────────────────────────────────────
// 📁 GALLERY FOLDERS - UPDATED for two-level hierarchy
// ──────────────────────────────────────────────────────────────

// GET /api/golden-monday/gallery/folders
router.get("/gallery/folders", protect, anyRole, async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const filter = { folderType: "week" };
    if (category && category !== "all") filter["topics"] = { $in: [category] };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [weekFolders, total] = await Promise.all([
      GoldenMondayFolder.find(filter)
        .sort({ weekOf: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      GoldenMondayFolder.countDocuments(filter),
    ]);

    // Get counts from child type folders
    const folderIds = weekFolders.map((f) => f._id);
    const childFolders = await GoldenMondayFolder.find({
      parentFolder: { $in: folderIds },
      folderType: "fileType",
    }).lean();

    const childCountMap = {};
    childFolders.forEach((child) => {
      const parentId = child.parentFolder.toString();
      if (!childCountMap[parentId]) childCountMap[parentId] = 0;
      childCountMap[parentId] += child.count || 0;
    });

    const shapedFolders = weekFolders.map((week) => ({
      _id: week._id,
      folderType: "week",
      title:
        week.title ||
        week.weekOfEthiopianDate ||
        week.weekOf.toISOString().slice(0, 10),
      weekOf: week.weekOf,
      topics: week.topics || [],
      count: childCountMap[week._id.toString()] || 0,
      coverPhoto: week.coverPhoto || null,
      createdAt: week.createdAt,
      children: [],
    }));

    res.json({
      folders: shapedFolders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.max(1, Math.ceil(total / parseInt(limit))),
      },
    });
  } catch (error) {
    console.error("❌ [GET GALLERY FOLDERS] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/gallery/folders - FIXED
router.post("/gallery/folders", protect, leaderOrAdmin, async (req, res) => {
  try {
    const { name, ethiopianDate, topic, category } = req.body;

    console.log("📁 [CREATE FOLDER] Request:", {
      name: name?.substring(0, 50),
      ethiopianDate,
      topic,
      category,
      userId: req.user?._id,
      userName: req.user?.name,
    });

    // ✅ Validate we actually have an authenticated user with the fields
    // this folder will require — surfaces auth/middleware problems as a
    // clear 401 instead of a confusing downstream ValidationError → 500.
    if (!req.user || !req.user._id || !req.user.name) {
      console.error("❌ [CREATE FOLDER] Missing req.user fields:", {
        hasUser: !!req.user,
        hasId: !!req.user?._id,
        hasName: !!req.user?.name,
      });
      return res.status(401).json({
        success: false,
        error: "Authenticated user is missing required fields (id/name)",
      });
    }

    // Validate required fields
    if (!name || !topic) {
      return res.status(400).json({
        success: false,
        error: "Folder name and topic are required",
      });
    }

    // Use the existing service to get or create a week folder
    const weekFolder = await getOrCreateWeekFolder({
      uploadDate: new Date(),
      topic: topic.trim(),
      weekOfEthiopianDate: ethiopianDate || "",
      userId: req.user._id,
      userName: req.user.name,
    });

    console.log("✅ [CREATE FOLDER] Week folder:", weekFolder._id);

    // Also create a file-type subfolder for "other" or the specified category
    // This ensures the folder structure is complete
    const fileType = "image"; // Default to image since we're uploading images
    const typeFolder = await getOrCreateTypeFolder({
      weekFolder: weekFolder,
      fileType: fileType,
      userId: req.user._id,
      userName: req.user.name,
    });

    console.log("✅ [CREATE FOLDER] Type folder:", typeFolder._id);

    res.status(201).json({
      success: true,
      folderId: weekFolder._id,
      _id: weekFolder._id,
      folder: {
        _id: weekFolder._id,
        title:
          weekFolder.title || weekFolder.weekOfEthiopianDate || "Week Folder",
        weekOf: weekFolder.weekOf,
        topics: weekFolder.topics,
        count: weekFolder.count || 0,
      },
      typeFolderId: typeFolder._id,
      message: "Folder created successfully",
    });
  } catch (error) {
    // ✅ Much more detailed error surfacing — name, message, Mongoose
    // validation field-by-field detail, and the stack, so the next 500
    // tells us exactly what broke instead of a bare message.
    console.error("❌ [CREATE FOLDER] Error name:", error.name);
    console.error("❌ [CREATE FOLDER] Error message:", error.message);
    if (error.errors) {
      console.error(
        "❌ [CREATE FOLDER] Validation details:",
        Object.fromEntries(
          Object.entries(error.errors).map(([k, v]) => [k, v.message]),
        ),
      );
    }
    console.error("❌ [CREATE FOLDER] Stack:", error.stack);

    // Try to find existing folder as fallback (duplicate key error)
    if (error.code === 11000) {
      try {
        const weekOf = mondayOf(new Date());
        const existing = await GoldenMondayFolder.findOne({
          folderType: "week",
          weekOf: weekOf,
          createdBy: req.user._id,
        });

        if (existing) {
          console.log(
            "✅ [CREATE FOLDER] Found existing folder:",
            existing._id,
          );
          return res.status(200).json({
            success: true,
            folderId: existing._id,
            _id: existing._id,
            folder: existing,
            message: "Folder already exists",
          });
        }
      } catch (findError) {
        console.error("Error finding existing folder:", findError.message);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to create folder",
      ...(process.env.NODE_ENV !== "production" && {
        errorName: error.name,
        validationErrors: error.errors
          ? Object.fromEntries(
              Object.entries(error.errors).map(([k, v]) => [k, v.message]),
            )
          : undefined,
      }),
    });
  }
});

// ──────────────────────────────────────────────────────────────
// 🖼️ GALLERY ROUTES - UPDATED Multi-file upload
// ──────────────────────────────────────────────────────────────

// GET /api/golden-monday/gallery
router.get("/gallery", protect, anyRole, async (req, res) => {
  try {
    const { category, session, folderId, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (session) filter.session = session;
    if (folderId) filter.folder = folderId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const photos = await GoldenMondayGallery.find(filter)
      .sort({ photoDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("uploadedBy", "name email")
      .populate("session", "title date weekOf");

    const total = await GoldenMondayGallery.countDocuments(filter);

    res.json({
      photos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ [GET GALLERY] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/gallery - MULTI-FILE UPLOAD
router.post(
  "/gallery",
  protect,
  leaderOrAdmin,
  galleryUpload.array("image", 20),
  async (req, res) => {
    try {
      const {
        folderId,
        sessionId,
        category: providedCategory,
        lang,
        topic,
      } = req.body;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one file is required" });
      }

      const cloudinary = require("../config/cloudinary");
      const uploadedItems = [];
      const failedItems = [];
      let weekFolder = null;
      let typeFolders = {};

      for (const file of req.files) {
        try {
          // ── 1. DETECT TRUE FILE TYPE ──────────────────────────
          const fileTypeResult = await fileTypeFromBuffer(file.buffer);
          const trueMime =
            fileTypeResult?.mime || file.mimetype || "application/octet-stream";
          const trueExt = fileTypeResult?.ext || "bin";

          let fileType = "other";
          let cloudinaryResourceType = "raw";

          if (trueMime.startsWith("image/")) {
            fileType = "image";
            cloudinaryResourceType = "image";
          } else if (trueMime === "application/pdf") {
            fileType = "pdf";
            cloudinaryResourceType = "raw";
          } else if (
            trueMime === "application/vnd.ms-powerpoint" ||
            trueMime ===
              "application/vnd.openxmlformats-officedocument.presentationml.presentation"
          ) {
            fileType = "presentation";
            cloudinaryResourceType = "raw";
          } else if (
            trueMime === "application/msword" ||
            trueMime ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) {
            fileType = "document";
            cloudinaryResourceType = "raw";
          } else if (trueMime.startsWith("video/")) {
            fileType = "video";
            cloudinaryResourceType = "video";
          }

          // ── 2. ENFORCE SIZE LIMITS ────────────────────────────
          const sizeLimit =
            SIZE_LIMITS_BYTES[fileType] || SIZE_LIMITS_BYTES.other;
          if (file.size > sizeLimit) {
            failedItems.push({
              filename: file.originalname,
              reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max ${(sizeLimit / 1024 / 1024).toFixed(0)}MB)`,
            });
            continue;
          }

          // ── 3. GET OR CREATE WEEK FOLDER ──────────────────────
          if (!weekFolder) {
            weekFolder = await getOrCreateWeekFolder({
              uploadDate: new Date(),
              topic: topic || "Golden Monday",
              userId: req.user._id,
              userName: req.user.name,
            });
          }

          // ── 4. GET OR CREATE FILE-TYPE SUBFOLDER ──────────────
          if (!typeFolders[fileType]) {
            typeFolders[fileType] = await getOrCreateTypeFolder({
              weekFolder,
              fileType,
              userId: req.user._id,
              userName: req.user.name,
            });
          }
          const targetFolder = typeFolders[fileType];

          // ── 5. DEDUPLICATION CHECK ─────────────────────────────
          const contentHash = computeContentHash(file.buffer);
          let perceptualHash = null;
          if (fileType === "image") {
            perceptualHash = await computePerceptualHash(file.buffer);
          }

          const duplicateCheck = await findDuplicateInFolder({
            folderId: targetFolder._id,
            fileType,
            contentHash,
            perceptualHash,
          });

          if (duplicateCheck.match) {
            failedItems.push({
              filename: file.originalname,
              reason:
                duplicateCheck.reason === "exact"
                  ? "Duplicate file (exact match)"
                  : `Similar image already exists (similarity score: ${duplicateCheck.distance || "N/A"})`,
              existingItem: {
                title:
                  duplicateCheck.match.title ||
                  duplicateCheck.match.originalFilename,
                url:
                  duplicateCheck.match.thumbnailUrl || duplicateCheck.match.url,
              },
            });
            continue;
          }

          // ── 6. AI CATEGORIZATION ──────────────────────────────
          let category = providedCategory || "other";
          let categoryConfidence = null;
          let categorySource = "manual";
          let categorizationProvider = "";
          let categorizationAttempts = [];

          if (!providedCategory) {
            try {
              if (fileType === "image") {
                const base64Data = file.buffer.toString("base64");
                const result = await categorizeImage(base64Data, trueMime);
                category = result.category;
                categoryConfidence = result.confidence;
                categorySource = "ai";
                categorizationProvider = "vision";
              } else if (
                fileType === "pdf" ||
                fileType === "document" ||
                fileType === "presentation"
              ) {
                let extractedText = "";
                if (fileType === "pdf") {
                  const pdfData = await pdfParse(file.buffer);
                  extractedText = pdfData.text || "";
                } else if (fileType === "document") {
                  const docResult = await mammoth.extractRawText({
                    buffer: file.buffer,
                  });
                  extractedText = docResult.value || "";
                } else {
                  try {
                    const docResult = await mammoth.extractRawText({
                      buffer: file.buffer,
                    });
                    extractedText = docResult.value || "";
                  } catch (e) {
                    try {
                      const pdfData = await pdfParse(file.buffer);
                      extractedText = pdfData.text || "";
                    } catch (e2) {
                      extractedText = "";
                    }
                  }
                }

                if (extractedText && extractedText.trim().length > 10) {
                  const existingSlugs = await GoldenMondayCategory.find()
                    .select("slug name")
                    .lean();
                  const allCategoryNames = [
                    ...BUILT_IN_CATEGORIES,
                    ...existingSlugs.map((c) => c.name),
                  ];
                  const aiResult = await categorizeGalleryDocumentText(
                    extractedText,
                    allCategoryNames,
                  );
                  category = aiResult.category || "other";
                  categoryConfidence = aiResult.confidence || 0.5;
                  categorySource = "ai";
                  categorizationProvider = "text-chain";
                }
              }
            } catch (aiError) {
              console.error(
                `[Gallery Upload] AI categorization failed for ${file.originalname}:`,
                aiError.message,
              );
              categorizationAttempts.push({
                provider: "categorization",
                success: false,
                errorCode: aiError.code || "AI_FAILED",
              });
            }
          }

          // ── 7. RESOLVE CATEGORY ────────────────────────────────
          let resolvedCategory = "other";
          let resolvedSource = categorySource;
          let resolvedConfidence = categoryConfidence;

          if (categorySource === "ai") {
            const resolution = await resolveGalleryCategory({
              candidateCategory: category,
              confidence: categoryConfidence || 0.5,
              candidateNewCategoryName: category,
            });
            resolvedCategory = resolution.category;
            resolvedSource = resolution.categorySource;
            resolvedConfidence = resolution.categoryConfidence;
          } else {
            const dynamicCats =
              await GoldenMondayCategory.find().select("slug");
            const allSlugs = [
              ...BUILT_IN_CATEGORIES,
              ...dynamicCats.map((c) => c.slug),
            ];
            resolvedCategory = allSlugs.includes(category) ? category : "other";
          }

          // ── 8. UPLOAD TO CLOUDINARY ──────────────────────────
          const baseOptions = {
            folder: "golden-monday-gallery",
            public_id: `gm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            overwrite: false,
          };

          let uploadResult, thumbnailResult;
          const dataURI = `data:${trueMime};base64,${file.buffer.toString("base64")}`;

          if (fileType === "image") {
            uploadResult = await cloudinary.uploader.upload(dataURI, {
              ...baseOptions,
              resource_type: "image",
            });
            thumbnailResult = await cloudinary.uploader.upload(dataURI, {
              folder: "golden-monday-gallery/thumbnails",
              public_id: `thumb-${Date.now()}`,
              transformation: { width: 300, height: 300, crop: "fill" },
              resource_type: "image",
              overwrite: false,
            });
          } else if (fileType === "video") {
            uploadResult = await cloudinary.uploader.upload(dataURI, {
              ...baseOptions,
              resource_type: "video",
            });
            try {
              const posterResult = await cloudinary.uploader.upload(dataURI, {
                folder: "golden-monday-gallery/thumbnails",
                public_id: `video-thumb-${Date.now()}`,
                resource_type: "image",
                transformation: {
                  width: 300,
                  height: 300,
                  crop: "fill",
                  start_offset: "2",
                },
                overwrite: false,
              });
              thumbnailResult = posterResult;
            } catch (posterErr) {
              console.warn(
                "[Gallery Upload] Could not generate video poster:",
                posterErr.message,
              );
              thumbnailResult = {
                secure_url: "/static/video-icon.png",
                thumbnailIsGeneric: true,
              };
            }
          } else {
            uploadResult = await cloudinary.uploader.upload(dataURI, {
              ...baseOptions,
              resource_type: "raw",
            });
            if (fileType === "pdf") {
              try {
                const pdfThumb = await cloudinary.uploader.upload(dataURI, {
                  folder: "golden-monday-gallery/thumbnails",
                  public_id: `pdf-thumb-${Date.now()}`,
                  resource_type: "image",
                  transformation: {
                    width: 300,
                    height: 300,
                    crop: "fill",
                    page: 1,
                  },
                  overwrite: false,
                });
                thumbnailResult = pdfThumb;
              } catch (pdfThumbErr) {
                console.warn(
                  "[Gallery Upload] Could not generate PDF thumbnail:",
                  pdfThumbErr.message,
                );
                thumbnailResult = {
                  secure_url: "/static/pdf-icon.png",
                  thumbnailIsGeneric: true,
                };
              }
            } else {
              thumbnailResult = {
                secure_url: `/static/${fileType}-icon.png`,
                thumbnailIsGeneric: true,
              };
            }
          }

          // ── 9. SAVE TO DATABASE ──────────────────────────────
          const galleryItem = new GoldenMondayGallery({
            session: sessionId || null,
            folder: targetFolder._id,
            title:
              file.originalname.split(".").slice(0, -1).join(".") ||
              file.originalname,
            fileType,
            originalFilename: file.originalname,
            mimeType: trueMime,
            cloudinaryResourceType,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            thumbnailUrl: thumbnailResult?.secure_url || "",
            thumbnailPublicId: thumbnailResult?.public_id || "",
            thumbnailIsGeneric: !!thumbnailResult?.thumbnailIsGeneric,
            width: uploadResult.width || 0,
            height: uploadResult.height || 0,
            size: file.size,
            format: uploadResult.format || trueExt,
            durationSec: uploadResult.duration || 0,
            contentHash,
            perceptualHash: perceptualHash || "",
            category: resolvedCategory,
            categorySource: resolvedSource,
            categoryConfidence: resolvedConfidence,
            categorizationProvider,
            categorizationAttempts,
            uploadedBy: req.user._id,
            uploadedByName: req.user.name,
            photoDate: new Date(),
          });

          await galleryItem.save();

          // ── 10. UPDATE FOLDER COUNTS ──────────────────────────
          targetFolder.count = (targetFolder.count || 0) + 1;
          if (!targetFolder.coverPhoto) {
            targetFolder.coverPhoto =
              galleryItem.thumbnailUrl || galleryItem.url;
          }
          await targetFolder.save();

          await updateWeekFolderAggregates(weekFolder._id);

          if (sessionId) {
            const session = await GoldenMondaySession.findById(sessionId);
            if (session) {
              session.photos.push({
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                caption: file.originalname,
                uploadedAt: new Date(),
                uploadedBy: req.user._id,
              });
              await session.save();
            }
          }

          uploadedItems.push({
            id: galleryItem._id,
            filename: file.originalname,
            fileType,
            category: resolvedCategory,
            url: galleryItem.url,
            thumbnailUrl: galleryItem.thumbnailUrl,
          });
        } catch (fileError) {
          console.error(
            `[Gallery Upload] Error processing ${file.originalname}:`,
            fileError,
          );
          failedItems.push({
            filename: file.originalname,
            reason: fileError.message || "Upload failed",
          });
        }
      }

      const response = {
        success: true,
        uploaded: uploadedItems.length,
        failed: failedItems.length,
        items: uploadedItems,
        errors: failedItems.length > 0 ? failedItems : undefined,
        folderId: weekFolder?._id,
      };

      if (uploadedItems.length > 0) {
        res.status(201).json(response);
      } else {
        res.status(400).json({
          success: false,
          message: "No files were uploaded successfully",
          errors: failedItems,
        });
      }
    } catch (error) {
      console.error("❌ [POST GALLERY] Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// DELETE /api/golden-monday/gallery/:photoId
router.delete("/gallery/:photoId", protect, leaderOrAdmin, async (req, res) => {
  try {
    const photo = await GoldenMondayGallery.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    const cloudinary = require("../config/cloudinary");
    const resourceType = photo.cloudinaryResourceType || "image";

    try {
      await cloudinary.uploader.destroy(photo.publicId, {
        resource_type: resourceType,
      });
      if (photo.thumbnailPublicId) {
        await cloudinary.uploader.destroy(photo.thumbnailPublicId, {
          resource_type: "image",
        });
      }
    } catch (cloudinaryErr) {
      console.error(
        `❌ [DELETE GALLERY] Cloudinary destroy failed for ${photo.publicId} (resource_type: ${resourceType}):`,
        cloudinaryErr.message,
      );
    }

    const folderId = photo.folder;
    await photo.deleteOne();

    if (folderId) {
      const folder = await GoldenMondayFolder.findById(folderId);
      if (folder) {
        folder.count = Math.max(0, folder.count - 1);
        if (folder.count === 0) {
          await folder.deleteOne();
        } else {
          const latest = await GoldenMondayGallery.findOne({
            folder: folderId,
          }).sort({ createdAt: -1 });
          folder.coverPhoto = latest?.thumbnailUrl || "";
          await folder.save();
        }
      }
    }

    res.json({ success: true, message: "Photo deleted successfully" });
  } catch (error) {
    console.error("❌ [DELETE GALLERY] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// 🤖 AI PHOTO ANALYSIS
// ──────────────────────────────────────────────────────────────

router.post(
  "/gallery/analyze",
  protect,
  leaderOrAdmin,
  analyzeAndCategorizePhoto,
);

// ──────────────────────────────────────────────────────────────
// 🔍 DEBUG ROUTES
// ──────────────────────────────────────────────────────────────

// router.get("/debug/roster", protect, async (req, res) => {
router.get("/debug/roster", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Fetching roster...");
    const roster = await GoldenMondayPresenter.find()
      .populate("user", "name email _id")
      .lean();

    console.log("🔍 [DEBUG] Roster count:", roster.length);
    res.json({
      count: roster.length,
      roster: roster.map((r) => ({
        id: r._id,
        userId: r.user?._id,
        userName: r.user?.name,
        email: r.user?.email,
        name: r.name,
        department: r.department,
        isEligible: r.isEligible,
      })),
    });
  } catch (error) {
    console.error("❌ [DEBUG ROSTER] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// router.get("/debug/attendance/:sessionId", protect, async (req, res) => {
router.get(
  "/debug/attendance/:sessionId",
  protect,
  adminOrSuperAdmin,
  async (req, res) => {
    try {
      console.log(
        "🔍 [DEBUG] Fetching attendance for session:",
        req.params.sessionId,
      );
      const attendance = await GoldenMondayAttendance.find({
        session: req.params.sessionId,
      }).populate("user", "name email _id");

      console.log("🔍 [DEBUG] Attendance count:", attendance.length);
      res.json({
        count: attendance.length,
        attendance: attendance.map((a) => ({
          id: a._id,
          userId: a.user?._id,
          userName: a.user?.name,
          name: a.name,
          attended: a.attended,
          signature: a.signature ? "✅ Has signature" : "❌ No signature",
          signatureType: a.signatureType,
          checkedInAt: a.checkedInAt,
        })),
      });
    } catch (error) {
      console.error("❌ [DEBUG ATTENDANCE] Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// router.get("/debug/users", protect, async (req, res) => {
router.get("/debug/users", protect, adminOrSuperAdmin, async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Fetching all users...");
    const users = await User.find().select("name email role _id");
    console.log("🔍 [DEBUG] Users count:", users.length);
    res.json({
      count: users.length,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
      })),
    });
  } catch (error) {
    console.error("❌ [DEBUG USERS] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// SESSION RECORDING & DOWNLOAD ROUTES
// ──────────────────────────────────────────────────────────────

router.get(
  "/:sessionId/download-slides",
  protect,
  anyRole,
  async (req, res) => {
    try {
      const session = await GoldenMondaySession.findById(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (!session.presentationSlides) {
        return res
          .status(404)
          .json({ error: "No slides available for this session" });
      }

      res.json({
        url: session.presentationSlides,
        title: session.presentationTitle,
      });
    } catch (error) {
      console.error("❌ [GET SLIDES] Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.post("/:sessionId/slides", protect, leaderOrAdmin, async (req, res) => {
  try {
    const { slides } = req.body;
    if (!slides) {
      return res.status(400).json({ error: "Slides data is required" });
    }

    const session = await GoldenMondaySession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.presentationSlides = slides;
    await session.save();

    res.json({ success: true, session });
  } catch (error) {
    console.error("❌ [POST SLIDES] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// ✅ NEW — EXPERIENCES SHARED (Kirkpatrick Levels 1-2)
// ──────────────────────────────────────────────────────────────

// GET /api/golden-monday/experiences
router.get("/experiences", protect, anyRole, async (req, res) => {
  try {
    const { session, tag, limit = 30, page = 1 } = req.query;
    const filter = {};
    if (session) filter.session = session;
    if (tag) filter.tags = tag;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [experiences, total] = await Promise.all([
      GoldenMondayExperience.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("session", "title date"),
      GoldenMondayExperience.countDocuments(filter),
    ]);

    res.json({
      experiences,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.max(1, Math.ceil(total / parseInt(limit))),
      },
    });
  } catch (error) {
    console.error("❌ [GET EXPERIENCES] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/experiences
router.post("/experiences", protect, anyRole, async (req, res) => {
  try {
    const { session, whatILearned, relevanceRating, wouldRecommend, tags } =
      req.body;

    if (!whatILearned || !whatILearned.trim()) {
      return res.status(400).json({ error: "whatILearned is required" });
    }

    const aiSuggestedTags = await suggestTagsFromText(whatILearned);

    const experience = await GoldenMondayExperience.create({
      session: session || null,
      user: req.user._id,
      userName: req.user.name,
      department: req.user.department || "",
      whatILearned: whatILearned.trim(),
      relevanceRating: relevanceRating || 5,
      wouldRecommend: wouldRecommend !== false,
      tags: Array.isArray(tags) ? tags : [],
      aiSuggestedTags,
    });

    res.status(201).json({ success: true, experience });
  } catch (error) {
    console.error("❌ [POST EXPERIENCE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/experiences/:id/endorse
router.post("/experiences/:id/endorse", protect, anyRole, async (req, res) => {
  try {
    const experience = await GoldenMondayExperience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ error: "Experience not found" });
    }

    const uid = req.user._id.toString();
    const alreadyEndorsed = experience.endorsedBy.some(
      (id) => id.toString() === uid,
    );

    if (alreadyEndorsed) {
      experience.endorsedBy = experience.endorsedBy.filter(
        (id) => id.toString() !== uid,
      );
    } else {
      experience.endorsedBy.push(req.user._id);
    }

    await experience.save();
    res.json({
      success: true,
      endorsed: !alreadyEndorsed,
      endorsementCount: experience.endorsedBy.length,
    });
  } catch (error) {
    console.error("❌ [ENDORSE EXPERIENCE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/golden-monday/experiences/:id
router.delete("/experiences/:id", protect, anyRole, async (req, res) => {
  try {
    const experience = await GoldenMondayExperience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ error: "Experience not found" });
    }

    const isOwner = experience.user.toString() === req.user._id.toString();
    const isPrivileged = ["admin", "superadmin", "leader"].includes(
      req.user.role,
    );
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: "Not authorized to delete this" });
    }

    await experience.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("❌ [DELETE EXPERIENCE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// ✅ NEW — RESULTS GAINED (Kirkpatrick Levels 3-4)
// ──────────────────────────────────────────────────────────────

// GET /api/golden-monday/results
router.get("/results", protect, anyRole, async (req, res) => {
  try {
    const { session, category, limit = 30, page = 1 } = req.query;
    const filter = {};
    if (session) filter.session = session;
    if (category && category !== "all") filter.outcomeCategory = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [results, total] = await Promise.all([
      GoldenMondayResult.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("session", "title date")
        .populate("experience", "whatILearned"),
      GoldenMondayResult.countDocuments(filter),
    ]);

    res.json({
      results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.max(1, Math.ceil(total / parseInt(limit))),
      },
    });
  } catch (error) {
    console.error("❌ [GET RESULTS] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/results
router.post("/results", protect, anyRole, async (req, res) => {
  try {
    const {
      session,
      experience,
      whatIApplied,
      measurableOutcome,
      outcomeCategory,
      timeframe,
      tags,
    } = req.body;

    if (!whatIApplied || !whatIApplied.trim()) {
      return res.status(400).json({ error: "whatIApplied is required" });
    }

    const aiSuggestedTags = await suggestTagsFromText(
      `${whatIApplied} ${measurableOutcome || ""}`,
    );

    const result = await GoldenMondayResult.create({
      session: session || null,
      experience: experience || null,
      user: req.user._id,
      userName: req.user.name,
      department: req.user.department || "",
      whatIApplied: whatIApplied.trim(),
      measurableOutcome: (measurableOutcome || "").trim(),
      outcomeCategory: outcomeCategory || "other",
      timeframe: timeframe || "within-month",
      tags: Array.isArray(tags) ? tags : [],
      aiSuggestedTags,
    });

    res.status(201).json({ success: true, result });
  } catch (error) {
    console.error("❌ [POST RESULT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/results/:id/endorse
router.post("/results/:id/endorse", protect, anyRole, async (req, res) => {
  try {
    const result = await GoldenMondayResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }

    const uid = req.user._id.toString();
    const alreadyEndorsed = result.endorsedBy.some(
      (id) => id.toString() === uid,
    );

    if (alreadyEndorsed) {
      result.endorsedBy = result.endorsedBy.filter(
        (id) => id.toString() !== uid,
      );
    } else {
      result.endorsedBy.push(req.user._id);
    }

    await result.save();
    res.json({
      success: true,
      endorsed: !alreadyEndorsed,
      endorsementCount: result.endorsedBy.length,
    });
  } catch (error) {
    console.error("❌ [ENDORSE RESULT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/golden-monday/results/:id
router.delete("/results/:id", protect, anyRole, async (req, res) => {
  try {
    const result = await GoldenMondayResult.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Result not found" });
    }

    const isOwner = result.user.toString() === req.user._id.toString();
    const isPrivileged = ["admin", "superadmin", "leader"].includes(
      req.user.role,
    );
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ error: "Not authorized to delete this" });
    }

    await result.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("❌ [DELETE RESULT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// ✅ NEW — REPORTS
// ──────────────────────────────────────────────────────────────

// GET /api/golden-monday/reports/rotation
router.get("/reports/rotation", protect, leaderOrAdmin, async (req, res) => {
  try {
    const [ranking, presentedSessions] = await Promise.all([
      rotationService.previewRotation
        ? rotationService.previewRotation()
        : Promise.resolve([]),
      GoldenMondaySession.find({ presenter: { $ne: null } })
        .sort({ date: -1 })
        .limit(200)
        .populate("presenter", "name department"),
    ]);

    const history = presentedSessions.map((s) => ({
      sessionId: s._id,
      date: s.date,
      presenterId: s.presenter?._id || null,
      presenterName: s.presenterName || s.presenter?.name || "Unknown",
      department: s.presenterDepartment || s.presenter?.department || "",
      title: s.presentationTitle || s.title || "Untitled",
      averageRating: s.averageRating || 0,
    }));

    const presentedCounts = {};
    history.forEach((h) => {
      const key = h.presenterId ? h.presenterId.toString() : h.presenterName;
      presentedCounts[key] = (presentedCounts[key] || 0) + 1;
    });

    res.json({
      ranking: Array.isArray(ranking) ? ranking : ranking?.ranking || [],
      history,
      presentedCounts,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ [ROTATION REPORT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/golden-monday/reports/employee-performance
router.get(
  "/reports/employee-performance",
  protect,
  leaderOrAdmin,
  async (req, res) => {
    try {
      const roster = await GoldenMondayPresenter.find().populate(
        "user",
        "name email department",
      );

      const performance = await Promise.all(
        roster.map(async (r) => {
          const userId = r.user?._id || r.user;

          const [attendanceCount, experienceCount, resultCount] =
            await Promise.all([
              GoldenMondayAttendance.countDocuments({
                user: userId,
                attended: true,
              }),
              GoldenMondayExperience.countDocuments({ user: userId }),
              GoldenMondayResult.countDocuments({ user: userId }),
            ]);

          return {
            userId,
            name: r.name,
            email: r.email,
            department: r.department || "",
            isEligible: r.isEligible,
            timesPresented: r.timesPresented || 0,
            sessionsAttended: attendanceCount,
            experiencesShared: experienceCount,
            resultsLogged: resultCount,
            engagementScore:
              (r.timesPresented || 0) * 5 +
              resultCount * 3 +
              attendanceCount * 1 +
              experienceCount * 1,
          };
        }),
      );

      performance.sort((a, b) => b.engagementScore - a.engagementScore);

      res.json({ performance, generatedAt: new Date() });
    } catch (error) {
      console.error("❌ [EMPLOYEE PERFORMANCE REPORT] Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// GET /api/golden-monday/reports/dashboard
router.get("/reports/dashboard", protect, leaderOrAdmin, async (req, res) => {
  try {
    const [
      totalSessions,
      totalPresenters,
      totalExperiences,
      totalResults,
      resultsByCategory,
      recentExperiences,
      recentResults,
      allExperiencesForTags,
    ] = await Promise.all([
      GoldenMondaySession.countDocuments(),
      GoldenMondayPresenter.countDocuments({ isEligible: true }),
      GoldenMondayExperience.countDocuments(),
      GoldenMondayResult.countDocuments(),
      GoldenMondayResult.aggregate([
        { $group: { _id: "$outcomeCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      GoldenMondayExperience.find().sort({ createdAt: -1 }).limit(5),
      GoldenMondayResult.find().sort({ createdAt: -1 }).limit(5),
      GoldenMondayExperience.find().select("tags aiSuggestedTags"),
    ]);

    const tagFreq = {};
    allExperiencesForTags.forEach((doc) => {
      [...(doc.tags || []), ...(doc.aiSuggestedTags || [])].forEach((tag) => {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const recommendCount = await GoldenMondayExperience.countDocuments({
      wouldRecommend: true,
    });
    const recommendRate =
      totalExperiences > 0
        ? Math.round((recommendCount / totalExperiences) * 100)
        : null;

    res.json({
      totals: {
        sessions: totalSessions,
        presenters: totalPresenters,
        experiences: totalExperiences,
        results: totalResults,
      },
      resultsByCategory,
      topTags,
      recommendRate,
      recentExperiences,
      recentResults,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ [DASHBOARD REPORT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/golden-monday/reports/ai-insights
router.get("/reports/ai-insights", protect, leaderOrAdmin, async (req, res) => {
  try {
    const experiences = await GoldenMondayExperience.find()
      .sort({ createdAt: -1 })
      .limit(100);
    const results = await GoldenMondayResult.find()
      .sort({ createdAt: -1 })
      .limit(100);

    const tagFreq = {};
    [...experiences, ...results].forEach((doc) => {
      [...(doc.tags || []), ...(doc.aiSuggestedTags || [])].forEach((tag) => {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });
    });
    const themes = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([theme, mentions]) => ({ theme, mentions }));

    const avgRelevance =
      experiences.length > 0
        ? experiences.reduce((sum, e) => sum + (e.relevanceRating || 0), 0) /
          experiences.length
        : null;

    const outcomeCategoryCounts = {};
    results.forEach((r) => {
      outcomeCategoryCounts[r.outcomeCategory] =
        (outcomeCategoryCounts[r.outcomeCategory] || 0) + 1;
    });

    res.json({
      themes,
      avgRelevance: avgRelevance ? Math.round(avgRelevance * 10) / 10 : null,
      outcomeCategoryCounts,
      sampleSize: { experiences: experiences.length, results: results.length },
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("❌ [AI INSIGHTS REPORT] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
