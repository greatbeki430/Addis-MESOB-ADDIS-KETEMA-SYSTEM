// src/components/golden-monday/rotation/RotationPanel.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAward,
  FiRefreshCw,
  FiUser,
  FiBarChart2,
  FiVideo,
  FiArrowRight,
  FiLoader,
  FiCalendar,
} from "react-icons/fi";
import { C, F } from "../../../styles/theme";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";
import { goldenMondayAPI } from "../../../services/api";
import { goldenMondayTranslations } from "../../../constants/goldenMondayTranslations";
import { isGoldenMondayAdminOrAbove } from "../../../utils/roles";
import AutoAnnounceButton from "../AutoAnnounceButton";
import {
  glass,
  useRotationData,
  notify,
  fileToBase64,
  // ✅ NEW: week helpers, exported by the rewritten helpers.js
  thisMondayISO,
  nextMondayISO,
  isSameWeek,
  formatWeekLabel,
} from "./helpers";
import PresenterTab from "./PresenterTab";
import RankingTab from "./RankingTab";
import RecordingsTab from "./RecordingsTab";
import AlreadyAssignedDialog from "./AlreadyAssignedDialog";
import ManualPresenterPicker from "./ManualPresenterPicker";
import PosterStudio from "../PosterStudio";

const MAX_RECORDING_BYTES = 35 * 1024 * 1024;

// Fallback used only when currentSession has no weekOf for some
// reason AND the admin hasn't picked a week. Matches backend
// `nextMondayFrom()` — the same week assignRotation() would
// default to if we sent nothing, so at least the two agree.
const upcomingMondayISO = () => {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff + 7);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

