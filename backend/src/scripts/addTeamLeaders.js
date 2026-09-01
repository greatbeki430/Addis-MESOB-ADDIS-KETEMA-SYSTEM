// backend/src/scripts/addTeamLeaders.js
//
// Safely adds team-leader accounts WITHOUT touching any existing data.
// Unlike seeder.js (which wipes ALL users/teams/services first), this
// script only creates the accounts listed below, skipping any email that
// already exists.
//
// ── Before running ──
// 1. Edit the LEADERS array below with the 5 real people: name, email,
//    a starting password (they should change it after first login — see
//    ChangePassword.jsx / PUT /api/auth/change-password), and optionally
//    which existing team they lead (by team name, matched case-sensitively
//    against Team.name).
// 2. If a leader should head a brand-new team rather than an existing one,
//    set `team: null` and create the Team separately (via the admin Team
//    Management page, or by extending this script) — this script does not
//    create teams, only users, so it can't accidentally overwrite one.
//
// ── How to run ──
//   cd backend
//   node src/scripts/addTeamLeaders.js
//
// Requires the same .env (MONGO_URI) the main server uses.

const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const Team = require("../models/Team");

// ─────────────────────────────────────────────────────────────────────────
// ✏️ EDIT ME: replace with the 5 real team leaders.
// `password` is a temporary password — make each one unique and tell the
// person to change it on first login. Do not reuse one password across all 5.
// ─────────────────────────────────────────────────────────────────────────
const LEADERS = [
  {
    name: "Leader One Full Name",
    email: "leader1@mesob.gov.et",
    password: "ChangeMe#2026-1",
    phone: "",
    team: null, // e.g. "Team A Name" to attach to an existing team
  },
  {
    name: "Leader Two Full Name",
    email: "leader2@mesob.gov.et",
    password: "ChangeMe#2026-2",
    phone: "",
    team: null,
  },
  {
    name: "Leader Three Full Name",
    email: "leader3@mesob.gov.et",
    password: "ChangeMe#2026-3",
    phone: "",
    team: null,
  },
  {
    name: "Leader Four Full Name",
    email: "leader4@mesob.gov.et",
    password: "ChangeMe#2026-4",
    phone: "",
    team: null,
  },
  {
    name: "Leader Five Full Name",
    email: "leader5@mesob.gov.et",
    password: "ChangeMe#2026-5",
    phone: "",
    team: null,
  },
];

const run = async () => {
  await connectDB();

  console.log(
    `\nAdding ${LEADERS.length} team-leader accounts (role: "leader")...\n`,
  );

  const results = { created: [], skipped: [] };

  for (const entry of LEADERS) {
    const existing = await User.findOne({ email: entry.email });
    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${entry.email}`);
      results.skipped.push(entry.email);
      continue;
    }

    let teamDoc = null;
    if (entry.team) {
      teamDoc = await Team.findOne({ name: entry.team });
      if (!teamDoc) {
        console.warn(
          `⚠️  Team "${entry.team}" not found for ${entry.email} — creating the user with no team attached. Assign a team later from Team Management.`,
        );
      }
    }

    const user = await User.create({
      name: entry.name,
      email: entry.email,
      password: entry.password, // hashed automatically by the User model's pre-save hook
      role: "leader",
      phone: entry.phone || "",
      team: teamDoc ? teamDoc._id : null,
    });

    // Give this leader "full access" within their team scope by also
    // making them the recorded leader of that team (leaderOrAdmin checks
    // and dailyReportController's sameTeam() scoping both key off this).
    if (teamDoc) {
      teamDoc.leader = user._id;
      if (!teamDoc.members.some((m) => m.toString() === user._id.toString())) {
        teamDoc.members.push(user._id);
      }
      await teamDoc.save();
    }

    console.log(`✅ Created: ${entry.name} <${entry.email}> (role: leader)`);
    results.created.push(entry.email);
  }

  console.log("\n──────────────────────────────────────────");
  console.log(
    `Created: ${results.created.length}, Skipped: ${results.skipped.length}`,
  );
  console.log("──────────────────────────────────────────\n");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((error) => {
  console.error("❌ Failed to add team leaders:", error);
  process.exit(1);
});
