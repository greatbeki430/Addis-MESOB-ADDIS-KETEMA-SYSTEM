// backend/src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["employee", "leader", "admin", "superadmin"],
      default: "employee",
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    phone: String,
    signature: String,
    telegramChatId: { type: String, default: null },
    // ✅ Grants leader/admin-level access to Golden Monday routes ONLY
    // (roster, gallery, rotation, reports). Does NOT touch global role —
    // someone with this flag is still an "employee" everywhere else in
    // the system (User Management, Team Management, Employee Management
    // stay off-limits). Toggled by an admin via User Management.
    isGoldenMondayAdmin: { type: Boolean, default: false },
    profilePhotoUrl: { type: String, default: "" },
    profilePhotoPublicId: { type: String, default: "" },
    // ✅ Branch/Location
    branch: {
      type: String,
      enum: [
        "Addis Ketema",
        "Lideta",
        "Kirkos",
        "Bole",
        "Yeka",
        "Gulele",
        "Nifas Silk",
        "Kolfe Keranio",
        "Arada",
        "Akaki Kality",
        "Lemi Kura",
        "Other",
      ],
      default: "Addis Ketema",
    },
    // ✅ ADD THIS - Position/Title (department comes from team)
    position: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

// hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// helper method for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
