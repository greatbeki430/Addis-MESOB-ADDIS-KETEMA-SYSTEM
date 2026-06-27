const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    dept: String,
    deptEn: String,
    name: String,
    nameEn: String,
    active: { type: Boolean, default: true },
    stdTime: String,
    image: { type: String, default: "" }, // URL or path to uploaded image
    imagePublicId: { type: String, default: "" }, // For cloud storage (Cloudinary)
  },
  { timestamps: true },
);

module.exports = mongoose.model("Service", serviceSchema);
