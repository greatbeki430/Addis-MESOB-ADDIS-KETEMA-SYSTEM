const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    dept: String,
    deptEn: String,
    name: String,
    nameEn: String,
    active: { type: Boolean, default: true },
    stdTime: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Service", serviceSchema);
