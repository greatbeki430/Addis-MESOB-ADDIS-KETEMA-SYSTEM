const mongoose = require("mongoose");

const dailyReportSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    entries: [
      {
        dept: String,
        service: String,
        male: Number,
        female: Number,
        total: Number,
        notes: String,
      },
    ],
    grandTotal: Number,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DailyReport", dailyReportSchema);
