const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    period: { type: String, required: true }, // e.g., "2025-Q2"
    scores: [
      {
        member: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        c1: Number,
        c2: Number,
        c3: Number,
        c4: Number,
        c5: Number,
        total: Number,
      },
    ],
    bestPerformer: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Evaluation", evaluationSchema);
