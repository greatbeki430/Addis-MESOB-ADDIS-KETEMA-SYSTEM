// src/components/golden-monday/rotation/RotationPanel.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAward,
  FiRefreshCw,
  FiUser,
  FiBarChart2,
  FiVideo,
  FiArrowRight,
  FiLoader,
} from "react-icons/fi";
import { C, F } from "../../../styles/theme";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";
import { goldenMondayAPI } from "../../../services/api";
import { goldenMondayTranslations } from "../../../constants/goldenMondayTranslations";
import { isGoldenMondayAdminOrAbove } from "../../../utils/roles";
import AutoAnnounceButton from "../AutoAnnounceButton";
import { glass, useRotationData, notify, fileToBase64 } from "./helpers";
import PresenterTab from "./PresenterTab";
import RankingTab from "./RankingTab";
import RecordingsTab from "./RecordingsTab";
import AlreadyAssignedDialog from "./AlreadyAssignedDialog";
import ManualPresenterPicker from "./ManualPresenterPicker";
import PosterStudio from "../PosterStudio";

// Base64 encoding inflates the payload by ~33%. Express's default
// JSON body limit is 50MB. Keeping the raw file under ~35MB leaves
// headroom for the encoded string plus session title and metadata.
const MAX_RECORDING_BYTES = 35 * 1024 * 1024;

// Compute the upcoming Monday in UTC — same rule the backend uses
// in `mondayOf()`. Used as a last-resort fallback if `currentSession`
// has no `weekOf` field for any reason. Without this, `openManualPicker`
// could hand the picker a null week, which used to silently no-op the
// assignment.
const upcomingMondayISO = () => {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff + 7); // next Monday, not today's
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

