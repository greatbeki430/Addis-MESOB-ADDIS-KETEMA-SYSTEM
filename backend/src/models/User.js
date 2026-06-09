const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["member", "leader", "admin"],
      default: "member",
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    phone: String,
    signature: String, // base64 or url
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
