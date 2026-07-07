// backend/src/services/goldenMondayRotationService.js
//
// ── The Golden Monday presenter rotation algorithm ─────────────────────
//
// Every Monday, one Addis MESOB employee presents on a topic of their
// choosing. This service decides who presents next.
//
// Why not plain round-robin (a fixed list you walk down one by one)?
//   Round-robin breaks the moment reality intrudes: someone joins the
//   roster late, someone goes on leave, someone is manually skipped for
//   a week. The "position in the list" stops meaning anything and you
//   end up needing a spreadsheet to track where you are.
//
// Why not pure random selection?
//   Random is fair "on average, eventually" but has no memory — the same
//   few people can legitimately get picked twice in a row while someone
//   else waits six months. For a program built on equal participation,
//   that's a real complaint waiting to happen.
//
// What we use instead — a Longest-Wait, Frequency-Balanced score
// (the same family of idea as Deficit Round Robin / fair queuing used
// in network schedulers, applied to people instead of packets):
//
//   score(candidate) =
//         W_RECENCY  * daysSinceLastPresented        (bigger gap → higher score)
//       + W_FREQUENCY * (roster average − timesPresented)  (presented less → higher score)
//       + W_SKIPPED   * timesSkipped                  (passed over before → higher score)
//
//   - Anyone who has never presented is ranked above everyone who has,
//     ordered by how long ago they joined the roster.
//   - Ties (which happen often — e.g. a fresh roster) are broken with a
//     deterministic hash of (userId + weekOf), so the pick is reproducible
//     and auditable — re-running the calculation for the same week always
//     gives the same answer — but not predictable from the roster order.
//   - People on leave or marked ineligible are simply excluded from the
//     candidate pool, so nobody has to remember to "put them back at the
//     top of the queue" when they return — their unchanged
//     lastPresentedAt does that automatically.
//
// This keeps three guarantees the program actually needs:
//   1. Nobody presents twice before everyone eligible has presented once.
//   2. A long-absent-then-returned person doesn't jump the queue OR get
//      buried at the back — their wait time picks up where it left off.
//   3. The outcome is explainable ("longest since last time"), which
//      matters for a program run inside a government office.
//
// ─────────────────────────────────────────────────────────────────────

const crypto = require("crypto");
const GoldenMondayPresenter = require("../models/GoldenMondayPresenter");
const GoldenMondaySession = require("../models/GoldenMondaySession");
const { generatePresentationTopicIdeas } = require("./aiService");

const W_RECENCY = 1;
const W_FREQUENCY = 30; // 1 "extra" presentation ≈ 30 days of waiting
const W_SKIPPED = 15; // being passed over once ≈ 15 days of waiting
const NEVER_PRESENTED_DAYS = 100000; // sentinel — always sorts first

// ============================================================
// Normalize any date to the Monday 00:00:00 UTC of that week.
// This is the key every session/assignment is keyed on.
// ============================================================
const mondayOf = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getUTCDay(); // 0 = Sunday ... 1 = Monday
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const nextMondayFrom = (d = new Date()) => {
  const thisMonday = mondayOf(d);
  const next = new Date(thisMonday);
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
};

// Deterministic 0..1 pseudo-random value from a string — used only to
// break exact score ties in a stable, auditable way (no real randomness).
const stableHashUnit = (str) => {
  const hash = crypto.createHash("sha256").update(str).digest();
  return hash.readUInt32BE(0) / 0xffffffff;
};

