const mongoose = require("mongoose");
const DailyReport = require("../models/DailyReport");
require("dotenv").config();

const migrateDailyReports = async () => {
  try {
    // ✅ Use MONGO_URI (not MONGODB_URI)
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error("❌ No MongoDB URI found in .env file");
      console.error("   Please set MONGO_URI or MONGODB_URI");
      process.exit(1);
    }

    console.log("🔄 Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Check if status field exists
    const sample = await DailyReport.findOne({});
    if (sample && sample.status !== undefined) {
      console.log("✅ Status field already exists in the database");
      console.log(`   Sample report status: "${sample.status}"`);
      process.exit(0);
    }

    // Add status field to all reports that don't have it
    const result = await DailyReport.updateMany(
      { status: { $exists: false } },
      { $set: { status: "draft" } },
    );

    console.log(`✅ Updated ${result.modifiedCount} reports with status field`);
    console.log(`✅ ${result.matchedCount} reports matched the query`);

    // Verify
    const updatedSample = await DailyReport.findOne({});
    console.log(
      `✅ Verification - Sample report status: "${updatedSample?.status || "N/A"}"`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrateDailyReports();
