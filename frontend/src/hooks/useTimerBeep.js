// frontend/src/hooks/useTimerBeep.js
// Plays a short beep when a countdown timer crosses a warning threshold.
//
// Design notes:
//  • Uses the Web Audio API — no asset file, works offline.
//  • Beeps once per threshold, not on every tick (otherwise the user
//    gets a beep every second and mutes it immediately).
//  • Crossings are detected by comparing the previous and current
//    remaining seconds — so if the tab was backgrounded and the timer
//    jumped from 400s to 60s, we still beep (only for the lowest crossed
//    threshold, so we don't fire a burst of beeps on resume).
//  • Respects a user mute preference persisted in localStorage.
//  • Lazily creates the AudioContext on first beep — browsers block
//    AudioContext creation before a user gesture, and creating it too
//    early would silently fail.

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "forum_report_timer_muted";

// Warning thresholds in seconds, descending so we can pick the
// lowest one crossed when the timer jumps several at once.
const THRESHOLDS = [
  { seconds: 20, tone: "warning" },
  { seconds: 10, tone: "critical" },
  { seconds: 5, tone: "final" },
];

const TONES = {
  warning: { frequency: 660, duration: 0.35, repeat: 1 },
  critical: { frequency: 880, duration: 0.5, repeat: 2 },
  final: { frequency: 990, duration: 0.6, repeat: 3 },
};

export function useTimerBeep({ isActive, timeRemaining }) {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const audioCtxRef = useRef(null);
  const prevTimeRef = useRef(timeRemaining);
  // Tracks which thresholds have already fired so we don't repeat them.
  // Reset when the timer resets (timeRemaining jumps back above a threshold).
  const firedRef = useRef(new Set());

  // Persist mute preference.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(isMuted));
    } catch {
      /* storage disabled — not fatal */
    }
  }, [isMuted]);

  const ensureAudioContext = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext || null;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
      return audioCtxRef.current;
    } catch (err) {
      console.warn("[useTimerBeep] Could not create AudioContext:", err);
      return null;
    }
  }, []);

  const playBeep = useCallback(
    (tone) => {
      const ctx = ensureAudioContext();
      if (!ctx) return;

      // Some browsers suspend the context until user interaction.
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const { frequency, duration, repeat } = tone;
      const now = ctx.currentTime;

      for (let i = 0; i < repeat; i++) {
        const start = now + i * (duration + 0.08);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, start);

        // Attack/decay envelope so the beep doesn't click.
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.02);
      }
    },
    [ensureAudioContext],
  );

  // Reset fired thresholds whenever the timer is (re)started or the
  // remaining time jumps back up (e.g. on a fresh session).
  useEffect(() => {
    if (!isActive) {
      firedRef.current.clear();
      prevTimeRef.current = timeRemaining;
    }
  }, [isActive, timeRemaining]);

  // Main watch: fires when timeRemaining crosses a threshold.
  useEffect(() => {
    if (!isActive || typeof timeRemaining !== "number") {
      prevTimeRef.current = timeRemaining;
      return;
    }

    const prev = prevTimeRef.current;
    const now = timeRemaining;

    // If time went *up* (reset, extension, resume), clear fired flags.
    if (now > prev) {
      firedRef.current.clear();
    }

    // Find thresholds we just crossed (prev > threshold >= now).
    // Only fire the LOWEST crossed threshold — if the timer jumped
    // several at once (tab was backgrounded), one beep is enough.
    const crossed = THRESHOLDS.filter(
      (t) =>
        !firedRef.current.has(t.seconds) &&
        prev > t.seconds &&
        now <= t.seconds,
    );

    if (crossed.length > 0) {
      const lowest = crossed[crossed.length - 1];
      crossed.forEach((t) => firedRef.current.add(t.seconds));

      if (!isMuted) {
        playBeep(TONES[lowest.tone]);
      }
    }

    prevTimeRef.current = now;
  }, [isActive, timeRemaining, isMuted, playBeep]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {});
      }
      audioCtxRef.current = null;
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return { isMuted, toggleMute };
}

export default useTimerBeep;