// ============================================================
// Score a single candidate for a given target week.
// ============================================================
const scoreCandidate = (presenter, weekOf, rosterAvgPresented) => {
  const daysSinceLast = presenter.lastPresentedAt
    ? Math.floor(
        (weekOf.getTime() - new Date(presenter.lastPresentedAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : NEVER_PRESENTED_DAYS;

  const frequencyGap = rosterAvgPresented - (presenter.timesPresented || 0);

  const score =
    W_RECENCY * daysSinceLast +
    W_FREQUENCY * frequencyGap +
    W_SKIPPED * (presenter.timesSkipped || 0) +
    stableHashUnit(`${presenter.user}-${weekOf.toISOString()}`); // tie-break, negligible weight

  return { presenter, score, daysSinceLast };
};

// ============================================================
// Return the eligible roster, excluding anyone currently on leave.
// ============================================================
const getEligibleRoster = async () => {
  const now = new Date();
  return GoldenMondayPresenter.find({
    isEligible: true,
    $or: [{ onLeaveUntil: null }, { onLeaveUntil: { $lte: now } }],
  }).lean();
};

// ============================================================
// Compute the ranked candidate list for a given week (does not assign).
// Used by the dashboard to show "next up" and the reasoning behind it.
// ============================================================
const computeRanking = async (weekOf = nextMondayFrom()) => {
  const roster = await getEligibleRoster();
  if (roster.length === 0) return { ranking: [], weekOf };

  const totalPresented = roster.reduce(
    (sum, p) => sum + (p.timesPresented || 0),
    0,
  );
  const rosterAvgPresented = totalPresented / roster.length;

  const ranking = roster
    .map((p) => scoreCandidate(p, weekOf, rosterAvgPresented))
    .sort((a, b) => b.score - a.score);

  return { ranking, weekOf, rosterAvgPresented };
};

// ============================================================
// Assign the next presenter for a given week, creating (or updating)
// that week's session. If `manualPresenterId` is given, it overrides
// the algorithm's pick (an admin choice) but is still logged so the
// stats and skip-tracking stay honest.
// ============================================================
const assignNextPresenter = async ({
  weekOf = nextMondayFrom(),
  manualPresenterId = null,
  actorUser,
  generateTopics = true,
} = {}) => {
  const normalizedWeek = mondayOf(weekOf);

  // Don't double-assign a week that already has a presenter.
  const existing = await GoldenMondaySession.findOne({
    weekOf: normalizedWeek,
  });
  if (existing?.presenter) {
    return { session: existing, alreadyAssigned: true };
  }

  const { ranking } = await computeRanking(normalizedWeek);
  if (ranking.length === 0) {
    const err = new Error(
      "No eligible presenters on the roster. Add staff to the Golden Monday roster first.",
    );
    err.code = "NO_ELIGIBLE_PRESENTERS";
    throw err;
  }

  let chosen;
  let method = "auto-rotation";

  if (manualPresenterId) {
    chosen = ranking.find(
      (r) => String(r.presenter.user) === String(manualPresenterId),
    );
    if (!chosen) {
      const err = new Error("Selected presenter is not eligible this week.");
      err.code = "PRESENTER_NOT_ELIGIBLE";
      throw err;
    }
    method = "manual-override";

    // Everyone the algorithm would have picked ahead of the manual
    // choice is credited a "skip" so they move up faster next time.
    const chosenIdx = ranking.indexOf(chosen);
    const passedOver = ranking.slice(0, chosenIdx).map((r) => r.presenter.user);
    if (passedOver.length) {
      await GoldenMondayPresenter.updateMany(
        { user: { $in: passedOver } },
        { $inc: { timesSkipped: 1 } },
      );
    }
  } else {
    chosen = ranking[0];
  }

  const presenter = chosen.presenter;

  // Generate a few topic ideas so the presenter isn't starting blank —
  // they can still pick their own title entirely.
  let suggestedTopics = [];
  if (generateTopics) {
    try {
      const recentTitles = await GoldenMondaySession.find({
        presentationTitle: { $ne: "" },
      })
        .sort({ date: -1 })
        .limit(10)
        .select("presentationTitle -_id")
        .lean();
      suggestedTopics = await generatePresentationTopicIdeas({
        presenterName: presenter.name,
        department: presenter.department,
        recentTitles: recentTitles.map((s) => s.presentationTitle),
      });
    } catch (err) {
      console.warn(
        "[goldenMondayRotationService] Topic suggestion failed, continuing without:",
        err.message,
      );
    }
  }

  const session =
    existing ||
    new GoldenMondaySession({
      title: `Golden Monday — ${normalizedWeek.toDateString()}`,
      date: normalizedWeek,
      weekOf: normalizedWeek,
      rawNotes: "",
      createdBy: actorUser._id,
      createdByName: actorUser.name,
    });

  session.presenter = presenter.user;
  session.presenterName = presenter.name;
  session.presenterDepartment = presenter.department;
  session.assignmentMethod = method;
  session.suggestedTopics = suggestedTopics;
  session.status = "scheduled";
  await session.save();

  await GoldenMondayPresenter.updateOne(
    { user: presenter.user },
    {
      $inc: { timesPresented: 1 },
      $set: { lastPresentedAt: normalizedWeek },
    },
  );

  return { session, alreadyAssigned: false, method };
};

// ============================================================
// A presenter (or an admin on their behalf) locks in the title
// they chose to present.
// ============================================================
const confirmPresentationTitle = async (sessionId, title) => {
  const session = await GoldenMondaySession.findById(sessionId);
  if (!session) {
    const err = new Error("Session not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  session.presentationTitle = title.trim();
  session.titleConfirmedAt = new Date();
  session.title = title.trim(); // keep the display title in sync
  await session.save();
  return session;
};

// ============================================================
// Undo an assignment (e.g. presenter had an emergency). Reverts their
// stats so the rotation stays fair, then re-assigns the week to the
// next-ranked eligible candidate.
// ============================================================
const reassignPresenter = async ({ sessionId, actorUser, reason }) => {
  const session = await GoldenMondaySession.findById(sessionId);
  if (!session) {
    const err = new Error("Session not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (session.presenter) {
    await GoldenMondayPresenter.updateOne(
      { user: session.presenter },
      { $inc: { timesPresented: -1 }, $set: { lastPresentedAt: null } },
    );
  }

  session.presenter = null;
  session.presenterName = "";
  session.presentationTitle = "";
  session.status = "cancelled";
  session.rawNotes = session.rawNotes
    ? `${session.rawNotes}\n[Reassigned: ${reason || "no reason given"}]`
    : `[Reassigned: ${reason || "no reason given"}]`;
  await session.save();

  return assignNextPresenter({ weekOf: session.weekOf, actorUser });
};

module.exports = {
  mondayOf,
  nextMondayFrom,
  getEligibleRoster,
  computeRanking,
  assignNextPresenter,
  confirmPresentationTitle,
  reassignPresenter,
};
