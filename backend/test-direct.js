// backend/test-direct.js
// Diagnostic script — verifies MongoDB reachability with a direct
// (single-node) connection and IPv4 forced. Contains NO credentials in
// source.
//
// Usage:
//   MONGO_URI="mongodb://user:pass@host:27017/db?..." node backend/test-direct.js
//
// If MONGO_URI is missing, this script exits with a clear error rather
// than falling back to a hardcoded URI.

const mongoose = require("mongoose");

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI is not set.");
  console.error(
    "   Set it in your environment or in backend/.env before running this script.",
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

const redactedUri = uri.replace(/\/\/([^@]+)@/, "//<redacted>@");
console.log("Testing direct connection...");
console.log("Target:", redactedUri);
console.log("Node version:", process.version);

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 10000,
    family: 4, // Force IPv4
  })
  .then(() => {
    console.log("✅ CONNECTED!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    // Do not print `err` — its `_message` and `reason` fields can
    // include the connection string with credentials.
    process.exit(1);
  });
