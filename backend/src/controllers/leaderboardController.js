// backend/src/controllers/leaderboardController.js
// HTTP layer for the four leaderboards. All ranking math lives in
// leaderboardService — this file only:
//   1. Parses + validates query params (from, to, source, limit)
//   2. Calls the right service function
//   3. Redacts fields per role BEFORE responding
//
// Redaction is server-side on purpose. If we sent everything and relied
// on the client to hide sensitive fields, an employee could open devtools
// and read every team's per-member scores. Doing it here means the data
// literally never leaves the server for viewers who shouldn't see it.

const {
  resolveRange,
  computeEvaluationTeamBoard,
  computeEvaluationPersonBoard,
  computeForumTeamBoard,
  computeMySummary,
} = require("../services/leaderboardService");

// ─── Role helpers ──────────────────────────────────────────
const isSuperAdmin = (u) => u?.role === "superadmin";
const isAdmin = (u) => u?.role === "admin";
const isAdminTier = (u) => isSuperAdmin(u) || isAdmin(u);
const isLeader = (u) => u?.role === "leader";

// ─── Redactors ─────────────────────────────────────────────
// Each redactor takes the full board and returns what the caller is
// allowed to see. Field names in the response stay the same across
// roles so the frontend doesn't have to branch on shape — it just sees
// null where a field is not permitted, and the UI omits those cells.

const redactTeamBoardForAdmin = (board) => board; // full data

const redactTeamBoardForLeader = (board, user) => {
  const myTeamId = user.team ? user.team.toString() : null;
  return board.map((row) => {
    const isMine = row.teamId && row.teamId === myTeamId;
    return {
      ...row,
      // Leaders see everyone's rank and score, but not the private
      // details (best-performer identity, first-submission time) for
      // teams other than their own.
      bestPerformerName: isMine ? row.bestPerformerName : null,
      bestPerformerScore: isMine
        ? row.bestPerformerScore
        : row.bestPerformerScore,
      firstSubmission: null,
      isMyTeam: isMine,
    };
  });
};

const redactTeamBoardForEmployee = (board, user) => {
  const myTeamId = user.team ? user.team.toString() : null;
  return board.map((row) => {
    const isMine = row.teamId && row.teamId === myTeamId;
    return {
      rank: row.rank,
      teamId: row.teamId,
      teamName: row.teamName,
      // Public metric only — the headline number that makes the board
      // meaningful. No per-member details, no best-performer identity.
      averageScore:
        row.averageScore !== undefined ? row.averageScore : row.compositeScore,
      memberCount: row.memberCount ?? undefined,
      meetingsHeld: row.meetingsHeld ?? undefined,
      isMyTeam: isMine,
    };
  });
};

const redactPersonBoardForAdmin = (board) => board; // full data

const redactPersonBoardForLeader = (board, user) => {
  const myTeamName = user.team?.name; // may be undefined; only used as fallback
  return board.map((row) => {
    // Leaders see full rows for members of their own team (matched by
    // team name, which is the only team identifier PersonBoard carries).
    // Everyone else gets a stripped row: name + score + rank only.
    const isMine = myTeamName && row.teamName === myTeamName;
    return isMine
      ? { ...row, isMyTeam: true }
      : {
          rank: row.rank,
          name: row.name,
          teamName: row.teamName,
          averageScore: row.averageScore,
          isMyTeam: false,
        };
  });
};

// ─── Handlers ──────────────────────────────────────────────

