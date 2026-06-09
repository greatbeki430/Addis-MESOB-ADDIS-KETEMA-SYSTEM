const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    date: { type: Date, required: true },
    timeStart: String,
    timeEnd: String,
    present: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    absent: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
      },
    ],
    prevResults: [String],
    topics: [String],
    explanation: String,
    gaps: [String],
    agreements: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Meeting", meetingSchema);
