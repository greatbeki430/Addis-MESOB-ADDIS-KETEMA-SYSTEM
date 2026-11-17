// backend/test.js
// Diagnostic script — verifies the backend can reach MongoDB with the
// URI configured in the environment. Contains NO credentials in source.
//
// Usage:
//   MONGO_URI="mongodb://user:pass@host:27017/db?..." node backend/test.js
//
// If MONGO_URI is missing or still the placeholder, this script exits
// with a clear error rather than falling back to a hardcoded URI.

const mongoose = require("mongoose");

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI is not set.");
  console.error(
    "   Set it in your environment or in backend/.env before running this script.",
  );
  console.error(
    "   Example: MONGO_URI='mongodb://user:pass@host:27017/db?retryWrites=true&w=majority&authSource=admin' node backend/test.js",
  );
  process.exit(1);
}

if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
  console.error(
    "❌ MONGO_URI must start with mongodb:// or mongodb+srv:// — got:",
    uri.slice(0, 12) + "…",
  );
  process.exit(1);
}

// Do not print the full URI — it contains credentials.
const redactedUri = uri.replace(/\/\/([^@]+)@/, "//<redacted>@");
console.log("🔍 Testing MongoDB connection...");
console.log("📝 Target:", redactedUri);

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ CONNECTED SUCCESSFULLY!");
    console.log("📀 Database name:", mongoose.connection.db.databaseName);
    console.log("🔗 Host:", mongoose.connection.host);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  });