// GET /api/leaderboard/teams?source=evaluation|forum&from&to&limit
const getTeamLeaderboard = async (req, res) => {
  try {
    const { source = "evaluation" } = req.query;
    const { from, to } = resolveRange(req.query);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    let board;
    if (source === "evaluation") {
      board = await computeEvaluationTeamBoard({ from, to });
    } else if (source === "forum") {
      board = await computeForumTeamBoard({ from, to });
    } else {
      return res
        .status(400)
        .json({
          success: false,
          message: "source must be 'evaluation' or 'forum'",
        });
    }

    // Apply limit AFTER redaction, so a leader sees the top N of what
    // they're allowed to see (their own team may be rank 47 of 50).
    let visible;
    if (isAdminTier(req.user)) {
      visible = redactTeamBoardForAdmin(board);
    } else if (isLeader(req.user)) {
      visible = redactTeamBoardForLeader(board, req.user);
    } else {
      visible = redactTeamBoardForEmployee(board, req.user);
    }

    // Always include the caller's own team row, even if it's outside the
    // limit — the UI highlights it, and hiding it would be confusing.
    const myTeamId = req.user.team ? req.user.team.toString() : null;
    const myRow = myTeamId
      ? visible.find((r) => r.teamId === myTeamId) || null
      : null;

    const trimmed = visible.slice(0, limit);

    // If my team's row got cut off by the limit, append it at the end
    // with a flag so the client can render it in a "your team" strip.
    if (myRow && !trimmed.find((r) => r.teamId === myTeamId)) {
      trimmed.push({ ...myRow, outsideTop: true });
    }

    res.json({
      success: true,
      source,
      period: { from: from.toISOString(), to: to.toISOString() },
      viewerRole: req.user.role,
      teams: trimmed,
      totalTeams: visible.length,
    });
  } catch (error) {
    console.error("getTeamLeaderboard error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/leaderboard/people?source=evaluation&from&to&limit
// Currently only the evaluation source produces a person board. The
// `source` param is accepted for symmetry with the teams board and for
// the day we add forum-person tracking.
const getPersonLeaderboard = async (req, res) => {
  try {
    const { source = "evaluation" } = req.query;

    if (source !== "evaluation") {
      return res.status(400).json({
        success: false,
        message:
          "The individual leaderboard is only available for source=evaluation today.",
      });
    }

    // Employees are not allowed to view the individual leaderboard at
    // all — that's the same class of data as a team's per-member
    // breakdown. Team leaders may view it, but only their own team's
    // rows come through in full.
    if (!isAdminTier(req.user) && !isLeader(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view individual rankings.",
      });
    }

    const { from, to } = resolveRange(req.query);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const board = await computeEvaluationPersonBoard({ from, to });

    const visible = isAdminTier(req.user)
      ? redactPersonBoardForAdmin(board)
      : redactPersonBoardForLeader(board, req.user);

    res.json({
      success: true,
      source,
      period: { from: from.toISOString(), to: to.toISOString() },
      viewerRole: req.user.role,
      people: visible.slice(0, limit),
      totalPeople: visible.length,
    });
  } catch (error) {
    console.error("getPersonLeaderboard error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/leaderboard/celebration
// One tiny payload for the Dashboard banner. Returns just the top team
// for the current month, no per-member detail. Public to every role.
const getCelebration = async (req, res) => {
  try {
    const { from, to } = resolveRange(); // locked to current month for the banner
    const board = await computeEvaluationTeamBoard({ from, to });
    const top = board[0] || null;

    res.json({
      success: true,
      period: { from: from.toISOString(), to: to.toISOString() },
      topTeam: top
        ? {
            teamId: top.teamId,
            teamName: top.teamName,
            averageScore: top.averageScore,
            memberCount: top.memberCount,
          }
        : null,
      runnerUp: board[1]
        ? {
            teamId: board[1].teamId,
            teamName: board[1].teamName,
            averageScore: board[1].averageScore,
          }
        : null,
    });
  } catch (error) {
    console.error("getCelebration error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/leaderboard/me
// Self-service. Any authenticated user can call it. Returns their own
// scores + team position, never anyone else's.
const getMyPerformance = async (req, res) => {
  try {
    const { from, to } = resolveRange(req.query);
    const summary = await computeMySummary({
      userId: req.user._id,
      from,
      to,
    });
    if (!summary) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.json({
      success: true,
      period: { from: from.toISOString(), to: to.toISOString() },
      ...summary,
    });
  } catch (error) {
    console.error("getMyPerformance error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeamLeaderboard,
  getPersonLeaderboard,
  getCelebration,
  getMyPerformance,
};
