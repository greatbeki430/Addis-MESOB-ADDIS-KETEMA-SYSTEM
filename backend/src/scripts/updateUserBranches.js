// Run this script once to update all existing users with a default branch
// Usage: node backend/src/scripts/updateUserBranches.js

const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/addis-mesob";

async function updateUserBranches() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    // Update all users who don't have a branch or have null/empty branch
    const result = await User.updateMany(
      {
        $or: [{ branch: { $exists: false } }, { branch: null }, { branch: "" }],
      },
      {
        $set: { branch: "Addis Ketema" },
      },
    );

    console.log(
      `✅ Updated ${result.modifiedCount} users with default branch "Addis Ketema"`,
    );

    // Also update users with empty department
    const deptResult = await User.updateMany(
      {
        $or: [{ department: { $exists: false } }, { department: null }],
      },
      {
        $set: { department: "" },
      },
    );

    console.log(
      `✅ Updated ${deptResult.modifiedCount} users with empty department`,
    );

    // Show sample of users after update
    const sampleUsers = await User.find(
      {},
      "name email branch department",
    ).limit(5);
    console.log("\n📋 Sample users after update:");
    sampleUsers.forEach((user) => {
      console.log(
        `  👤 ${user.name} - Branch: ${user.branch || "N/A"}, Department: ${user.department || "N/A"}`,
      );
    });

    await mongoose.disconnect();
    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error updating users:", error.message);
    process.exit(1);
  }
}

updateUserBranches();
