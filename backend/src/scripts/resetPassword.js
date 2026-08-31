// backend/scripts/resetPassword.js
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const resetPassword = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error("❌ No MongoDB URI found in .env file");
      process.exit(1);
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get email from command line or use default
    const email = process.argv[2] || "superadmin@mesob.gov.et";
    const newPassword = process.argv[3] || "Admin@123456";

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);

      // List all users
      const allUsers = await User.find({}, "email name role");
      console.log("📋 Available users:");
      allUsers.forEach((u) => console.log(`  - ${u.email} (${u.role})`));

      process.exit(1);
    }

    console.log(`👤 Found user: ${user.name} (${user.email})`);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log(`✅ Password reset successfully for ${email}`);
    console.log(`🔑 New password: ${newPassword}`);
    console.log("✅ Password hashed and saved");

    // Verify the password was hashed
    const updatedUser = await User.findOne({ email });
    const isHashed =
      updatedUser.password.startsWith("$2a$") ||
      updatedUser.password.startsWith("$2b$");
    console.log(
      `🔐 Password is ${isHashed ? "properly hashed ✅" : "NOT hashed ❌"}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to reset password:", error);
    process.exit(1);
  }
};

resetPassword();
