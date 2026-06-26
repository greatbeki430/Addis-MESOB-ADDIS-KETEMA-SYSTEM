// backend/src/scripts/seedServices.js
const mongoose = require("mongoose");
const path = require("path");
const Service = require("../models/Service");
const SERVICES = require("../constants/services");

// ✅ Load .env from the correct path
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const seedDatabase = async () => {
  try {
    // ✅ Use MONGO_URI (your .env variable name)
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error("❌ MONGO_URI is not defined in .env file!");
      console.log("📝 Your .env file should have:");
      console.log("   MONGO_URI=your_mongodb_connection_string");
      process.exit(1);
    }

    console.log(
      `🔗 Connecting to MongoDB: ${mongoURI.replace(/\/\/.*@/, "//***:***@")}`,
    );
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Clear existing services
    const deleted = await Service.deleteMany({});
    console.log(`🗑️ Cleared ${deleted.deletedCount} existing services`);

    // Insert services from shared constants
    const result = await Service.insertMany(SERVICES);
    console.log(`✅ ${result.length} services seeded successfully!`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedDatabase();