export default function RotationPanel({ onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  // ✅ Single source of truth for GM gating. Coordinators flagged with
  // isGoldenMondayAdmin === true get the same UI as leaders/admins —
  // but only inside Golden Monday. No system-admin capabilities leak.
  const isPrivileged = isGoldenMondayAdminOrAbove(user);

  const [activeTab, setActiveTab] = useState("presenter");
  const [assigning, setAssigning] = useState(false);
  const [titleDraft, setTitleDraftState] = useState({
    sessionId: null,
    value: "",
  });
  const [savingTitle, setSavingTitle] = useState(false);
  const [recordingFile, setRecordingFile] = useState(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [expandedRanking, setExpandedRanking] = useState(false);
  const [showAllRecordings, setShowAllRecordings] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // ─── Dialog state ────────────────────────────────────────────
  // Instead of storing { isOpen, session } and syncing isOpen in an
  // effect, we store only the CAPTURED session and derive isOpen on
  // render by comparing against live data. If the session it was
  // opened for is no longer the current session, or the user is no
  // longer privileged, the dialog is treated as closed — no state
  // mutation, no cascading renders.
  const [alreadyAssignedFor, setAlreadyAssignedFor] = useState(null);
  const [manualPickerFor, setManualPickerFor] = useState(null);
  const [posterStudioOpen, setPosterStudioOpen] = useState(false);

  const { ranking, currentSession, recordings, loading, loadAll } =
    useRotationData({ onRefresh });

  const sessionId = currentSession?._id || null;

  // ─── The week every action in this panel targets ─────────────
  // Derived once, reused everywhere: the manual picker's target,
  // the ranking tab's label, the title-save call's scope. Falls
  // back to the upcoming Monday if the session lacks a weekOf field
  // (older documents created before weekOf was added, or edge cases
  // where the API returned a session without it).
  const targetWeekOf =
    currentSession?.weekOf || currentSession?.date || upcomingMondayISO();

  // ─── Derived: is the already-assigned dialog open? ───────────
  // It's open only if a session was captured AND that session is
  // still the one being shown. A stale capture (session changed
  // behind our back) closes itself on the next render.
  const alreadyAssignedOpen =
    !!alreadyAssignedFor?._id && alreadyAssignedFor._id === sessionId;

  // ─── Derived: is the manual picker open? ─────────────────────
  // Only privileged users can open it; if privileges are revoked
  // mid-flight, this drops to false automatically.
  const manualPickerOpen = isPrivileged && !!manualPickerFor;

  // ─── Derived: is the poster studio open? ─────────────────────
  // Same pattern — only privileged users, and only when a session
  // exists to fill the form from.
  const posterStudioVisible =
    isPrivileged && posterStudioOpen && !!currentSession;

  // ─── Title draft: dirty flag + session scoping ───────────────
  // The draft is only "yours" if it was typed for the session
  // currently on screen. If the session changes, we fall back to
  // the fresh server value. No reset effect needed — the fallback
  // is derived on every render.
  const titleDraftValue =
    titleDraft.sessionId === sessionId && titleDraft.value
      ? titleDraft.value
      : currentSession?.presentationTitle || "";

  const setTitleDraft = useCallback(
    (value) => setTitleDraftState({ sessionId, value }),
    [sessionId],
  );

  // ─── Clear copy-success timeout on unmount ──────────────────
  // No setState in the effect body — only a cleanup that mutates a
  // ref-held timer and the mount state is already false by the time
  // the timeout fires (we cancel it).
  const copyTimerRef = useRef(null);
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // ─── Keyboard shortcut: Ctrl/Cmd + R refreshes the panel ────
  const handleRefresh = useCallback(async () => {
    await loadAll();
    notify(t.refresh || "Data refreshed", "success");
  }, [loadAll, t]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        if (document.visibilityState === "visible" && !loading) {
          e.preventDefault();
          handleRefresh();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleRefresh, loading]);

  // ─── Assign Next Presenter ──────────────────────────────────
  const handleAssignNext = useCallback(async () => {
    setAssigning(true);
    try {
      const res = await goldenMondayAPI.assignRotation();
      if (res.data.alreadyAssigned && res.data.session) {
        // Capture the session. The dialog open state is derived
        // from whether this capture still matches `sessionId`.
        setAlreadyAssignedFor(res.data.session);
      } else {
        const name =
          res.data.session?.presenterName ||
          res.data.session?.presenter?.name ||
          "Presenter";
        notify(
          `${name} ${t.assignedNext || "assigned to present next"}`,
          "success",
        );
        await loadAll();
      }
    } catch (err) {
      notify(
        err.response?.data?.message ||
          t.assignError ||
          "Failed to assign presenter",
        "error",
      );
    } finally {
      setAssigning(false);
    }
  }, [t, loadAll]);

  // ─── Already-assigned dialog actions ────────────────────────
  const handleKeepAsIs = useCallback(() => {
    setAlreadyAssignedFor(null);
    notify(t.noChange || "No change made", "info");
  }, [t]);

  const handleReAnnounceFromDialog = useCallback(async () => {
    const s = alreadyAssignedFor;
    setAlreadyAssignedFor(null);
    if (!s?._id) return;
    try {
      await goldenMondayAPI.reAnnounceSession(s._id);
      notify(t.reAnnounceSuccess || "Re-posted to the channel", "success");
      await loadAll();
    } catch (err) {
      notify(
        err.response?.data?.message || t.reAnnounceError || "Failed to re-post",
        "error",
      );
    }
  }, [alreadyAssignedFor, t, loadAll]);

  // Preserve the week the admin was looking at when they chose
  // "Reassign" so the manual picker targets that same week. Falls
  // back to the panel's current target week if the dialog's session
  // has no weekOf.
  const handleReassignFromDialog = useCallback(() => {
    const dialogWeek =
      alreadyAssignedFor?.weekOf || alreadyAssignedFor?.date || targetWeekOf;
    setAlreadyAssignedFor(null);
    setManualPickerFor({ targetWeekOf: dialogWeek });
  }, [alreadyAssignedFor, targetWeekOf]);

  // ─── Open/close manual picker ───────────────────────────────
  // Always passes a non-null targetWeekOf. If the current session
  // lacks a weekOf field, we fall back to the upcoming Monday — this
  // is what used to be null and made the picker silently no-op.
  const openManualPicker = useCallback(() => {
    setManualPickerFor({ targetWeekOf });
  }, [targetWeekOf]);

  const closeManualPicker = useCallback(() => {
    setManualPickerFor(null);
  }, []);

  // ─── Manual presenter picked ────────────────────────────────
  const handleManualAssigned = useCallback(async () => {
    setManualPickerFor(null);
    await loadAll();
  }, [loadAll]);

  // ─── Open/close Poster Studio ───────────────────────────────
  const openPosterStudio = useCallback(() => {
    setPosterStudioOpen(true);
  }, []);

  const closePosterStudio = useCallback(() => {
    setPosterStudioOpen(false);
  }, []);

  const handlePosterPosted = useCallback(async () => {
    setPosterStudioOpen(false);
    notify(
      t.posterPosted || "Poster posted to the Telegram channel",
      "success",
    );
    await loadAll();
  }, [t, loadAll]);

  // ─── Title save ─────────────────────────────────────────────
  const handleSaveTitle = useCallback(async () => {
    if (!currentSession) return;
    const trimmed = titleDraftValue.trim();
    if (!trimmed) return;

    if (trimmed === (currentSession.presentationTitle || "")) {
      notify(t.noChange || "No change made", "info");
      return;
    }

    setSavingTitle(true);
    try {
      await goldenMondayAPI.setPresentationTitle(currentSession._id, trimmed);
      notify(t.titleSaved || "Presentation title saved", "success");
      // Clear the local draft; the server value will be shown after
      // loadAll() returns fresh data.
      setTitleDraftState({ sessionId: null, value: "" });
      await loadAll();
    } catch (err) {
      notify(
        err.response?.data?.message ||
          t.titleSaveError ||
          "Failed to save title",
        "error",
      );
    } finally {
      setSavingTitle(false);
    }
  }, [currentSession, titleDraftValue, t, loadAll]);

  // ─── Recording upload ───────────────────────────────────────
  const handleUploadRecording = useCallback(async () => {
    if (!currentSession || !recordingFile) return;

    if (recordingFile.size > MAX_RECORDING_BYTES) {
      notify(
        t.recordingTooLarge ||
          `Recording is too large (max ${Math.round(
            MAX_RECORDING_BYTES / 1024 / 1024,
          )}MB)`,
        "error",
      );
      return;
    }

    setUploadingRecording(true);
    try {
      const base64 = await fileToBase64(recordingFile);
      await goldenMondayAPI.uploadRecording(currentSession._id, base64, 7);
      notify(
        t.recordingUploaded || "Recording uploaded — visible for 7 days",
        "success",
      );
      setRecordingFile(null);
      await loadAll();
    } catch (err) {
      notify(
        err.response?.data?.message ||
          t.recordingUploadError ||
          "Failed to upload recording",
        "error",
      );
    } finally {
      setUploadingRecording(false);
    }
  }, [currentSession, recordingFile, t, loadAll]);

  // ─── Copy title ─────────────────────────────────────────────
  const handleCopyTitle = useCallback(() => {
    if (currentSession?.presentationTitle) {
      navigator.clipboard.writeText(currentSession.presentationTitle);
      setCopySuccess(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopySuccess(false), 2000);
      notify(t.copied || "Title copied!", "success");
    }
  }, [currentSession, t]);

  // ─── Derived ────────────────────────────────────────────────
  const isMyTurn =
    currentSession?.presenter &&
    user?._id &&
    String(currentSession.presenter) === String(user._id);

  const tabs = [
    {
      id: "presenter",
      label: t.tabPresenter || "Presenter",
      icon: <FiUser size={14} />,
    },
    {
      id: "ranking",
      label: t.tabRanking || "Ranking",
      icon: <FiBarChart2 size={14} />,
    },
    {
      id: "recordings",
      label: t.tabRecordings || "Recordings",
      icon: <FiVideo size={14} />,
    },
  ];

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: F.sans }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 20px rgba(245, 197, 24, 0.2); }
          50% { box-shadow: 0 0 40px rgba(245, 197, 24, 0.4); }
          100% { box-shadow: 0 0 20px rgba(245, 197, 24, 0.2); }
        }

        /* Mobile: collapse action buttons to icon-only circular pills.
           The label span is hidden, the button shrinks to a fixed square,
           and the icon (or emoji) stays centered. Tooltip via title=
           attribute keeps the action discoverable on long-press. */
        @media (max-width: 640px) {
          .gm-panel-action-btn .gm-action-label {
            display: none !important;
          }
          .gm-panel-action-btn {
            padding: 8px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            width: 40px !important;
            height: 40px !important;
            border-radius: 50% !important;
          }
        }

        @media (max-width: 380px) {
          .gm-panel-action-btn {
            min-width: 36px !important;
            min-height: 36px !important;
            width: 36px !important;
            height: 36px !important;
            padding: 6px !important;
          }
          .gm-panel-action-btn svg {
            width: 14px !important;
            height: 14px !important;
          }
        }

        /* Rotation tab strip: allow horizontal scroll on narrow
           viewports so the third tab never clips. The strip hides
           its scrollbar (Firefox + WebKit) for a cleaner look. */
        .gm-rotation-tab-strip {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .gm-rotation-tab-strip::-webkit-scrollbar {
          display: none;
        }
        .gm-rotation-tab-btn {
          white-space: nowrap;
        }

        @media (max-width: 640px) {
          .gm-rotation-tab-strip {
            overflow-x: auto;
            flex-wrap: nowrap !important;
            -webkit-overflow-scrolling: touch;
          }
          .gm-rotation-tab-btn {
            flex: 0 0 auto !important;
            min-width: 60px !important;
            padding: 10px 12px !important;
          }
        }

        @media (max-width: 460px) {
          .gm-rotation-tab-btn {
            padding: 10px 10px !important;
          }
          .gm-rotation-tab-btn .gm-rotation-tab-label {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          ...glass,
          borderRadius: 24,
          padding: "clamp(20px, 3vw, 32px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(245,197,24,0.06), rgba(13,26,94,0.04))",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(13,26,94,0.04), rgba(245,197,24,0.06))",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            position: "relative",
            zIndex: 1,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #f5c518, #d4a017)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.dark,
                boxShadow: "0 4px 16px rgba(245, 197, 24, 0.3)",
              }}
            >
              <FiAward size={22} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "clamp(18px, 2.5vw, 22px)",
                  fontWeight: 800,
                  color: C.dark,
                  fontFamily: F.serif,
                }}
              >
                {t.rotationTitle || "Presenter Rotation"}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                {t.rotationSubtitle ||
                  "Fair rotation — longest waiting gets priority"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <AutoAnnounceButton onDone={loadAll} t={t} />

            {/* ✅ Poster Studio trigger — only when a session exists */}
            {isPrivileged && currentSession && (
              <button
                onClick={openPosterStudio}
                title={t.posterStudio || "Poster Studio"}
                aria-label={t.posterStudio || "Poster Studio"}
                className="gm-panel-action-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #3b82f6, #1e40af)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: F.sans,
                  boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>🎨</span>
                <span className="gm-action-label">
                  {t.posterStudio || "Poster Studio"}
                </span>
              </button>
            )}

            {isPrivileged && (
              <button
                onClick={handleAssignNext}
                disabled={assigning}
                title={
                  assigning
                    ? t.assigning || "Assigning..."
                    : t.assignNext || "Assign Next"
                }
                aria-label={
                  assigning
                    ? t.assigning || "Assigning..."
                    : t.assignNext || "Assign Next"
                }
                className="gm-panel-action-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: assigning
                    ? C.border
                    : "linear-gradient(135deg, #f5c518, #d4a017)",
                  color: assigning ? C.muted : C.dark,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: assigning ? "not-allowed" : "pointer",
                  opacity: assigning ? 0.6 : 1,
                  fontFamily: F.sans,
                }}
              >
                {assigning ? (
                  <FiLoader
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <FiArrowRight size={14} />
                )}
                <span className="gm-action-label">
                  {assigning
                    ? t.assigning || "Assigning..."
                    : t.assignNext || "Assign Next"}
                </span>
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading}
              aria-label={t.refresh || "Refresh"}
              title={`${t.refresh || "Refresh"} (Ctrl/Cmd + R)`}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1.5px solid ${C.border}`,
                background: "transparent",
                cursor: loading ? "not-allowed" : "pointer",
                color: C.muted,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiRefreshCw
                size={18}
                style={{
                  animation: loading ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="gm-rotation-tab-strip"
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            background: C.bg,
            borderRadius: 14,
            padding: 4,
            position: "relative",
            zIndex: 1,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              aria-label={tab.label}
              className="gm-rotation-tab-btn"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: activeTab === tab.id ? C.white : "transparent",
                color: activeTab === tab.id ? C.dark : C.muted,
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: F.sans,
                boxShadow:
                  activeTab === tab.id ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {tab.icon}
              <span className="gm-rotation-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "presenter" && (
            <PresenterTab
              key="presenter-tab"
              loading={loading}
              currentSession={currentSession}
              isMyTurn={isMyTurn}
              isPrivileged={isPrivileged}
              titleDraft={titleDraftValue}
              setTitleDraft={setTitleDraft}
              savingTitle={savingTitle}
              onSaveTitle={handleSaveTitle}
              onCopyTitle={handleCopyTitle}
              copySuccess={copySuccess}
              onRefresh={loadAll}
              onOpenManualPicker={openManualPicker}
              t={t}
            />
          )}

          {activeTab === "ranking" && (
            <motion.div
              key="ranking-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <RankingTab
                ranking={ranking}
                loading={loading}
                isPrivileged={isPrivileged}
                onAssign={handleAssignNext}
                assigning={assigning}
                expandedRanking={expandedRanking}
                setExpandedRanking={setExpandedRanking}
                onOpenManualPicker={openManualPicker}
                targetWeekOf={targetWeekOf}
                t={t}
              />
            </motion.div>
          )}

          {activeTab === "recordings" && (
            <motion.div
              key="recordings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <RecordingsTab
                recordings={recordings}
                loading={loading}
                isPrivileged={isPrivileged}
                currentSession={currentSession}
                recordingFile={recordingFile}
                setRecordingFile={setRecordingFile}
                uploadingRecording={uploadingRecording}
                onUploadRecording={handleUploadRecording}
                showAllRecordings={showAllRecordings}
                setShowAllRecordings={setShowAllRecordings}
                t={t}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Already-assigned dialog — derived open state */}
      <AlreadyAssignedDialog
        isOpen={alreadyAssignedOpen}
        onClose={() => setAlreadyAssignedFor(null)}
        session={alreadyAssignedFor}
        onKeep={handleKeepAsIs}
        onReAnnounce={handleReAnnounceFromDialog}
        onReassign={handleReassignFromDialog}
        t={t}
      />

      {/* Manual presenter picker — derived open state */}
      <ManualPresenterPicker
        isOpen={manualPickerOpen}
        onClose={closeManualPicker}
        ranking={ranking}
        targetWeekOf={manualPickerFor?.targetWeekOf || null}
        onAssigned={handleManualAssigned}
        t={t}
      />

      {/* ✅ Poster Studio — coordinator tool */}
      <PosterStudio
        isOpen={posterStudioVisible}
        onClose={closePosterStudio}
        session={currentSession}
        onPosterPosted={handlePosterPosted}
      />
    </div>
  );
}
