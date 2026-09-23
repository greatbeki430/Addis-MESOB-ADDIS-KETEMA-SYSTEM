// backend/src/services/leaderboardService.js
// Computes the four leaderboards:
//   • Evaluation — Teams       (average of member totals per team)
//   • Evaluation — People      (individual evaluation totals, all teams)
//   • Forum      — Teams       (composite: meetings + attendance + completeness)
//   • Forum      — People      (participation count from report authorship)
//
// All functions return PLAIN data (no Mongoose docs), sorted per the
// agreed tiebreaker order. No role filtering happens here — that's the
// controller's job. This keeps the ranking math testable in isolation.

const mongoose = require("mongoose");
const Evaluation = require("../models/Evaluation");
const Meeting = require("../models/Meeting");
const Team = require("../models/Team");
const User = require("../models/User");

// ─── Period helpers ────────────────────────────────────────
// Every board is computed over a closed-open date range
// [from, to). Passing `from` and `to` in explicitly keeps the service
// deterministic and testable; the controller derives them from query
// params (defaults to the current calendar month).
//
// Both defaults produce UTC midnight. That matters because:
//   • The frontend sends bare YYYY-MM-DD strings, which
//     parseDateParam below interprets as UTC midnight.
//   • Using server-local midnight (new Date(y, m, 1)) would shift the
//     window by the server's UTC offset, so a user who picked "This
//     Month" would get a different range than the same user who sent
//     no period at all. Keeping both paths on UTC means they always
//     match, and a document created at 23:00 EAT on the last day of
//     a month lands inside the month it belongs to in Addis.

const startOfMonth = (d = new Date()) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));

const startOfNextMonth = (d = new Date()) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0));

// Parse a "YYYY-MM-DD" string as UTC midnight of that calendar day.
// `new Date("2026-09-01")` already does this per spec, but being explicit
// avoids surprises if a caller ever sends a full ISO timestamp. Anything
// that already contains time information (T or Z) is trusted as-is.
const parseDateParam = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === "string" && /[TZ]/.test(value)) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date range");
    return d;
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date range");
  return d;
};

const resolveRange = ({ from, to } = {}) => {
  const fromDate = parseDateParam(from, startOfMonth());
  const toDate = parseDateParam(to, startOfNextMonth());
  if (toDate <= fromDate) {
    throw new Error("Invalid date range: to must be after from");
  }
  return { from: fromDate, to: toDate };
};

// ─── Criteria constant — kept in sync with frontend/constants/criteria.js
// Only used for completeness scoring in the forum board. Not authoritative;
// the evaluation board reads totals straight off the saved evaluation.
const CRITERIA_ITEM_COUNT = 15;

// ─── Evaluation — Teams ────────────────────────────────────
// A team's score is the average of every member total across every
// evaluation submitted for that team in the period. Ranks are 1-based,
// ties broken by best-performer score, then team size, then submission
// time, then alphabetical.
const computeEvaluationTeamBoard = async ({ from, to, teamFilter = null }) => {
  const matchStage = {
    createdAt: { $gte: from, $lt: to },
  };
  if (teamFilter) matchStage.team = new mongoose.Types.ObjectId(teamFilter);

  const rows = await Evaluation.aggregate([
    { $match: matchStage },
    {
      $project: {
        team: 1,
        teamName: 1,
        totalScores: 1,
        bestPerformer: 1,
        createdAt: 1,
        members: 1,
      },
    },
  ]);

  const teamMap = new Map();

  for (const ev of rows) {
    const teamId = ev.team ? ev.team.toString() : `no-team:${ev.teamName}`;
    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        teamId: ev.team ? ev.team.toString() : null,
        teamName: ev.teamName || "Untitled Team",
        membersSeen: new Set(),
        memberTotals: new Map(),
        bestPerformerScore: -1,
        bestPerformerName: null,
        firstSubmission: ev.createdAt,
        evaluationCount: 0,
        memberCount: 0,
      });
    }
    const bucket = teamMap.get(teamId);
    bucket.evaluationCount += 1;
    if (ev.createdAt < bucket.firstSubmission) {
      bucket.firstSubmission = ev.createdAt;
    }

    const totals = Array.isArray(ev.totalScores) ? ev.totalScores : [];
    for (const row of totals) {
      const name = row?.name;
      if (!name) continue;
      const value = Number(row.total) || 0;
      if (!bucket.memberTotals.has(name)) {
        bucket.memberTotals.set(name, []);
      }
      bucket.memberTotals.get(name).push(value);
      bucket.membersSeen.add(name);
      if (value > bucket.bestPerformerScore) {
        bucket.bestPerformerScore = value;
        bucket.bestPerformerName = name;
      }
    }
  }

  const teams = [];
  for (const [, bucket] of teamMap) {
    let sum = 0;
    let count = 0;
    for (const [, arr] of bucket.memberTotals) {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      sum += avg;
      count += 1;
    }
    const averageScore = count > 0 ? sum / count : 0;
    teams.push({
      teamId: bucket.teamId,
      teamName: bucket.teamName,
      averageScore: Math.round(averageScore * 10) / 10,
      bestPerformerName: bucket.bestPerformerName,
      bestPerformerScore:
        bucket.bestPerformerScore >= 0 ? bucket.bestPerformerScore : 0,
      memberCount: bucket.membersSeen.size,
      evaluationCount: bucket.evaluationCount,
      firstSubmission: bucket.firstSubmission,
    });
  }

  teams.sort((a, b) => {
    if (b.averageScore !== a.averageScore)
      return b.averageScore - a.averageScore;
    if (b.bestPerformerScore !== a.bestPerformerScore)
      return b.bestPerformerScore - a.bestPerformerScore;
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
    const tA = a.firstSubmission ? new Date(a.firstSubmission).getTime() : 0;
    const tB = b.firstSubmission ? new Date(b.firstSubmission).getTime() : 0;
    if (tA !== tB) return tA - tB;
    return a.teamName.localeCompare(b.teamName);
  });

  return teams.map((t, i) => ({ ...t, rank: i + 1 }));
};

