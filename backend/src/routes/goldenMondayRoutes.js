// backend/src/routes/goldenMondayRoutes.js

const express = require("express");
const router = express.Router();
const { protect, anyRole, leaderOrAdmin } = require("../middleware/auth");

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
} = require("../controllers/goldenMondayController");

const rotationService = require("../services/goldenMondayRotationService");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const GoldenMondayAttendance = require("../models/GoldenMondayAttendance");
const GoldenMondayGallery = require("../models/GoldenMondayGallery");
const User = require("../models/User");

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
    res.json(next);
  } catch (error) {
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

// GET /api/golden-monday/:sessionId/attendance - Get attendance for a session
router.get("/:sessionId/attendance", protect, anyRole, async (req, res) => {
  try {
    const attendance = await GoldenMondayAttendance.find({
      session: req.params.sessionId,
    })
      .populate("user", "name email department")
      .sort({ checkedInAt: -1 });

    // Get all eligible employees for this session
    const allEmployees = await GoldenMondayPresenter.find({
      isEligible: true,
    }).select("user name email department");

    const attendedUserIds = new Set(
      attendance.filter((a) => a.attended).map((a) => a.user._id.toString()),
    );

    // Build full attendance report with who hasn't attended
    const report = allEmployees.map((emp) => {
      const record = attendance.find(
        (a) => a.user._id.toString() === emp.user._id.toString(),
      );
      return {
        user: emp.user,
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
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/:sessionId/attendance - Record attendance for a single user
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

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const session = await GoldenMondaySession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already attended
    let attendance = await GoldenMondayAttendance.findOne({
      session: req.params.sessionId,
      user: userId,
    });

    if (attendance) {
      // Update existing record
      attendance.attended = true;
      attendance.checkedInAt = new Date();
      if (signature) attendance.signature = signature;
      if (signatureType) attendance.signatureType = signatureType;
      if (signatureText) attendance.signatureText = signatureText;
      if (feedback) attendance.feedback = feedback;
      if (rating) attendance.rating = rating;
      await attendance.save();
    } else {
      // Create new record
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
    }

    // Also update the session's attendees array for backward compatibility
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

    res.json({
      success: true,
      attendance,
      message: "Attendance recorded successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/:sessionId/attendance/bulk - Bulk attendance
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
      res.status(500).json({ error: error.message });
    }
  },
);

// ──────────────────────────────────────────────────────────────
// GALLERY ROUTES
// ──────────────────────────────────────────────────────────────

// GET /api/golden-monday/gallery - Get all gallery photos
router.get("/gallery", protect, anyRole, async (req, res) => {
  try {
    const { category, session, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (session) filter.session = session;

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
    res.status(500).json({ error: error.message });
  }
});

// POST /api/golden-monday/gallery - Upload gallery photo
router.post("/gallery", protect, leaderOrAdmin, async (req, res) => {
  try {
    const {
      image,
      title,
      description,
      caption,
      category,
      tags,
      sessionId,
      photoDate,
    } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Upload to Cloudinary
    const cloudinary = require("../config/cloudinary");
    const result = await cloudinary.uploader.upload(image, {
      folder: "golden-monday-gallery",
      public_id: `gm-${Date.now()}`,
      overwrite: false,
    });

    // Create thumbnail
    const thumbnailResult = await cloudinary.uploader.upload(image, {
      folder: "golden-monday-gallery/thumbnails",
      public_id: `thumb-${Date.now()}`,
      transformation: { width: 300, height: 300, crop: "fill" },
      overwrite: false,
    });

    const galleryPhoto = new GoldenMondayGallery({
      session: sessionId || null,
      title: title || "",
      description: description || "",
      caption: caption || "",
      url: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: thumbnailResult.secure_url,
      thumbnailPublicId: thumbnailResult.public_id,
      width: result.width || 0,
      height: result.height || 0,
      size: result.bytes || 0,
      format: result.format || "",
      category: category || "other",
      tags: tags || [],
      uploadedBy: req.user._id,
      uploadedByName: req.user.name,
      photoDate: photoDate ? new Date(photoDate) : null,
    });

    await galleryPhoto.save();

    // If sessionId provided, also add to session photos
    if (sessionId) {
      const session = await GoldenMondaySession.findById(sessionId);
      if (session) {
        session.photos.push({
          url: result.secure_url,
          publicId: result.public_id,
          caption: caption || "",
          uploadedAt: new Date(),
          uploadedBy: req.user._id,
        });
        await session.save();
      }
    }

    res.status(201).json({
      success: true,
      photo: galleryPhoto,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/golden-monday/gallery/:photoId - Delete gallery photo
router.delete("/gallery/:photoId", protect, leaderOrAdmin, async (req, res) => {
  try {
    const photo = await GoldenMondayGallery.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    // Delete from Cloudinary
    const cloudinary = require("../config/cloudinary");
    await cloudinary.uploader.destroy(photo.publicId);
    if (photo.thumbnailPublicId) {
      await cloudinary.uploader.destroy(photo.thumbnailPublicId);
    }

    await photo.deleteOne();

    res.json({ success: true, message: "Photo deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// SESSION RECORDING & DOWNLOAD ROUTES
// ──────────────────────────────────────────────────────────────

// GET /api/golden-monday/:sessionId/download-slides - Download presentation slides
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
      res.status(500).json({ error: error.message });
    }
  },
);

// POST /api/golden-monday/:sessionId/slides - Upload presentation slides
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