export default function RotationPanel({ onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

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

  const [alreadyAssignedFor, setAlreadyAssignedFor] = useState(null);
  const [manualPickerFor, setManualPickerFor] = useState(null);
  const [posterStudioOpen, setPosterStudioOpen] = useState(false);

  // ─── Week selector state ────────────────────────────────────
  // null  = "Auto" — let useRotationData pick the target week
  //         from currentSession (existing behavior)
  // ISO   = explicit override — every action (assign, ranking,
  //         manual picker, already-assigned check) targets THIS
  //         week, and only this week.
  const [weekOverride, setWeekOverride] = useState(null);

  const { ranking, currentSession, recordings, loading, loadAll } =
    useRotationData({ onRefresh, weekOverride });

  const sessionId = currentSession?._id || null;

  // ─── The week every action in this panel targets ─────────────
  // When the admin has picked a week, that IS the target — even if
  // no session exists for it yet. Otherwise, derive from the
  // current session, falling back to next Monday.
  const targetWeekOf =
    weekOverride ||
    currentSession?.weekOf ||
    currentSession?.date ||
    upcomingMondayISO();

  // ─── Quick-pick button highlight state ──────────────────────
  const isThisWeek = isSameWeek(weekOverride, thisMondayISO());
  const isNextWeek = isSameWeek(weekOverride, nextMondayISO());
  const isAuto = !weekOverride;

  const alreadyAssignedOpen =
    !!alreadyAssignedFor?._id && alreadyAssignedFor._id === sessionId;

  const manualPickerOpen = isPrivileged && !!manualPickerFor;

  const posterStudioVisible =
    isPrivileged && posterStudioOpen && !!currentSession;

  const titleDraftValue =
    titleDraft.sessionId === sessionId && titleDraft.value
      ? titleDraft.value
      : currentSession?.presentationTitle || "";

  const setTitleDraft = useCallback(
    (value) => setTitleDraftState({ sessionId, value }),
    [sessionId],
  );

  const copyTimerRef = useRef(null);
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // ─── Refresh ────────────────────────────────────────────────
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
  // ✅ THE FIX: pass targetWeekOf explicitly. Previously this
  // called assignRotation() with no args, so the backend fell back
  // to nextMondayFrom() computed at request time — which could
  // silently differ from the week the admin was looking at.
  const handleAssignNext = useCallback(async () => {
    setAssigning(true);
    try {
      const res = await goldenMondayAPI.assignRotation(targetWeekOf);
      if (res.data.alreadyAssigned && res.data.session) {
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
  }, [t, loadAll, targetWeekOf]);

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

  const handleReassignFromDialog = useCallback(() => {
    const dialogWeek =
      alreadyAssignedFor?.weekOf || alreadyAssignedFor?.date || targetWeekOf;
    setAlreadyAssignedFor(null);
    setManualPickerFor({ targetWeekOf: dialogWeek });
  }, [alreadyAssignedFor, targetWeekOf]);

  // ─── Manual picker ──────────────────────────────────────────
  const openManualPicker = useCallback(() => {
    setManualPickerFor({ targetWeekOf });
  }, [targetWeekOf]);

  const closeManualPicker = useCallback(() => {
    setManualPickerFor(null);
  }, []);

  const handleManualAssigned = useCallback(async () => {
    setManualPickerFor(null);
    await loadAll();
  }, [loadAll]);

  // ─── Poster Studio ──────────────────────────────────────────
  const openPosterStudio = useCallback(() => setPosterStudioOpen(true), []);
  const closePosterStudio = useCallback(() => setPosterStudioOpen(false), []);

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

  const tabs = useMemo(
    () => [
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
    ],
    [t],
  );

  // ─── Week selector handlers ─────────────────────────────────
  const handlePickAuto = useCallback(() => setWeekOverride(null), []);
  const handlePickThisWeek = useCallback(
    () => setWeekOverride(thisMondayISO()),
    [],
  );
  const handlePickNextWeek = useCallback(
    () => setWeekOverride(nextMondayISO()),
    [],
  );

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: F.sans, maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(245, 197, 24, 0.2); }
          50%      { box-shadow: 0 0 40px rgba(245, 197, 24, 0.4); }
        }

        @media (max-width: 640px) {
          .gm-panel-action-btn .gm-action-label { display: none !important; }
          .gm-panel-action-btn {
            padding: 8px !important;
            min-width: 40px !important; min-height: 40px !important;
            width: 40px !important; height: 40px !important;
            border-radius: 50% !important;
          }
        }
        @media (max-width: 380px) {
          .gm-panel-action-btn {
            min-width: 36px !important; min-height: 36px !important;
            width: 36px !important; height: 36px !important;
            padding: 6px !important;
          }
          .gm-panel-action-btn svg { width: 14px !important; height: 14px !important; }
        }

        .gm-rotation-tab-strip { scrollbar-width: none; -ms-overflow-style: none; }
        .gm-rotation-tab-strip::-webkit-scrollbar { display: none; }
        .gm-rotation-tab-btn { white-space: nowrap; }
        @media (max-width: 640px) {
          .gm-rotation-tab-strip {
            overflow-x: auto; flex-wrap: nowrap !important;
            -webkit-overflow-scrolling: touch;
          }
          .gm-rotation-tab-btn {
            flex: 0 0 auto !important;
            min-width: 60px !important;
            padding: 10px 12px !important;
          }
        }
        @media (max-width: 460px) {
          .gm-rotation-tab-btn { padding: 10px 10px !important; }
          .gm-rotation-tab-btn .gm-rotation-tab-label { display: none !important; }
        }

        /* Week selector chips — scroll horizontally on narrow screens */
        .gm-week-chip-row {
          display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
        }
        @media (max-width: 520px) {
          .gm-week-chip-row {
            flex-wrap: nowrap; overflow-x: auto; width: 100%;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .gm-week-chip-row::-webkit-scrollbar { display: none; }
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
            marginBottom: 16,
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

        {/* ─── WEEK SELECTOR ──────────────────────────────────────
            Every action below (Assign Next, Pick manually, the
            ranking list) targets exactly this week. "Auto" preserves
            the old behavior of following the current session. */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            marginBottom: 20,
            padding: "12px 16px",
            borderRadius: 14,
            background: C.bg,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <FiCalendar size={14} color={C.primary} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: C.primary,
              }}
            >
              {t.targetWeekLabel || "Target week"}
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              ·{" "}
              <strong style={{ color: C.dark }}>
                {formatWeekLabel(targetWeekOf) || "—"}
              </strong>
            </span>
            {isAuto && currentSession && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: `${C.primary}15`,
                  color: C.primary,
                }}
              >
                {t.autoWeek || "Auto"}
              </span>
            )}
          </div>

          <div className="gm-week-chip-row">
            <WeekChip
              active={isAuto}
              onClick={handlePickAuto}
              label={t.weekAuto || "Auto"}
              hint={t.weekAutoHint || "Follow the current session"}
            />
            <WeekChip
              active={isThisWeek}
              onClick={handlePickThisWeek}
              label={t.weekThis || "This week"}
            />
            <WeekChip
              active={isNextWeek}
              onClick={handlePickNextWeek}
              label={t.weekNext || "Next week"}
            />
            <input
              type="date"
              value={weekOverride ? weekOverride.slice(0, 10) : ""}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return setWeekOverride(null);
                // Normalize typed date to its Monday so it matches
                // the same rule the backend keys sessions on.
                const d = new Date(v + "T00:00:00Z");
                const day = d.getUTCDay();
                const diff = (day === 0 ? -6 : 1) - day;
                d.setUTCDate(d.getUTCDate() + diff);
                d.setUTCHours(0, 0, 0, 0);
                setWeekOverride(d.toISOString());
              }}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                fontSize: 12,
                fontFamily: F.sans,
                color: C.dark,
                background: C.white,
                outline: "none",
                cursor: "pointer",
              }}
              title={t.weekPickDate || "Pick any week"}
            />
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

      <AlreadyAssignedDialog
        isOpen={alreadyAssignedOpen}
        onClose={() => setAlreadyAssignedFor(null)}
        session={alreadyAssignedFor}
        onKeep={handleKeepAsIs}
        onReAnnounce={handleReAnnounceFromDialog}
        onReassign={handleReassignFromDialog}
        t={t}
      />

      <ManualPresenterPicker
        isOpen={manualPickerOpen}
        onClose={closeManualPicker}
        ranking={ranking}
        targetWeekOf={manualPickerFor?.targetWeekOf || null}
        onAssigned={handleManualAssigned}
        t={t}
      />

      <PosterStudio
        isOpen={posterStudioVisible}
        onClose={closePosterStudio}
        session={currentSession}
        onPosterPosted={handlePosterPosted}
      />
    </div>
  );
}

// ─── Small local presentational helper for the week chips ────
function WeekChip({ active, onClick, label, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint || label}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        border: `1.5px solid ${active ? C.primary : C.border}`,
        background: active ? `${C.primary}10` : C.white,
        color: active ? C.primary : C.muted,
        fontWeight: active ? 700 : 600,
        fontSize: 12,
        cursor: "pointer",
        fontFamily: F.sans,
        whiteSpace: "nowrap",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}