// ─── Evaluation — People ───────────────────────────────────
const computeEvaluationPersonBoard = async ({
  from,
  to,
  teamFilter = null,
}) => {
  const matchStage = { createdAt: { $gte: from, $lt: to } };
  if (teamFilter) matchStage.team = new mongoose.Types.ObjectId(teamFilter);

  const rows = await Evaluation.aggregate([
    { $match: matchStage },
    {
      $project: {
        teamName: 1,
        totalScores: 1,
        createdAt: 1,
      },
    },
  ]);

  const personMap = new Map();
  for (const ev of rows) {
    const totals = Array.isArray(ev.totalScores) ? ev.totalScores : [];
    for (const row of totals) {
      const name = row?.name;
      if (!name) continue;
      const value = Number(row.total) || 0;
      if (!personMap.has(name)) {
        personMap.set(name, {
          name,
          teamName: ev.teamName || "Untitled Team",
          scores: [],
          firstSeen: ev.createdAt,
        });
      }
      const p = personMap.get(name);
      p.scores.push(value);
      p.teamName = ev.teamName || p.teamName;
      if (ev.createdAt < p.firstSeen) p.firstSeen = ev.createdAt;
    }
  }

  const people = [];
  for (const [, p] of personMap) {
    const avg = p.scores.reduce((a, b) => a + b, 0) / p.scores.length;
    const best = Math.max(...p.scores);
    people.push({
      name: p.name,
      teamName: p.teamName,
      averageScore: Math.round(avg * 10) / 10,
      bestScore: best,
      evaluationCount: p.scores.length,
      firstSeen: p.firstSeen,
    });
  }

  people.sort((a, b) => {
    if (b.averageScore !== a.averageScore)
      return b.averageScore - a.averageScore;
    if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
    if (b.evaluationCount !== a.evaluationCount)
      return b.evaluationCount - a.evaluationCount;
    const tA = a.firstSeen ? new Date(a.firstSeen).getTime() : 0;
    const tB = b.firstSeen ? new Date(b.firstSeen).getTime() : 0;
    if (tA !== tB) return tA - tB;
    return a.name.localeCompare(b.name);
  });

  return people.map((p, i) => ({ ...p, rank: i + 1 }));
};

