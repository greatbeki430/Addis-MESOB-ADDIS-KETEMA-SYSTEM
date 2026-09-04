// frontend/src/hooks/useMeetingTimer.js
// Meeting timer hook with 30-minute limit, warnings, and auto-save

import { useState, useEffect, useRef, useCallback } from "react";

const MEETING_DURATION_MINUTES = 30;
const WARNING_THRESHOLDS = [
  { minutes: 5, message: "⚠️ 5 minutes remaining! Please wrap up." },
  { minutes: 3, message: "⏰ 3 minutes left! Finalize your report." },
  { minutes: 1, message: "🚨 1 minute remaining! Save immediately!" },
];

export const useMeetingTimer = ({
  isActive = false,
  onTimeExpired,
  onAutoSave,
  onWarning,
  startTime = null,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(
    MEETING_DURATION_MINUTES * 60,
  );
  const [isExpired, setIsExpired] = useState(false);
  const [hasWarned, setHasWarned] = useState({});
  const [progressSaved, setProgressSaved] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(startTime);
  const hasAutoSavedRef = useRef(false);

  // ─── Format time as MM:SS ──────────────────────────────────
  const formatTime = useCallback((seconds) => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, []);

  // ─── Get progress percentage ──────────────────────────────
  const getProgressPercent = useCallback(() => {
    const total = MEETING_DURATION_MINUTES * 60;
    const elapsed = total - Math.max(0, timeRemaining);
    return Math.min(100, (elapsed / total) * 100);
  }, [timeRemaining]);

  // ─── Get warning message based on remaining time ──────────
  const getWarningMessage = useCallback(() => {
    const remainingMinutes = Math.ceil(timeRemaining / 60);
    for (const threshold of WARNING_THRESHOLDS) {
      if (
        remainingMinutes <= threshold.minutes &&
        !hasWarned[threshold.minutes]
      ) {
        setHasWarned((prev) => ({ ...prev, [threshold.minutes]: true }));
        return threshold.message;
      }
    }
    return null;
  }, [timeRemaining, hasWarned]);

  // ─── Auto-save function ────────────────────────────────────
  const triggerAutoSave = useCallback(async () => {
    if (hasAutoSavedRef.current) return;
    hasAutoSavedRef.current = true;
    setProgressSaved(true);

    if (onAutoSave) {
      try {
        await onAutoSave();
        console.log("✅ Auto-save completed at", new Date().toISOString());
      } catch (error) {
        console.error("❌ Auto-save failed:", error);
      }
    }

    setTimeout(() => {
      setProgressSaved(false);
      hasAutoSavedRef.current = false;
    }, 3000);
  }, [onAutoSave]);

  // ─── Start timer ────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) return;

    startTimeRef.current = Date.now();
    setTimeRemaining(MEETING_DURATION_MINUTES * 60);
    setIsExpired(false);
    setHasWarned({});
    hasAutoSavedRef.current = false;
    setShowExpiredModal(false);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;

        // ── Check for warnings ──
        const warning = getWarningMessage();
        if (warning && onWarning) {
          onWarning(warning);
        }

        // ── Auto-save at 2 minutes remaining ──
        if (newTime === 120 && !hasAutoSavedRef.current) {
          triggerAutoSave();
        }

        // ── Time expired ──
        if (newTime <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsExpired(true);
          setShowExpiredModal(true);
          if (onTimeExpired) {
            onTimeExpired();
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);
  }, [getWarningMessage, onWarning, onTimeExpired, triggerAutoSave]);

  // ─── Pause timer ────────────────────────────────────────────
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ─── Resume timer ───────────────────────────────────────────
  const resumeTimer = useCallback(() => {
    if (!timerRef.current && !isExpired && isActive) {
      startTimer();
    }
  }, [startTimer, isExpired, isActive]);

  // ─── Reset timer ────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimeRemaining(MEETING_DURATION_MINUTES * 60);
    setIsExpired(false);
    setHasWarned({});
    hasAutoSavedRef.current = false;
    setShowExpiredModal(false);
    setShowExtensionModal(false);
    startTimeRef.current = Date.now();
    if (isActive) {
      startTimer();
    }
  }, [pauseTimer, startTimer, isActive]);

  // ─── Get meeting status ────────────────────────────────────
  const getStatus = useCallback(() => {
    if (isExpired) return "expired";
    if (timeRemaining <= 0) return "expired";
    if (timeRemaining < 300) return "critical"; // Less than 5 minutes
    if (timeRemaining < 600) return "warning"; // Less than 10 minutes
    return "active";
  }, [timeRemaining, isExpired]);

  // ─── Cleanup on unmount ────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    progressPercent: getProgressPercent(),
    isExpired,
    status: getStatus(),
    showExpiredModal,
    setShowExpiredModal,
    showExtensionModal,
    setShowExtensionModal,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    triggerAutoSave,
    progressSaved,
    formatTime,
    MEETING_DURATION_MINUTES,
    WARNING_THRESHOLDS,
  };
};

export default useMeetingTimer;
