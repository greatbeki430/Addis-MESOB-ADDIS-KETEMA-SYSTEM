// src/components/golden-monday/rotation/helpers.js
import { useCallback, useEffect, useRef, useState } from "react";
import { goldenMondayAPI } from "../../../services/api";
import { showToast } from "../../../utils/toastHelper";

// ─── Shared glassmorphism style ─────────────────────────────
export const glass = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
};

// ─── File → base64 (for recording upload) ───────────────────
export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── Monday-of-week helpers ──────────────────────────────────
// Mirrors backend `mondayOf()` / `nextMondayFrom()` in
// goldenMondayRotationService.js exactly, so a week picked on the
// frontend always normalizes to the same Monday the backend will
// key the session on. Keeping these in sync matters: if the two
// ever disagreed, a picked "week" could silently resolve to a
// different session server-side than what the UI shows.
export const mondayOfDate = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getUTCDay(); // 0 = Sunday ... 1 = Monday
  const diff = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const thisMondayISO = () => mondayOfDate(new Date()).toISOString();

export const nextMondayISO = () => {
  const d = mondayOfDate(new Date());
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString();
};

// Compares two ISO-ish values by the Monday they fall in, ignoring
// time-of-day — used to highlight which quick-pick button (This
// Week / Next Week) matches the current selection, and to detect
// when a hand-typed date lands on a week we already have a button
// for.
export const isSameWeek = (isoA, isoB) => {
  if (!isoA || !isoB) return false;
  try {
    return (
      mondayOfDate(new Date(isoA)).toISOString().slice(0, 10) ===
      mondayOfDate(new Date(isoB)).toISOString().slice(0, 10)
    );
  } catch {
    return false;
  }
};

// Human-readable week label, shared by the rotation panel's own
// banner and the manual-picker modal so the two never drift into
// different date formats.
export const formatWeekLabel = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
};

// ─── Small helper: pick the session the rotation panel is *about* ─
//
// The panel is always about the NEXT upcoming session — the one whose
// presenter needs managing. Not the most recent session (which is
// already in the past), and not "any session with a presenter".
//
// Priority:
//   1. Soonest session whose date >= today, not cancelled
//   2. If none upcoming, the most recent past session (so the panel
//      still shows something sensible on the Monday after a session)
//
// This matters because every action in the panel — Set Title,
// Manual Assign, Re-announce — needs to target a specific week, and
// the only correct target is the one the user is actually looking at.
//
// This auto-pick is used only when the user hasn't overridden the
// target week via the selector in RotationPanel (see weekOverride
// below). Once they pick a specific week, we stop guessing.
export const pickCurrentSession = (sessions = []) => {
  if (!Array.isArray(sessions) || sessions.length === 0) return null;

  const now = new Date();
  const notCancelled = sessions.filter((s) => s && s.status !== "cancelled");

  // Upcoming first — soonest date wins.
  const upcoming = notCancelled
    .filter((s) => s.date && new Date(s.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (upcoming.length > 0) return upcoming[0];

  // Fallback: most recent past session.
  const past = notCancelled
    .filter((s) => s.date && new Date(s.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return past[0] || null;
};

// ─── Data hook ──────────────────────────────────────────────
// Loads sessions + live recordings first, then computes the target
// week, then loads the rotation preview for THAT week. This ordering
// matters: the ranking must be computed for the same week the panel
// is targeting, not for whatever "next Monday from now" happens to
// be. When those two diverge, the panel would otherwise display a
// ranking for week A while the assignment buttons write to week B —
// which is exactly the bug this hook exists to prevent.
//
// `weekOverride` (ISO string | null): when the admin explicitly picks
// a week via the selector in RotationPanel, pass it here. The hook
// then looks for an existing session on THAT week — not whatever
// pickCurrentSession() would have auto-picked — and requests the
// rotation preview for that same week. If no session exists yet for
// the overridden week, `currentSession` comes back null (correctly —
// "nobody assigned for THIS week"), rather than silently substituting
// a different week's session.
export function useRotationData({
  onRefresh,
  autoLoad = true,
  weekOverride = null,
} = {}) {
  const isMounted = useRef(true);
  const [ranking, setRanking] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);

    try {
      // previewRotation(weekOverride) now resolves the target week
      // SERVER-SIDE: with no override it calls resolveTargetWeek(),
      // the exact same function /rotation/next uses, and returns the
      // actual session for that week in the response body. This
      // replaces the old client-side pickCurrentSession(sessions) step
      // that used to run here — that step could pick a DIFFERENT
      // session than the server whenever `sessions` (capped at 50,
      // sorted by date desc) didn't happen to include the same
      // upcoming session the server found by querying the DB directly
      // with no cap. That mismatch was the actual root cause of the
      // rotation panel disagreeing with the mini card / Spotlight.
      //
      // `sessions` (getAll()) is still fetched to populate
      // `allSessions`, kept for API compatibility with any other
      // consumer of this hook — it is no longer used to pick the
      // current session.
      const [rotationRes, sessionsRes, recordingsRes] = await Promise.all([
        goldenMondayAPI
          .previewRotation(weekOverride || undefined)
          .catch(() => ({
            data: { ranking: [], session: null, weekOf: null },
          })),
        goldenMondayAPI.getAll().catch(() => ({ data: [] })),
        goldenMondayAPI.getLiveRecordings().catch(() => ({ data: [] })),
      ]);

      if (!isMounted.current) return;

      const rankingData = rotationRes?.data?.ranking;
      const resolvedSession = rotationRes?.data?.session || null;

      // Debug aid: confirms in the console which week/session this
      // panel actually targeted — compare against the /rotation/next
      // network response to verify the fix without guessing.
      console.log(
        "[useRotationData] resolved weekOf:",
        rotationRes?.data?.weekOf,
        "session:",
        resolvedSession?._id || null,
        "presenter:",
        resolvedSession?.presenterName || null,
      );

      setRanking(Array.isArray(rankingData) ? rankingData : []);
      setAllSessions(Array.isArray(sessionsRes?.data) ? sessionsRes.data : []);
      setCurrentSession(resolvedSession);
      setRecordings(
        Array.isArray(recordingsRes?.data) ? recordingsRes.data : [],
      );

      // Deliberately NOT calling onRefresh() here. Doing so caused
      // duplicate reloads: every loadAll() fired the parent's
      // refreshData() (which refetches getNextPresenter etc.), and
      // then callers that wanted a full-page refresh called it again.
      // Callers should invoke onRefresh() explicitly when they need
      // the parent (mini card, Spotlight) to update too.
    } catch (err) {
      console.error("[useRotationData] load failed:", err);
      if (isMounted.current) {
        setRanking([]);
        setRecordings([]);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [onRefresh, weekOverride]);

  useEffect(() => {
    isMounted.current = true;
    const timer = autoLoad ? setTimeout(loadAll, 0) : null;

    return () => {
      isMounted.current = false;
      if (timer !== null) clearTimeout(timer);
    };
  }, [autoLoad, loadAll]);

  return {
    ranking,
    currentSession,
    recordings,
    allSessions,
    loading,
    loadAll,
  };
}

// ─── Tiny toast wrapper so children don't import showToast ───
export function notify(message, type = "success") {
  showToast(message, type);
}
