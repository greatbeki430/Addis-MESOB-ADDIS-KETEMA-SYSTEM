const mongoose = require("mongoose");

const uri =
  "mongodb://greatbekele_db_user:bgbggreat@edutrackultimate.iirm8og.mongodb.net:27017/acha_forum?retryWrites=true&w=majority&authSource=admin&directConnection=true";

console.log("Testing direct connection...");
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
    console.error("Full error:", err);
    process.exit(1);
  });
