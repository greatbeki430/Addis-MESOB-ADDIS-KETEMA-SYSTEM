const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Team = require("./models/Team");
const Service = require("./models/Service");
const connectDB = require("./config/db");

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data (optional - comment out if you don't want to reset)
    await User.deleteMany();
    await Team.deleteMany();
    await Service.deleteMany();

    console.log("🗑️  Existing data cleared...");

    // 1. Create Admin User
    const admin = await User.create({
      name: "Gezagn Bekele",
      email: "admin@mesob.gov.et",
      password: "admin123",
      role: "admin",
      phone: "0912345678",
    });

    // 2. Create Team Leader
    const leader = await User.create({
      name: "Bayisa Bekele",
      email: "leader@mesob.gov.et",
      password: "leader123",
      role: "leader",
      phone: "0918765432",
    });

    // 3. Create Sample Team
    const team = await Team.create({
      name: "አዲስ መሶብ አቻ ፎረም ቡድን",
      leader: leader._id,
      members: [leader._id],
      department: "Public Service & Human Resource",
    });

    console.log("👥 Team created");

    // 4. Seed Services (from your documents)
    const servicesData = [
      {
        dept: "ገቢዎች",
        deptEn: "Revenue",
        name: "ቲን ሬጅስትሬሽን",
        nameEn: "TIN Registration",
        active: true,
      },
      {
        dept: "ገቢዎች",
        deptEn: "Revenue",
        name: "አዲስ የንግድ ፍቃድ",
        nameEn: "New Business License",
        active: true,
      },
      {
        dept: "አሽ/ተሽ",
        deptEn: "Transport",
        name: "የአሽከርካሪ ፈቃድ ዕድሳት",
        nameEn: "Driver License Renewal",
        active: true,
      },
      {
        dept: "ሲቪል ምዝገባ",
        deptEn: "Civil Registry",
        name: "የልደት ምዝገባ",
        nameEn: "Birth Registration",
        active: true,
      },
      {
        dept: "ስራና ክህሎት",
        deptEn: "Labor & Skills",
        name: "ስራ ፈላጊዎች ምዝገባ",
        nameEn: "Jobseeker Registration",
        active: true,
      },
    ];

    await Service.insertMany(servicesData);
    console.log("📋 Services seeded");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n🔑 Login Credentials:");
    console.log("Admin  → admin@mesob.gov.et / admin123");
    console.log("Leader → leader@mesob.gov.et / leader123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedData();
