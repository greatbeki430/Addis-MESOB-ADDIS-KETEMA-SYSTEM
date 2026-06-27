// backend/test-cloud.js
require("dotenv").config({ path: "./.env" });

console.log("🔍 Checking environment variables...");
console.log("📡 Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "Not set!");
console.log(
  "📡 API Key:",
  process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Not set",
);
console.log(
  "📡 API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Not set",
);

const cloudinary = require("./src/config/cloudinary");

async function testCloudinary() {
  try {
    console.log("\n🔗 Testing Cloudinary connection...");

    const result = await cloudinary.uploader.upload(
      "https://www.google.com/images/phd/px.gif",
      {
        folder: "services",
        public_id: "test-image",
      },
    );

    console.log("\n✅ Cloudinary connected successfully!");
    console.log("📸 Image URL:", result.secure_url);
    console.log("🆔 Public ID:", result.public_id);

    // Extract folder from public_id
    const publicIdParts = result.public_id.split("/");
    const folder = publicIdParts.slice(0, -1).join("/");
    const filename = publicIdParts[publicIdParts.length - 1];

    console.log("📁 Folder:", folder || "(root)");
    console.log("📄 Filename:", filename);
    console.log("📏 File Size:", result.bytes, "bytes");
    console.log("📐 Dimensions:", result.width, "x", result.height);
    console.log("🔄 Format:", result.format);
  } catch (error) {
    console.error("\n❌ Cloudinary connection failed:");
    console.error("Error:", error.message);
  }
}

testCloudinary();
