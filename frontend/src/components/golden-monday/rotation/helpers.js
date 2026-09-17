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

// ─── Small helper: extract the current unannounced session ──
export const pickCurrentSession = (sessions = []) =>
  sessions.find((s) => s.presenter && s.status !== "cancelled") || null;

// ─── Data hook ──────────────────────────────────────────────
// Loads rotation preview + all sessions + live recordings in
// parallel. Exposes a refresh function so any child can trigger
// a reload after an action.
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
      const [rotationRes, sessionsRes, recordingsRes] = await Promise.all([
        goldenMondayAPI
          .previewRotation()
          .catch(() => ({ data: { ranking: [] } })),
        goldenMondayAPI.getAll().catch(() => ({ data: [] })),
        goldenMondayAPI.getLiveRecordings().catch(() => ({ data: [] })),
      ]);

      const rankingData = rotationRes?.data?.ranking;
      const sessions = sessionsRes?.data || [];

      if (!isMounted.current) return;

      setRanking(Array.isArray(rankingData) ? rankingData : []);
      setAllSessions(sessions);
      setCurrentSession(pickCurrentSession(sessions));
      setRecordings(recordingsRes?.data || []);

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
