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
    console.log("✅ Admin created:", admin.email);

    // 2. Create Super Admin
    const superAdmin = await User.create({
      name: "Manager Name",
      email: "superadmin@mesob.gov.et",
      password: "superadmin123",
      role: "superadmin",
      phone: "0911111111",
    });
    console.log("✅ Super Admin created:", superAdmin.email);

    // 3. Create Employee
    const employee = await User.create({
      name: "Sample Employee",
      email: "employee@mesob.gov.et",
      password: "employee123",
      role: "employee",
      phone: "0922222222",
    });
    console.log("✅ Employee created:", employee.email);

    // 4. Create Team Leader
    const leader = await User.create({
      name: "Bayisa Bekele",
      email: "leader@mesob.gov.et",
      password: "leader123",
      role: "leader",
      phone: "0918765432",
    });
    console.log("✅ Team Leader created:", leader.email);

    // 5. Create Sample Team
    const team = await Team.create({
      name: "አዲስ መሶብ አቻ ፎረም ቡድን",
      leader: leader._id,
      members: [leader._id],
      department: "Public Service & Human Resource",
    });
    console.log("👥 Team created");

    // 6. Seed Services (from your documents)
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
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🟣 Super Admin → superadmin@mesob.gov.et / superadmin123");
    console.log("🟢 Admin       → admin@mesob.gov.et / admin123");
    console.log("🟠 Team Leader → leader@mesob.gov.et / leader123");
    console.log("🔵 Employee    → employee@mesob.gov.et / employee123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedData();
