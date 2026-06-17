const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true }, // daily, weekly, monthly, quarterly, half-year, yearly, custom
    period: { type: String, required: true },
    startDate: { type: String },
    endDate: { type: String },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    teamName: { type: String },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    generatedByName: { type: String },
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // The actual report data
    summary: { type: mongoose.Schema.Types.Mixed },
    filePath: { type: String }, // For future file storage
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Report", reportSchema);
