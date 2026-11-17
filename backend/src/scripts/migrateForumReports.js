// backend/src/scripts/migrateForumReports.js
//
// One-off migration: reclassify legacy Forum Reports that were
// intended as final saves but got stuck in "in_progress"/"auto_saved"
// because handleSaveReport used to omit `status: "completed"`.
//
// SAFETY:
//   • Dry-run by default. The script NEVER writes unless --apply is
//     passed on the command line.
//   • Requires --reason "<text>" when --apply is passed, so every
//     mutated document carries an audit trail in adminNotes.
//   • Idempotent: once a report is "completed", it never matches the
//     candidate filter again.
//   • Never runs from server.js — must be invoked manually.
//
// USAGE:
//   # Dry-run (safe — nothing is written):
//   MONGO_URI="..." node backend/src/scripts/migrateForumReports.js
//
//   # Apply (writes — requires a reason):
//   MONGO_URI="..." node backend/src/scripts/migrateForumReports.js \
//     --apply --reason "Backfill completedAt for signed drafts pre-fix"
//
// OPTIONAL FLAGS:
//   --limit N        Only inspect the first N candidates (default: all).
//   --min-age-hours  Override the 24h age floor (default: 24).
//   --help           Print usage and exit.

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line global-require
  require("dotenv").config();
}

const mongoose = require("mongoose");
const Meeting = require("../models/Meeting");

// ─── CLI parsing ────────────────────────────────────────────
const parseArgs = (argv) => {
  const args = {
    apply: false,
    reason: "",
    limit: 0,
    minAgeHours: 24,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") args.apply = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--reason") args.reason = String(argv[++i] || "");
    else if (a === "--limit") args.limit = Number(argv[++i]) || 0;
    else if (a === "--min-age-hours")
      args.minAgeHours = Number(argv[++i]) || 24;
  }
  return args;
};

const USAGE = `
migrateForumReports — reclassify legacy stuck reports as "completed"

Usage:
  node backend/src/scripts/migrateForumReports.js [--apply] [--reason "..."]

Flags:
  --apply                 Actually write changes. Without it, dry-run only.
  --reason "<text>"       Required with --apply. Recorded in adminNotes.
  --limit N               Only inspect the first N candidates.
  --min-age-hours N       Candidate age floor in hours (default 24).
  --help, -h              Show this message.

Criteria (all must be true):
  • status is "in_progress" or "auto_saved"
  • signatures.length > 0
  • topics.length > 0
  • explanation.trim().length > 0
  • createdAt older than --min-age-hours (default 24)
`;

// ─── Helpers ────────────────────────────────────────────────
const redactUri = (uri) =>
  typeof uri === "string" ? uri.replace(/\/\/([^@]+)@/, "//<redacted>@") : uri;

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toISOString();
};

