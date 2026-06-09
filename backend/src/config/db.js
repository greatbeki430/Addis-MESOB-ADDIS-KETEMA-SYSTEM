// backend/src/config/database.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Log to debug (remove in production)
    console.log("🔍 MONGO_URI exists?", !!process.env.MONGO_URI);
    console.log(
      "📝 MONGO_URI starts with:",
      process.env.MONGO_URI?.substring(0, 50),
    );

    // Add connection options for better reliability
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📀 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    // Don't exit immediately, let it retry
    process.exit(1);
  }
};

module.exports = connectDB;
