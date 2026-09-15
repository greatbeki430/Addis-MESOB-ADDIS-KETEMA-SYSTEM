// backend/src/scripts/bulkRecoverPhantomUsers.js
//
// Scans every PendingRegistration with status "approved" and repairs
// the ones whose createdUser doesn't resolve to a real User — i.e.
// the exact class of bug fixed by employeeDeletionService.js.
//
// For each orphaned record it:
//   1. Recreates the User (fresh temp password — the original is
//      unrecoverable, it was only ever stored as a bcrypt hash and
//      that hash is gone with the deleted document).
//   2. Repoints PendingRegistration.createdUser at the new User._id.
//   3. Recreates the GoldenMondayPresenter roster row.
//   4. Sends fresh credentials over Telegram if a telegramChatId is on file.
//
// This immediately makes each recovered person show up in:
//   - User Management page  (reads User.find())
//   - Employee Management page  (reads GoldenMondayPresenter.find(), populate("user"))
// No frontend changes needed — both pages just read from the DB.
//
// Usage:
//   node src/scripts/bulkRecoverPhantomUsers.js            # dry run, lists what's broken
//   node src/scripts/bulkRecoverPhantomUsers.js --fix       # actually repairs everything found

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const {
  generateTempPassword,
  sendMessage,
} = require("../services/telegram/utils");

const MONGODB_URI = process.env.MONGO_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://akmesob.vercel.app";
const DRY_RUN = !process.argv.includes("--fix");

async function recoverOne(pending) {
  console.log(
    `\n🔧 Recovering: ${pending.name} <${pending.email}> (pending _id: ${pending._id})`,
  );

  if (DRY_RUN) {
    console.log("   [dry run — no changes made]");
    return;
  }

  let user = await User.findOne({ email: pending.email });

  if (user) {
    console.log(
      `   ℹ️ User already exists by email: ${user._id} — repointing pending record only`,
    );
  } else {
    const tempPassword = generateTempPassword();
    user = await User.create({
      name: pending.name,
      email: pending.email,
      password: tempPassword, // hashed by User's pre('save') hook
      role: "employee",
      phone: pending.phone || "",
      branch: pending.branch || "Addis Ketema",
      position: pending.position || "",
      telegramChatId: pending.telegramChatId,
      profilePhotoUrl: pending.profilePhotoUrl || "",
    });
    console.log(`   ✅ Recreated user: ${user._id}`);

    if (pending.telegramChatId) {
      await sendMessage(
        pending.telegramChatId,
        `🔧 *Account Recovered*\n\n` +
          `We found and fixed an issue with your account. Here are fresh login credentials:\n\n` +
          `📧 *Email:* ${user.email}\n` +
          `🔑 *Password:* ${tempPassword}\n\n` +
          `🔗 Login: ${FRONTEND_URL}/login\n\n` +
          `⚠️ Please change your password after logging in. Sorry for the inconvenience!`,
        { parse_mode: "Markdown" },
      );
      console.log("   ✅ Sent fresh credentials via Telegram");
    } else {
      console.log(
        `   ⚠️ No telegramChatId — temp password: ${tempPassword} (record this now)`,
      );
    }
  }

  pending.createdUser = user._id;
  await pending.save();
  console.log(`   ✅ PendingRegistration.createdUser repointed to ${user._id}`);

  const existingPresenter = await GoldenMondayPresenter.findOne({
    user: user._id,
  });
  if (existingPresenter) {
    console.log("   ℹ️ Roster entry already exists");
  } else {
    await GoldenMondayPresenter.create({
      user: user._id,
      name: pending.name,
      email: pending.email,
      department: pending.department || "",
      position: pending.position || "",
      phone: pending.phone || "",
      profilePhotoUrl: pending.profilePhotoUrl || "",
      skills: pending.skills || [],
      isEligible: true,
      timesPresented: 0,
      registeredAt: new Date(),
    });
    console.log("   ✅ Created Golden Monday roster entry");
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");
  console.log(
    DRY_RUN
      ? "🔍 DRY RUN — pass --fix to actually repair records\n"
      : "🔧 FIX MODE — repairs will be made\n",
  );

  const approved = await PendingRegistration.find({ status: "approved" });
  console.log(
    `📋 Found ${approved.length} PendingRegistration(s) marked "approved"`,
  );

  const orphaned = [];
  for (const p of approved) {
    const user = p.createdUser ? await User.findById(p.createdUser) : null;
    if (!user) orphaned.push(p);
  }

  if (orphaned.length === 0) {
    console.log("\n🎉 No orphaned records found. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  console.log(`\n⚠️ ${orphaned.length} orphaned record(s) found:`);
  orphaned.forEach((p) =>
    console.log(
      `   - ${p.name} <${p.email}> (createdUser: ${p.createdUser || "none"})`,
    ),
  );

  for (const p of orphaned) {
    await recoverOne(p);
  }

  console.log(
    DRY_RUN
      ? "\n✅ Dry run complete. Re-run with --fix to apply repairs."
      : "\n🎉 All orphaned records repaired.",
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Bulk recovery script failed:", err);
  process.exit(1);
});
