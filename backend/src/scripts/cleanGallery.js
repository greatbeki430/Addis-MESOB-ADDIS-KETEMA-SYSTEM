// backend/src/scripts/cleanGallery.js
// WARNING: This deletes ALL Golden Monday gallery data!
// Run with: node backend/src/scripts/cleanGallery.js

require("dotenv").config();

const mongoose = require("mongoose");
const GoldenMondayFolder = require("../models/GoldenMondayFolder");
const GoldenMondayGallery = require("../models/GoldenMondayGallery");

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGO_URI not set in .env");
  process.exit(1);
}

const clean = async () => {
  console.log("⚠️  WARNING: This will delete ALL Golden Monday gallery data!");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const folderCount = await GoldenMondayFolder.countDocuments();
    const galleryCount = await GoldenMondayGallery.countDocuments();

    console.log(`📁 Found ${folderCount} folders`);
    console.log(`🖼️ Found ${galleryCount} gallery items`);

    if (folderCount === 0 && galleryCount === 0) {
      console.log("✅ No data to clean. All clean!");
      process.exit(0);
    }

    // Delete all
    await GoldenMondayFolder.deleteMany({});
    await GoldenMondayGallery.deleteMany({});

    console.log(
      `✅ Deleted ${folderCount} folders and ${galleryCount} gallery items`,
    );
    console.log("✅ Cleanup complete! Ready for fresh testing.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
};

clean();
