// backend/src/models/GoldenMondayResource.js
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldenMondaySession",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "presentation", "document", "image", "video", "other"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [
      {
        version: Number,
        url: String,
        publicId: String,
        uploadedAt: Date,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedByName: String,
        changeNote: String,
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    tags: [String],
    downloads: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Index for efficient queries
resourceSchema.index({ session: 1, fileType: 1 });
resourceSchema.index({ tags: 1 });

module.exports = mongoose.model("GoldenMondayResource", resourceSchema);
