// backend/src/scripts/migrateGoldenMondayFolders.js
// One-time migration script: converts old date+topic folders to the new
// two-level weekly model. Run via: node backend/src/scripts/migrateGoldenMondayFolders.js

// Simple dotenv load - let it find .env automatically
require("dotenv").config();

const mongoose = require("mongoose");
const GoldenMondayFolder = require("../models/GoldenMondayFolder");
const GoldenMondayGallery = require("../models/GoldenMondayGallery");
const {
  mondayOf,
  getOrCreateWeekFolder,
  getOrCreateTypeFolder,
  updateWeekFolderAggregates,
} = require("../services/galleryFolderService");

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGO_URI not set in .env");
  console.error("📁 Current directory:", __dirname);
  console.error(
    "🔍 Checking if .env exists at:",
    require("path").resolve(__dirname, "../../../.env"),
  );
  const fs = require("fs");
  const envPath = require("path").resolve(__dirname, "../../../.env");
  if (fs.existsSync(envPath)) {
    console.log("✅ .env file exists at:", envPath);
    console.log("📄 Reading .env content...");
    const envContent = fs.readFileSync(envPath, "utf8");
    console.log(
      "📄 .env contains MONGO_URI:",
      envContent.includes("MONGO_URI") ? "✅ Yes" : "❌ No",
    );
  } else {
    console.log("❌ .env file NOT found at:", envPath);
  }
  process.exit(1);
}

console.log("📡 Connecting to MongoDB...");
console.log(
  `📡 Using MONGO_URI: ${MONGODB_URI.replace(/\/\/.*@/, "//****:****@")}`,
);

const migrate = async () => {
  console.log("🔄 Starting Golden Monday folder migration...");

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // 1. Find all old-style folders (no folderType field)
    const oldFolders = await GoldenMondayFolder.find({
      folderType: { $exists: false },
    });

    console.log(`📁 Found ${oldFolders.length} old-style folders to migrate`);

    if (oldFolders.length === 0) {
      console.log(
        "✅ No migration needed. All folders are already in the new format.",
      );
      process.exit(0);
    }

    // Show what will be migrated
    console.log("\n📋 Folders to migrate:");
    oldFolders.forEach((f, i) => {
      console.log(
        `  ${i + 1}. ${f.name || "Unnamed"} (created: ${f.createdAt?.toISOString().slice(0, 10) || "unknown"})`,
      );
    });
    console.log("");

    let migrated = 0;
    let failed = 0;
    let totalPhotosMoved = 0;

    for (const oldFolder of oldFolders) {
      try {
        console.log(`\n📂 Processing: ${oldFolder.name || "Unnamed"}`);

        // 2. Determine the week based on createdAt or the folder's date
        const referenceDate = oldFolder.createdAt || new Date();
        const weekOf = mondayOf(referenceDate);
        console.log(`   📅 Week of: ${weekOf.toISOString().slice(0, 10)}`);

        // 3. Get or create the week folder
        const weekFolder = await getOrCreateWeekFolder({
          uploadDate: referenceDate,
          topic: oldFolder.topic || "Golden Monday",
          weekOfEthiopianDate: oldFolder.ethiopianDate || "",
          userId: oldFolder.createdBy,
          userName: oldFolder.createdByName || "System",
        });
        console.log(`   📁 Week folder: ${weekFolder._id}`);

        // 4. Find all photos in this old folder
        const photos = await GoldenMondayGallery.find({
          folder: oldFolder._id,
        });
        console.log(`   📸 Found ${photos.length} photos in this folder`);

        if (photos.length === 0) {
          console.log(`   ⏭️ Skipping empty folder: ${oldFolder.name}`);
          await oldFolder.deleteOne();
          continue;
        }

        // 5. Group photos by fileType
        const groupedByType = {};
        for (const photo of photos) {
          const fileType = photo.fileType || "image";
          if (!groupedByType[fileType]) {
            groupedByType[fileType] = [];
          }
          groupedByType[fileType].push(photo);
        }

        console.log(
          `   📊 Grouped by type: ${Object.keys(groupedByType).join(", ")}`,
        );

        // 6. For each fileType, create or get the type folder and reassign photos
        for (const [fileType, typePhotos] of Object.entries(groupedByType)) {
          console.log(
            `   📁 Processing ${fileType} (${typePhotos.length} files)`,
          );

          const typeFolder = await getOrCreateTypeFolder({
            weekFolder,
            fileType,
            userId: oldFolder.createdBy,
            userName: oldFolder.createdByName || "System",
          });

          // Reassign photos to the new type folder
          for (const photo of typePhotos) {
            photo.folder = typeFolder._id;
            await photo.save();
            totalPhotosMoved++;
          }

          // Update type folder count and cover
          typeFolder.count = typePhotos.length;
          const latestPhoto = typePhotos.reduce((a, b) =>
            a.createdAt > b.createdAt ? a : b,
          );
          typeFolder.coverPhoto = latestPhoto.thumbnailUrl || latestPhoto.url;
          await typeFolder.save();
        }

        // 7. Update week folder aggregates
        await updateWeekFolderAggregates(weekFolder._id);

        // 8. Delete the old folder
        await oldFolder.deleteOne();

        migrated++;
        console.log(
          `   ✅ Migrated folder: ${oldFolder.name} → Week ${weekFolder.weekOf.toISOString().slice(0, 10)}`,
        );
      } catch (err) {
        failed++;
        console.error(
          `   ❌ Failed to migrate folder ${oldFolder.name}:`,
          err.message,
        );
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Migration complete!`);
    console.log(`   📁 Folders migrated: ${migrated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📸 Total photos moved: ${totalPhotosMoved}`);
    console.log("=".repeat(50));

    if (failed > 0) {
      console.log("⚠️ Some folders failed to migrate. Check the logs above.");
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

// Handle uncaught errors
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

migrate();
