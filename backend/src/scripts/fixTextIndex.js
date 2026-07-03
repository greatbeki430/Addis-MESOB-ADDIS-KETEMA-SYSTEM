// backend/src/scripts/fixTextIndex.js
// One-time script to fix the text index language_override issue
// Run: node src/scripts/fixTextIndex.js

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const fixTextIndex = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error("❌ MONGO_URI is not defined in .env file!");
      process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    const coll = mongoose.connection.collection("crrsadocuments");

    // ✅ Check existing indexes
    const indexes = await coll.indexes();
    console.log(`📊 Found ${indexes.length} indexes`);

    // ✅ Find and drop the old text index
    const textIndex = indexes.find((i) => i.textIndexVersion);
    if (textIndex) {
      console.log(`🗑️ Dropping old text index: ${textIndex.name}`);
      await coll.dropIndex(textIndex.name);
      console.log("✅ Old text index dropped");
    } else {
      console.log("ℹ️ No existing text index found");
    }

    // ✅ Recreate the text index with correct language_override
    console.log("🔧 Creating new text index with language_override...");
    await coll.createIndex(
      {
        referenceNumber: "text",
        citizenName: "text",
        citizenNameAmharic: "text",
        title: "text",
        tags: "text",
        notes: "text",
      },
      {
        language_override: "textSearchLang",
        default_language: "none", // Optional: prevents stemming
      },
    );
    console.log("✅ Text index rebuilt successfully");

    // ✅ Verify
    const newIndexes = await coll.indexes();
    const newTextIndex = newIndexes.find((i) => i.textIndexVersion);
    console.log(`✅ New text index: ${newTextIndex?.name}`);
    console.log(`   language_override: ${newTextIndex?.language_override}`);

    console.log("\n✅ Fix completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
    console.error(error);
    process.exit(1);
  }
};

fixTextIndex();
