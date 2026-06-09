// backend/test-connection.js
require("dotenv").config();
const mongoose = require("mongoose");

async function testConnection() {
  console.log("🔍 Testing MongoDB Atlas connection...");
  console.log(
    "📝 Using URI:",
    process.env.MONGO_URI?.replace(/:[^:]*@/, ":****@"),
  ); // Hide password

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in .env file!");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connection successful!");
    console.log(
      "📀 Connected to database:",
      mongoose.connection.db.databaseName,
    );
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

testConnection();
