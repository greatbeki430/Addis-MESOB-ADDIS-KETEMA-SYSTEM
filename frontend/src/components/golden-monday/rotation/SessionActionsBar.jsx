// src/components/golden-monday/rotation/SessionActionsBar.jsx
// Small action bar shown above the CurrentPresenterCard whenever a
// session exists. Lets an admin:
//   • re-post the announcement to the channel (e.g. it got deleted)
//   • re-send the presenter DM (e.g. they missed it)
// Both are force-actions: they ignore the "already sent" flags.

import { useState, useCallback } from "react";
import { FiLoader, FiRotateCw, FiSend } from "react-icons/fi";
import { C, F } from "../../../styles/theme";
import { goldenMondayAPI } from "../../../services/api";
import { notify } from "./helpers";

export default function SessionActionsBar({
  session,
  onAction,
  t,
  compact = false,
}) {
  const [busy, setBusy] = useState({ reannounce: false, renotify: false });

  const handleReAnnounce = useCallback(async () => {
    if (!session?._id) return;
    setBusy((b) => ({ ...b, reannounce: true }));
    try {
      await goldenMondayAPI.reAnnounceSession(session._id);
      notify(t.reAnnounceSuccess || "Re-posted to the channel", "success");
      if (onAction) await onAction();
    } catch (err) {
      notify(
        err.response?.data?.message || t.reAnnounceError || "Failed to re-post",
        "error",
      );
    } finally {
      setBusy((b) => ({ ...b, reannounce: false }));
    }
  }, [session, onAction, t]);

  const handleReNotify = useCallback(async () => {
    if (!session?._id) return;
    setBusy((b) => ({ ...b, renotify: true }));
    try {
      await goldenMondayAPI.reNotifyPresenter(session._id);
      notify(t.reNotifySuccess || "Presenter DM re-sent", "success");
      if (onAction) await onAction();
    } catch (err) {
      notify(
        err.response?.data?.message ||
          t.reNotifyError ||
          "Failed to re-send DM",
        "error",
      );
    } finally {
      setBusy((b) => ({ ...b, renotify: false }));
    }
  }, [session, onAction, t]);

  if (!session) return null;

  const buttonStyle = (color, isBusy) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: compact ? "6px 10px" : "8px 14px",
    borderRadius: 10,
    border: `1.5px solid ${color}44`,
    background: `${color}0d`,
    color,
    fontWeight: 600,
    fontSize: compact ? 11 : 12,
    cursor: isBusy ? "not-allowed" : "pointer",
    opacity: isBusy ? 0.6 : 1,
    transition: "all 0.2s ease",
    fontFamily: F.sans,
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        padding: compact ? "8px 12px" : "10px 14px",
        borderRadius: 12,
        background: C.bg,
        border: `1px solid ${C.border}`,
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontSize: compact ? 11 : 12,
          color: C.muted,
          alignSelf: "center",
          marginRight: 4,
        }}
      >
        {t.presenterActions || "Presenter actions"}:
      </span>

      <button
        onClick={handleReAnnounce}
        disabled={busy.reannounce}
        style={buttonStyle(C.primary, busy.reannounce)}
        onMouseEnter={(e) => {
          if (!busy.reannounce)
            e.currentTarget.style.background = `${C.primary}22`;
        }}
        onMouseLeave={(e) => {
          if (!busy.reannounce)
            e.currentTarget.style.background = `${C.primary}0d`;
        }}
        title="Re-post to the public channel"
      >
        {busy.reannounce ? (
          <FiLoader
            size={compact ? 12 : 14}
            style={{ animation: "spin 1s linear infinite" }}
          />
        ) : (
          <FiRotateCw size={compact ? 12 : 14} />
        )}
        {busy.reannounce
          ? t.reAnnouncing || "Re-posting…"
          : t.reAnnounce || "Re-post to Channel"}
      </button>

      <button
        onClick={handleReNotify}
        disabled={busy.renotify}
        style={buttonStyle(C.gold, busy.renotify)}
        onMouseEnter={(e) => {
          if (!busy.renotify) e.currentTarget.style.background = `${C.gold}22`;
        }}
        onMouseLeave={(e) => {
          if (!busy.renotify) e.currentTarget.style.background = `${C.gold}0d`;
        }}
        title="Re-send the availability DM to the presenter"
      >
        {busy.renotify ? (
          <FiLoader
            size={compact ? 12 : 14}
            style={{ animation: "spin 1s linear infinite" }}
          />
        ) : (
          <FiSend size={compact ? 12 : 14} />
        )}
        {busy.renotify
          ? t.reNotifying || "Re-sending…"
          : t.reNotify || "Re-send Presenter DM"}
      </button>
    </div>
  );
}
