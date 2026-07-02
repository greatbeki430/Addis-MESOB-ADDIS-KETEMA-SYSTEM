// backend/src/scripts/seedServices.js
// ✅ SAFE SEED - Uses upsert, never deletes existing services
const mongoose = require("mongoose");
const path = require("path");
const Service = require("../models/Service");
const SERVICES = require("../constants/services");

// ✅ Load .env from the correct path
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const seedDatabase = async () => {
  try {
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

    // ✅ Check existing services
    const existingCount = await Service.countDocuments();
    console.log(`📊 Found ${existingCount} existing services`);

    // ✅ Use bulkWrite with upsert - SAFE, never deletes
    const operations = SERVICES.map((service) => ({
      updateOne: {
        filter: {
          name: service.name,
          dept: service.dept,
        },
        update: {
          $set: {
            nameEn: service.nameEn || service.name,
            deptEn: service.deptEn || service.dept,
            active: service.active !== undefined ? service.active : true,
            stdTime: service.stdTime || "",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await Service.bulkWrite(operations, { ordered: false });

    const added = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;
    const total = SERVICES.length;

    console.log("📊 Seed Results:");
    console.log(`   ✅ Added: ${added}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (no changes): ${total - added - updated}`);
    console.log(
      `   📦 Total services in database: ${await Service.countDocuments()}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedDatabase();
