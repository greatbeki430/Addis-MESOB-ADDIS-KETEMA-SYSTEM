
// backend/scripts/addProfilePhotoToUsers.js
// Run with: node backend/scripts/addProfilePhotoToUsers.js

const mongoose = require("mongoose");
const User = require("../models/User");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
require("dotenv").config();

async function migrateProfilePhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all presenters with profile photos
    const presenters = await GoldenMondayPresenter.find({
      profilePhotoUrl: { $ne: "" },
    });

    console.log(`Found ${presenters.length} presenters with profile photos`);

    let updated = 0;
    let skipped = 0;

    for (const presenter of presenters) {
      const user = await User.findById(presenter.user);
      if (!user) {
        console.log(`⚠️ User not found for presenter: ${presenter.name}`);
        skipped++;
        continue;
      }
      
      if (user.profilePhotoUrl) {
        console.log(`⏭️ User ${user.email} already has a profile photo, skipping`);
        skipped++;
        continue;
      }

      user.profilePhotoUrl = presenter.profilePhotoUrl || "";
      user.profilePhotoPublicId = presenter.profilePhotoPublicId || "";
      await user.save();
      updated++;
      console.log(`✅ Updated user: ${user.email} with photo`);
    }

    console.log(`✅ Updated ${updated} users with profile photos`);
    console.log(`⏭️ Skipped ${skipped} users`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateProfilePhotos();