const fmtAge = (createdAt) => {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

// ─── Main ───────────────────────────────────────────────────
const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(USAGE.trim());
    process.exit(0);
  }

  if (args.apply && !args.reason.trim()) {
    console.error(
      '❌ --apply requires --reason "<text>". No writes were made.',
    );
    console.error("   Example:");
    console.error(
      '     --apply --reason "Backfill completedAt for signed drafts pre-fix"',
    );
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is not set. Nothing was inspected or written.");
    console.error(
      "   Set it in backend/.env or as an env var before running this script.",
    );
    process.exit(1);
  }
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    console.error("❌ MONGO_URI does not look like a Mongo connection string.");
    process.exit(1);
  }

  console.log("🔍 migrateForumReports");
  console.log("   Target:    ", redactUri(uri));
  console.log(
    "   Mode:      ",
    args.apply ? "APPLY (writes)" : "DRY-RUN (no writes)",
  );
  console.log("   Age floor: ", `${args.minAgeHours}h`);
  console.log("   Limit:     ", args.limit > 0 ? args.limit : "all");
  if (args.apply) {
    console.log("   Reason:    ", args.reason.trim());
  }
  console.log("");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15_000,
    socketTimeoutMS: 45_000,
  });

  const ageFloor = new Date(Date.now() - args.minAgeHours * 3_600_000);

  const query = {
    status: { $in: ["in_progress", "auto_saved"] },
    createdAt: { $lt: ageFloor },
    "topics.0": { $exists: true },
    "signatures.0": { $exists: true },
    // explanation is a string, not an array — match non-blank with
    // a regex that excludes empty/whitespace-only values.
    explanation: { $regex: /\S/ },
  };

  let cursor = Meeting.find(query)
    .sort({ createdAt: 1 })
    .select(
      "_id status teamName createdByName createdAt signatures topics explanation adminNotes completedAt finalizedAt",
    )
    .lean();

  if (args.limit > 0) cursor = cursor.limit(args.limit);

  const candidates = await cursor.exec();

  if (candidates.length === 0) {
    console.log("✅ No matching reports found. Nothing to migrate.");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`📋 Found ${candidates.length} candidate report(s):\n`);

  const now = new Date();
  const stampIso = now.toISOString();
  const auditLine = `Migrated by migrateForumReports.js on ${stampIso} — reason: ${args.reason.trim() || "(dry-run)"}`;

  // Report preview
  candidates.forEach((doc, idx) => {
    console.log(`[${idx + 1}/${candidates.length}] _id=${doc._id}`);
    console.log(`   team:      ${doc.teamName || "—"}`);
    console.log(`   author:    ${doc.createdByName || "—"}`);
    console.log(
      `   createdAt: ${fmtDate(doc.createdAt)}  (age ${fmtAge(doc.createdAt)})`,
    );
    console.log(`   status:    ${doc.status}`);
    console.log(
      `   topics:    ${Array.isArray(doc.topics) ? doc.topics.length : 0}`,
    );
    console.log(
      `   signatures: ${Array.isArray(doc.signatures) ? doc.signatures.length : 0}`,
    );
    console.log(
      `   explanation: ${typeof doc.explanation === "string" ? `${doc.explanation.trim().length} chars` : "—"}`,
    );

    // Diff preview
    const diff = [];
    diff.push({ field: "status", from: doc.status, to: "completed" });
    diff.push({
      field: "completedAt",
      from: doc.completedAt || null,
      to: stampIso,
    });
    diff.push({
      field: "finalizedAt",
      from: doc.finalizedAt || null,
      to: stampIso,
    });
    diff.push({
      field: "adminNotes",
      from: doc.adminNotes || "",
      to: doc.adminNotes ? `${doc.adminNotes}\n${auditLine}` : auditLine,
    });
    console.log("   would change:");
    diff.forEach((d) => {
      console.log(`     • ${d.field}:`);
      console.log(`         from: ${String(d.from) || "—"}`);
      console.log(`         to:   ${String(d.to) || "—"}`);
    });
    console.log("");
  });

  if (!args.apply) {
    console.log(
      '🧪 Dry-run complete. No changes were written. Re-run with --apply --reason "<text>" to apply.',
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  // Apply
  console.log("✍️  Applying changes...\n");

  let updated = 0;
  let failed = 0;
  for (const doc of candidates) {
    try {
      // Re-fetch by _id and re-check status to make sure nothing else
      // moved it between our read and our write.
      const fresh = await Meeting.findById(doc._id).select("status adminNotes");
      if (!fresh) {
        console.warn(`   ⚠ skipped ${doc._id}: not found`);
        continue;
      }
      if (!["in_progress", "auto_saved"].includes(fresh.status)) {
        console.warn(
          `   ⚠ skipped ${doc._id}: status changed to "${fresh.status}" since read`,
        );
        continue;
      }

      fresh.status = "completed";
      fresh.completedAt = now;
      fresh.finalizedAt = now;
      const base = fresh.adminNotes ? `${fresh.adminNotes}\n` : "";
      fresh.adminNotes = `${base}${auditLine}`;
      await fresh.save();

      updated += 1;
      console.log(`   ✅ updated ${doc._id}`);
    } catch (err) {
      failed += 1;
      console.error(`   ❌ failed ${doc._id}: ${err.message}`);
    }
  }

  console.log("");
  console.log(
    `✅ Done. Updated: ${updated}. Skipped/Failed: ${failed}. Total candidates: ${candidates.length}.`,
  );

  await mongoose.disconnect();
  process.exit(failed > 0 ? 2 : 0);
};

main().catch(async (err) => {
  console.error("❌ migrateForumReports crashed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* noop */
  }
  process.exit(1);
});
