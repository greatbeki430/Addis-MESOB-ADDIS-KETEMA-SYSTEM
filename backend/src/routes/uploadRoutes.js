// backend/src/routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const { protect } = require("../middleware/auth");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

// POST /api/upload/employee-photo
router.post(
  "/employee-photo",
  protect,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Convert buffer to base64
      const base64 = req.file.buffer.toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${base64}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "golden-monday/employee-photos",
        public_id: `employee-${Date.now()}`,
        width: 400,
        height: 400,
        crop: "fill",
      });

      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ✅ Profile photo upload endpoint
router.post(
  "/profile-photo",
  protect,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Convert buffer to base64
      const base64 = req.file.buffer.toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${base64}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: `profile-photos/${req.user._id}`,
        public_id: `profile-${Date.now()}`,
        width: 300,
        height: 300,
        crop: "fill",
      });

      // Update user with new photo
      const User = require("../models/User");
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete old photo if exists
      if (user.profilePhotoPublicId) {
        try {
          await cloudinary.uploader.destroy(user.profilePhotoPublicId);
        } catch (err) {
          console.warn("Could not delete old photo:", err.message);
        }
      }

      user.profilePhotoUrl = result.secure_url;
      user.profilePhotoPublicId = result.public_id;
      await user.save();

      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Profile photo upload error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

module.exports = router;