// ─── Forum — Teams ─────────────────────────────────────────
// Composite score per team:
//   0.4 × meetings held (normalized against the busiest team)
//   0.3 × average attendance rate (present count / team size)
//   0.3 × average form completeness
// Everything scaled to 0–100.
const computeForumTeamBoard = async ({ from, to, teamFilter = null }) => {
  const matchStage = {
    date: { $gte: from, $lt: to },
    status: { $nin: ["expired", "locked"] },
  };
  if (teamFilter) matchStage.team = new mongoose.Types.ObjectId(teamFilter);

  const rows = await Meeting.aggregate([
    { $match: matchStage },
    {
      $project: {
        team: 1,
        teamName: 1,
        present: 1,
        absent: 1,
        prevResults: 1,
        topics: 1,
        explanation: 1,
        gaps: 1,
        agreements: 1,
        signatures: 1,
        createdAt: 1,
      },
    },
  ]);

  const teamIds = [...new Set(rows.map((r) => r.team).filter(Boolean))];
  const teamDocs = await Team.find({ _id: { $in: teamIds } })
    .select("_id members")
    .lean();
  const teamSizeById = new Map(
    teamDocs.map((t) => [t._id.toString(), (t.members || []).length || 1]),
  );

  const teamMap = new Map();
  for (const m of rows) {
    const teamId = m.team ? m.team.toString() : `no-team:${m.teamName}`;
    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        teamId: m.team ? m.team.toString() : null,
        teamName: m.teamName || "Untitled Team",
        meetings: 0,
        attendeesSum: 0,
        attendeesMax: 0,
        completenessSum: 0,
        firstSubmission: m.createdAt,
      });
    }
    const b = teamMap.get(teamId);
    b.meetings += 1;

    const presentCount = Array.isArray(m.present) ? m.present.length : 0;
    b.attendeesSum += presentCount;
    if (presentCount > b.attendeesMax) b.attendeesMax = presentCount;

    let filled = 0;
    if (presentCount > 0) filled += 1;
    if (Array.isArray(m.absent) && m.absent.length > 0) filled += 1;
    if (Array.isArray(m.prevResults) && m.prevResults.length > 0) filled += 1;
    if (Array.isArray(m.topics) && m.topics.length > 0) filled += 1;
    if (m.explanation && m.explanation.trim().length > 0) filled += 1;
    if (Array.isArray(m.gaps) && m.gaps.length > 0) filled += 1;
    if (Array.isArray(m.agreements) && m.agreements.length > 0) filled += 1;
    if (Array.isArray(m.signatures) && m.signatures.length > 0) filled += 1;
    b.completenessSum += Math.min(filled / 8, 1);

    if (m.createdAt < b.firstSubmission) b.firstSubmission = m.createdAt;
  }

  const maxMeetings = Math.max(
    1,
    ...[...teamMap.values()].map((b) => b.meetings),
  );

  const teams = [];
  for (const [teamId, b] of teamMap) {
    const teamSize = teamSizeById.get(teamId) || b.attendeesMax || 1;
    const attendanceRate =
      b.meetings > 0
        ? Math.min(1, b.attendeesSum / (b.meetings * teamSize))
        : 0;
    const completeness = b.meetings > 0 ? b.completenessSum / b.meetings : 0;
    const meetingsNorm = b.meetings / maxMeetings;

    const composite =
      Math.round(
        (0.4 * meetingsNorm + 0.3 * attendanceRate + 0.3 * completeness) * 1000,
      ) / 10;

    teams.push({
      teamId: b.teamId,
      teamName: b.teamName,
      meetingsHeld: b.meetings,
      averageAttendees:
        b.meetings > 0
          ? Math.round((b.attendeesSum / b.meetings) * 10) / 10
          : 0,
      attendanceRate: Math.round(attendanceRate * 1000) / 10,
      completenessScore: Math.round(completeness * 1000) / 10,
      compositeScore: composite,
      firstSubmission: b.firstSubmission,
    });
  }

  teams.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore)
      return b.compositeScore - a.compositeScore;
    if (b.meetingsHeld !== a.meetingsHeld)
      return b.meetingsHeld - a.meetingsHeld;
    if (b.attendanceRate !== a.attendanceRate)
      return b.attendanceRate - a.attendanceRate;
    const tA = a.firstSubmission ? new Date(a.firstSubmission).getTime() : 0;
    const tB = b.firstSubmission ? new Date(b.firstSubmission).getTime() : 0;
    if (tA !== tB) return tA - tB;
    return a.teamName.localeCompare(b.teamName);
  });

  return teams.map((t, i) => ({ ...t, rank: i + 1 }));
};

// ─── Self-service summary ──────────────────────────────────
const computeMySummary = async ({ userId, from, to }) => {
  const user = await User.findById(userId).select("name team").lean();
  if (!user) return null;

  const myEvals = await Evaluation.find({
    createdAt: { $gte: from, $lt: to },
    "totalScores.name": user.name,
  })
    .select("totalScores teamName")
    .lean();

  const myScores = [];
  for (const ev of myEvals) {
    const row = (ev.totalScores || []).find((r) => r.name === user.name);
    if (row) myScores.push(Number(row.total) || 0);
  }
  const myAverage =
    myScores.length > 0
      ? Math.round(
          (myScores.reduce((a, b) => a + b, 0) / myScores.length) * 10,
        ) / 10
      : null;
  const myBest = myScores.length > 0 ? Math.max(...myScores) : null;

  const meetingsWithMe = await Meeting.find({
    date: { $gte: from, $lt: to },
    $or: [{ present: user.name }, { createdByName: user.name }],
  })
    .select("present createdByName")
    .lean();

  const forumMeetingsAttended = meetingsWithMe.length;
  const forumMeetingsLed = meetingsWithMe.filter(
    (m) => m.createdByName === user.name,
  ).length;

  let teamRank = null;
  let teamBoardSize = null;
  let teamName = null;
  let teamAverageScore = null;

  if (user.team) {
    const board = await computeEvaluationTeamBoard({ from, to });
    teamBoardSize = board.length;
    const idx = board.findIndex((t) => t.teamId === user.team.toString());
    if (idx !== -1) {
      teamRank = idx + 1;
      teamName = board[idx].teamName;
      teamAverageScore = board[idx].averageScore;
    }
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      teamId: user.team ? user.team.toString() : null,
      teamName,
    },
    evaluation: {
      averageScore: myAverage,
      bestScore: myBest,
      evaluationCount: myScores.length,
    },
    forum: {
      meetingsAttended: forumMeetingsAttended,
      meetingsLed: forumMeetingsLed,
    },
    team: {
      rank: teamRank,
      boardSize: teamBoardSize,
      averageScore: teamAverageScore,
    },
  };
};

module.exports = {
  resolveRange,
  computeEvaluationTeamBoard,
  computeEvaluationPersonBoard,
  computeForumTeamBoard,
  computeMySummary,
};
