// backend/src/models/Department.js
// Standalone department registry. Decoupled from
// GoldenMondayPresenter.department (which stays a free-text string for
// backward compatibility) — this lets admins pre-create a department
// before anyone is assigned to it, and gives departments an actual
// identity (id, description, head) instead of being inferred purely
// from whatever strings happen to appear on employee records.

const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "", trim: true },

    // Optional department head — just a reference, no special
    // permissions implied by this alone.
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    headName: { type: String, default: "", trim: true },

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: { type: String, required: true },
  },
  { timestamps: true },
);

departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model("Department", departmentSchema);
