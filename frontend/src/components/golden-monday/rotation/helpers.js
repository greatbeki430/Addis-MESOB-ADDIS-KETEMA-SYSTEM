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
// week from the sessions, then loads the rotation preview for THAT
// week. This ordering matters: the ranking must be computed for the
// same week the panel is targeting, not for whatever "next Monday
// from now" happens to be. When those two diverge — e.g. on a
// Tuesday after a Monday session, or when a future week has been
// manually assigned — the panel would otherwise display a ranking
// for week A while the assignment buttons write to week B.
export function useRotationData({ onRefresh, autoLoad = true } = {}) {
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
      // 1. Fetch sessions + recordings in parallel. Sessions drive
      //    everything else in this hook, so they must resolve first.
      const [sessionsRes, recordingsRes] = await Promise.all([
        goldenMondayAPI.getAll().catch(() => ({ data: [] })),
        goldenMondayAPI.getLiveRecordings().catch(() => ({ data: [] })),
      ]);

      if (!isMounted.current) return;

      const sessions = Array.isArray(sessionsRes?.data) ? sessionsRes.data : [];
      const target = pickCurrentSession(sessions);
      const targetWeekOf = target?.weekOf || target?.date || null;

      // 2. Fetch the rotation preview FOR THE TARGET WEEK. If we have
      //    no target (empty roster, no sessions), pass nothing and let
      //    the backend default to next Monday — at least the panel
      //    shows something.
      const rotationRes = await goldenMondayAPI
        .previewRotation(targetWeekOf || undefined)
        .catch(() => ({ data: { ranking: [] } }));

      if (!isMounted.current) return;

      const rankingData = rotationRes?.data?.ranking;

      // 3. Commit all state at once. currentSession is derived from
      //    the SAME sessions array we computed the target week from,
      //    so the panel's "target week" and the ranking's week can
      //    never disagree.
      setRanking(Array.isArray(rankingData) ? rankingData : []);
      setAllSessions(sessions);
      setCurrentSession(target);
      setRecordings(
        Array.isArray(recordingsRes?.data) ? recordingsRes.data : [],
      );

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("[useRotationData] load failed:", err);
      if (isMounted.current) {
        setRanking([]);
        setRecordings([]);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [onRefresh]);

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
