// backend/src/scripts/updateUserPosition.js
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/addis-mesob";

async function updateUserPosition() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    // Update users with position field
    const result = await User.updateMany(
      {},
      {
        $set: {
          position: "",
        },
      },
    );

    console.log(`✅ Updated ${result.modifiedCount} users with position field`);

    // Show sample users
    const sampleUsers = await User.find(
      {},
      "name email position team",
    ).populate("team", "name department");
    console.log("\n📋 Sample users:");
    sampleUsers.forEach((user) => {
      console.log(
        `  👤 ${user.name} - Position: ${user.position || "Not set"} - Team: ${user.team?.name || "None"} (${user.team?.department || "No dept"})`,
      );
    });

    await mongoose.disconnect();
    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error updating users:", error.message);
    process.exit(1);
  }
}

updateUserPosition();
