// frontend/src/utils/forumReportHelpers.js
// Pure helpers for the Peer Forum Report page (no React, no DOM) so the
// roster / attendance / signature / translation rules can be unit-tested.

// ─── Roster ──────────────────────────────────────────────────

const idOf = (u) => (u && (u._id || u.id) ? String(u._id || u.id) : "");

/**
 * Build the synced roster from a populated team ({ leader, members }).
 * - Team leader is always first, then members (de-duplicated by id).
 * - Status/reason the user already set are kept for people who are still
 *   on the team (so a re-sync never wipes attendance marks).
 * - Manually-added rows (source: "manual") are always kept.
 * - New people default to "present"; the leader can flip them to absent.
 */
export const buildRoster = (team, existing = []) => {
  const previous = new Map(
    existing.filter((r) => r.source === "synced").map((r) => [r.id, r]),
  );
  const seen = new Set();
  const roster = [];

  const push = (user, role) => {
    const id = idOf(user);
    const name = (user?.name || "").trim();
    if (!id || !name || seen.has(id)) return;
    seen.add(id);
    const prev = previous.get(id);
    roster.push({
      id,
      name,
      role,
      source: "synced",
      status: prev?.status || "present",
      reason: prev?.reason || "",
    });
  };

  push(team?.leader, "leader");
  (team?.members || []).forEach((m) => push(m, "member"));

  const manual = existing.filter((r) => r.source === "manual");
  return [...roster, ...manual];
};

let manualCounter = 0;
export const newManualMember = (name = "") => ({
  id: `manual-${Date.now()}-${manualCounter++}`,
  name,
  role: "member",
  source: "manual",
  status: "present",
  reason: "",
});

export const setRosterStatus = (roster, id, status) =>
  roster.map((r) =>
    r.id === id
      ? { ...r, status, reason: status === "present" ? "" : r.reason }
      : r,
  );

export const setAllRosterStatus = (roster, status) =>
  roster.map((r) => ({
    ...r,
    status,
    reason: status === "present" ? "" : r.reason,
  }));

// ─── Attendance ──────────────────────────────────────────────

/**
 * One place that turns the two input modes into what gets saved.
 *  - mode "sync"  → built from the roster
 *  - mode "manual"→ built from the original free-text lists
 * Returns names for the legacy `present` / `absent` fields AND a structured
 * `attendance` array.
 */
export const deriveAttendance = ({
  mode,
  roster = [],
  manualPresent = [],
  manualAbsent = [],
}) => {
  if (mode === "manual") {
    const presentNames = manualPresent
      .map((p) => (p || "").trim())
      .filter(Boolean);
    const absent = manualAbsent
      .filter((a) => a && (a.name || "").trim())
      .map((a) => ({ name: a.name.trim(), reason: (a.reason || "").trim() }));
    return {
      presentNames,
      absent,
      attendance: [
        ...presentNames.map((name) => ({
          member: null,
          name,
          role: "member",
          source: "manual",
          status: "present",
          reason: "",
        })),
        ...absent.map((a) => ({
          member: null,
          name: a.name,
          role: "member",
          source: "manual",
          status: "absent",
          reason: a.reason,
        })),
      ],
    };
  }

  const named = roster.filter((r) => (r.name || "").trim());
  const toEntry = (r) => ({
    member: r.source === "synced" ? r.id : null,
    name: r.name.trim(),
    role: r.role,
    source: r.source,
    status: r.status,
    reason: r.status === "absent" ? (r.reason || "").trim() : "",
  });
  const attendance = named.map(toEntry);
  return {
    presentNames: named
      .filter((r) => r.status === "present")
      .map((r) => r.name.trim()),
    absent: named
      .filter((r) => r.status === "absent")
      .map((r) => ({ name: r.name.trim(), reason: (r.reason || "").trim() })),
    attendance,
  };
};

// ─── Signatures ──────────────────────────────────────────────

/** Everyone who is present must be able to sign. Absent people are skipped. */
export const getSigners = ({ mode, roster = [], manualPresent = [] }) => {
  if (mode === "manual") {
    const seen = new Set();
    return manualPresent
      .map((p) => (p || "").trim())
      .filter((n) => n && !seen.has(n) && seen.add(n))
      .map((name) => ({
        key: `name:${name}`,
        member: null,
        name,
        role: "member",
      }));
  }
  return roster
    .filter((r) => r.status === "present" && (r.name || "").trim())
    .map((r) => ({
      key: r.id,
      member: r.source === "synced" ? r.id : null,
      name: r.name.trim(),
      role: r.role,
    }));
};

/**
 * Keep only signatures that belong to a current signer (so marking someone
 * absent after they signed never leaks their signature into the report).
 */
export const alignSignatures = (signatureMap = {}, signers = []) => {
  const signatureData = signers
    .filter(
      (s) => typeof signatureMap[s.key] === "string" && signatureMap[s.key],
    )
    .map((s) => ({
      key: s.key,
      member: s.member,
      name: s.name,
      role: s.role,
      image: signatureMap[s.key],
    }));
  return {
    signatureData,
    signatures: signatureData.map((s) => s.name),
    signedCount: signatureData.length,
  };
};

// ─── Translation ─────────────────────────────────────────────

const LATIN = /[A-Za-z]/g;
const ETHIOPIC = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/g;

/** True when the text is written mostly in English and should become Amharic. */
export const needsAmharicTranslation = (text) => {
  if (typeof text !== "string") return false;
  const s = text.trim();
  if (s.length < 2) return false;
  const latin = (s.match(LATIN) || []).length;
  const ethiopic = (s.match(ETHIOPIC) || []).length;
  if (latin < 2 || latin <= ethiopic) return false;
  // A lone acronym such as "QMS" is not worth a round trip.
  if (!/\s/.test(s) && s === s.toUpperCase() && s.length <= 6) return false;
  return true;
};

/** Models sometimes wrap the answer in quotes or add a label line. */
export const cleanTranslation = (raw) => {
  if (typeof raw !== "string") return "";
  let s = raw.trim();
  s = s.replace(/^(amharic|translation|አማርኛ)\s*:\s*/i, "");
  const pairs = [
    ['"', '"'],
    ["“", "”"],
    ["«", "»"],
    ["'", "'"],
  ];
  for (const [open, close] of pairs) {
    if (s.length > 1 && s.startsWith(open) && s.endsWith(close)) {
      s = s.slice(open.length, s.length - close.length).trim();
      break;
    }
  }
  return s;
};
