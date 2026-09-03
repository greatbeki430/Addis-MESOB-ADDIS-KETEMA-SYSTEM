// src/components/golden-monday/GoldenMondayRotationPanel.jsx
// ============================================================
// 🏆 GOLDEN MONDAY ROTATION PANEL - Premium Glassmorphism Design
// Complete with presenter management, ranking, and recordings
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, F } from "../../styles/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiRefreshCw,
  FiVideo,
  FiLoader,
  FiAward,
  FiBarChart2,
  FiUser,
  FiCalendar,
  FiPlay,
  FiUpload,
  FiCheck,
  FiArrowRight,
  FiCpu,
  FiClock,
  FiStar,
  FiUsers,
  FiCopy,
  FiInfo,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// GLASSMORPHISM STYLES
// ─────────────────────────────────────────────────────────────────────────────
const glass = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function GoldenMondayRotationPanel({ onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isInitialMount = useRef(true);

  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;
  const isPrivileged = ["leader", "admin", "superadmin"].includes(user?.role);

  // ── State ──
  const [ranking, setRanking] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [recordingFile, setRecordingFile] = useState(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [activeTab, setActiveTab] = useState("presenter");
  const [expandedRanking, setExpandedRanking] = useState(false);
  const [showAllRecordings, setShowAllRecordings] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // ── Load Data ──
  const loadAll = useCallback(async () => {
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
      const safeRanking = Array.isArray(rankingData) ? rankingData : [];
      setRanking(safeRanking);

      const sessions = sessionsRes?.data || [];
      const upcoming = sessions.find(
        (s) => s.presenter && s.status !== "cancelled",
      );
      setCurrentSession(upcoming || null);
      setTitleDraft(upcoming?.presentationTitle || "");

      setRecordings(recordingsRes?.data || []);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Golden Monday rotation load failed:", err);
      setRanking([]);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadAll();
    }
  }, [loadAll]);

  // ── Handlers ──
  const handleRefresh = async () => {
    await loadAll();
    showToast(t.refresh || "Data refreshed", "success");
  };

  const handleAssignNext = async () => {
    setAssigning(true);
    try {
      const res = await goldenMondayAPI.assignRotation();
      if (res.data.alreadyAssigned) {
        showToast(
          t.alreadyAssigned || "This week's presenter is already assigned",
          "info",
        );
      } else {
        showToast(
          `${res.data.session.presenterName} ${t.assignedNext || "assigned to present next"}`,
          "success",
        );
      }
      await loadAll();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          t.assignError ||
          "Failed to assign presenter",
        "error",
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!currentSession || !titleDraft.trim()) return;
    setSavingTitle(true);
    try {
      await goldenMondayAPI.setPresentationTitle(
        currentSession._id,
        titleDraft.trim(),
      );
      showToast(t.titleSaved || "Presentation title saved", "success");
      await loadAll();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          t.titleSaveError ||
          "Failed to save title",
        "error",
      );
    } finally {
      setSavingTitle(false);
    }
  };

  const handleUploadRecording = async () => {
    if (!currentSession || !recordingFile) return;
    setUploadingRecording(true);
    try {
      const base64 = await fileToBase64(recordingFile);
      await goldenMondayAPI.uploadRecording(currentSession._id, base64, 7);
      showToast(
        t.recordingUploaded || "Recording uploaded — visible for 7 days",
        "success",
      );
      setRecordingFile(null);
      await loadAll();
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          t.recordingUploadError ||
          "Failed to upload recording",
        "error",
      );
    } finally {
      setUploadingRecording(false);
    }
  };

  const handleCopyTitle = () => {
    if (currentSession?.presentationTitle) {
      navigator.clipboard.writeText(currentSession.presentationTitle);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      showToast(t.copied || "Title copied!", "success");
    }
  };

  const isMyTurn =
    currentSession?.presenter &&
    user?._id &&
    String(currentSession.presenter) === String(user._id);

  // ── Ranking Stats ──
  const rankingStats = useMemo(() => {
    const total = ranking.length;
    const neverPresented = ranking.filter(
      (r) =>
        r.daysSinceLastPresented === "never presented" ||
        r.daysSinceLastPresented === null,
    ).length;
    const avgDays = ranking
      .filter(
        (r) =>
          r.daysSinceLastPresented !== "never presented" &&
          r.daysSinceLastPresented !== null,
      )
      .reduce((sum, r) => sum + r.daysSinceLastPresented, 0);
    const avg = ranking.length > 0 ? Math.round(avgDays / ranking.length) : 0;
    return { total, neverPresented, avgDays: avg };
  }, [ranking]);

  // ── Render ──
  return (
    <div style={{ fontFamily: F.sans }}>
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 20px rgba(245, 197, 24, 0.2); }
          50% { box-shadow: 0 0 40px rgba(245, 197, 24, 0.4); }
          100% { box-shadow: 0 0 20px rgba(245, 197, 24, 0.2); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }
        .rotation-tab {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .rotation-tab:hover:not(.active) {
          background: rgba(13, 26, 94, 0.04);
          transform: translateY(-2px);
        }
        .rotation-tab.active {
          box-shadow: 0 4px 16px rgba(13, 26, 94, 0.15);
        }
        .ranking-item {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ranking-item:hover {
          transform: translateX(6px);
          box-shadow: 0 4px 16px rgba(13, 26, 94, 0.08);
        }
        .recording-card {
          transition: all 0.3s ease;
        }
        .recording-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .title-input:focus {
          border-color: #f5c518;
          box-shadow: 0 0 0 4px rgba(245, 197, 24, 0.15);
        }
        .shimmer-loading {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* ── MAIN GLASS CARD ── */}
      <div
        style={{
          ...glass,
          borderRadius: 24,
          padding: "clamp(20px, 3vw, 32px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative elements */}
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

        {/* ── HEADER ── */}
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
                fontSize: 22,
                boxShadow: "0 4px 16px rgba(245, 197, 24, 0.3)",
              }}
            >
              <FiAward />
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
            {isPrivileged && (
              <button
                onClick={handleAssignNext}
                disabled={assigning}
                style={{
                  display: "flex",
                  alignItems: "center",
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
                  transition: "all 0.3s ease",
                  boxShadow: assigning
                    ? "none"
                    : "0 4px 16px rgba(245, 197, 24, 0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!assigning) {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 24px rgba(245, 197, 24, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!assigning) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(245, 197, 24, 0.3)";
                  }
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
                {assigning
                  ? t.assigning || "Assigning..."
                  : t.assignNext || "Assign Next"}
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `1.5px solid ${C.border}`,
                background: "transparent",
                cursor: loading ? "not-allowed" : "pointer",
                color: C.muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = C.bg;
                  e.currentTarget.style.borderColor = C.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = C.border;
                }
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

        {/* ── TAB SELECTOR ── */}
        <div
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
          {[
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
          ].map((tab) => (
            <button
              key={tab.id}
              className={`rotation-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: activeTab === tab.id ? C.white : "transparent",
                color: activeTab === tab.id ? C.dark : C.muted,
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.3s ease",
                fontFamily: F.sans,
                boxShadow:
                  activeTab === tab.id ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: C.primary,
                    marginLeft: 2,
                    animation: "pulse-glow 2s ease-in-out infinite",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB CONTENT ─── */}
        <AnimatePresence mode="wait">
          {activeTab === "presenter" && (
            <motion.div
              key="presenter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ position: "relative", zIndex: 1 }}
            >
              {loading ? (
                <PresenterSkeleton />
              ) : currentSession?.presenter ? (
                <CurrentPresenterCard
                  session={currentSession}
                  isMyTurn={isMyTurn}
                  isPrivileged={isPrivileged}
                  titleDraft={titleDraft}
                  setTitleDraft={setTitleDraft}
                  savingTitle={savingTitle}
                  onSaveTitle={handleSaveTitle}
                  onCopyTitle={handleCopyTitle}
                  copySuccess={copySuccess}
                  t={t}
                />
              ) : (
                <NoPresenterCard t={t} />
              )}
            </motion.div>
          )}

          {activeTab === "ranking" && (
            <motion.div
              key="ranking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ position: "relative", zIndex: 1 }}
            >
              <RankingList
                ranking={ranking}
                loading={loading}
                isPrivileged={isPrivileged}
                onAssign={handleAssignNext}
                assigning={assigning}
                expandedRanking={expandedRanking}
                setExpandedRanking={setExpandedRanking}
                rankingStats={rankingStats}
                t={t}
              />
            </motion.div>
          )}

          {activeTab === "recordings" && (
            <motion.div
              key="recordings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ position: "relative", zIndex: 1 }}
            >
              <RecordingsSection
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function CurrentPresenterCard({
  session,
  isMyTurn,
  isPrivileged,
  titleDraft,
  setTitleDraft,
  savingTitle,
  onSaveTitle,
  onCopyTitle,
  copySuccess,
  t,
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(245,197,24,0.08), rgba(13,26,94,0.04))",
        borderRadius: 18,
        padding: "clamp(20px, 3vw, 28px)",
        border: "1px solid rgba(245,197,24,0.2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,197,24,0.1), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Presenter Profile */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f5c518, #d4a017)",
            padding: 3,
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(245, 197, 24, 0.3)",
          }}
        >
          {session.presenterPhotoUrl ? (
            <img
              src={session.presenterPhotoUrl}
              alt={session.presenterName}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #fff",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                border: "2px solid #fff",
              }}
            >
              {session.presenterName?.charAt(0) || "?"}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>
              {session.presenterName}
            </span>
            {isMyTurn && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 14px",
                  borderRadius: 999,
                  background: "linear-gradient(135deg, #f5c518, #d4a017)",
                  color: C.dark,
                  animation: "pulse-glow 2s ease-in-out infinite",
                }}
              >
                {t.yourTurn || "🌟 Your Turn!"}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 14,
              color: C.muted,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>
              {session.presenterDepartment || t.noDepartment || "No department"}
            </span>
            <span style={{ fontSize: 12, color: C.border }}>|</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FiCalendar size={12} />
              {new Date(session.date).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.muted,
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{t.presenting || "Presenting"}:</span>
            {session.presentationTitle ? (
              <span
                style={{
                  fontWeight: 600,
                  color: C.dark,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                "{session.presentationTitle}"
                <button
                  onClick={onCopyTitle}
                  style={{
                    background: "none",
                    border: "none",
                    color: copySuccess ? "#10b981" : C.muted,
                    cursor: "pointer",
                    padding: "2px 4px",
                    transition: "all 0.2s ease",
                  }}
                  title={t.copyTitle || "Copy title"}
                >
                  {copySuccess ? (
                    <FiCheck size={14} color="#10b981" />
                  ) : (
                    <FiCopy size={14} />
                  )}
                </button>
              </span>
            ) : (
              <span style={{ fontStyle: "italic", color: C.muted }}>
                {t.titleNotChosen || "Title not chosen yet"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title Editor */}
      {(isMyTurn || isPrivileged) && (
        <div style={{ marginTop: 4 }}>
          <label
            style={{
              fontSize: 12,
              color: C.muted,
              display: "block",
              marginBottom: 6,
              fontWeight: 500,
            }}
          >
            {isMyTurn
              ? t.chooseTitle || "Choose your presentation title"
              : t.setTitleOnBehalf || "Set title on behalf"}
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder={
                t.titlePlaceholder ||
                "e.g. Digital Transformation in Public Service"
              }
              className="title-input"
              style={{
                flex: 1,
                minWidth: 200,
                padding: "12px 16px",
                borderRadius: 12,
                border: `1.5px solid ${C.border}`,
                fontFamily: F.sans,
                fontSize: 14,
                outline: "none",
                transition: "all 0.3s ease",
                background: C.white,
              }}
            />
            <button
              onClick={onSaveTitle}
              disabled={savingTitle || !titleDraft.trim()}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background:
                  savingTitle || !titleDraft.trim()
                    ? C.border
                    : "linear-gradient(135deg, #f5c518, #d4a017)",
                color: savingTitle || !titleDraft.trim() ? C.muted : C.dark,
                fontWeight: 700,
                fontSize: 14,
                cursor:
                  savingTitle || !titleDraft.trim() ? "not-allowed" : "pointer",
                opacity: savingTitle || !titleDraft.trim() ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.3s ease",
                boxShadow:
                  savingTitle || !titleDraft.trim()
                    ? "none"
                    : "0 4px 16px rgba(245, 197, 24, 0.3)",
              }}
            >
              {savingTitle ? (
                <FiLoader
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <FiCheck size={18} />
              )}
              {savingTitle
                ? t.saving || "Saving..."
                : t.saveTitle || "Save Title"}
            </button>
          </div>

          {/* AI Topic Suggestions */}
          {session.suggestedTopics?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p
                style={{
                  fontSize: 11,
                  color: C.muted,
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiCpu size={14} color={C.primary} />
                {t.aiTopicIdeas || "AI suggested topics (tap to use):"}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {session.suggestedTopics.slice(0, 6).map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => setTitleDraft(topic)}
                    style={{
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 20,
                      padding: "6px 14px",
                      fontSize: 12,
                      color: C.dark,
                      cursor: "pointer",
                      fontFamily: F.sans,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(245,197,24,0.15)";
                      e.currentTarget.style.borderColor = "#f5c518";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = C.bg;
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NoPresenterCard({ t }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px 20px",
        borderRadius: 16,
        border: "2px dashed rgba(245,197,24,0.3)",
        background: "rgba(245,197,24,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 56,
          marginBottom: 16,
          opacity: 0.4,
        }}
      >
        🎯
      </div>
      <p
        style={{
          fontSize: 17,
          color: C.dark,
          fontWeight: 700,
          marginBottom: 6,
          fontFamily: F.serif,
        }}
      >
        {t.nobodyAssigned || "Nobody assigned yet for the coming Monday"}
      </p>
      <p style={{ fontSize: 14, color: C.muted }}>
        {t.assignHint ||
          "The rotation algorithm will assign the next presenter automatically"}
      </p>
      <div
        style={{
          marginTop: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 16px",
          borderRadius: 20,
          background: `${C.primary}08`,
          border: `1px solid ${C.primary}15`,
          fontSize: 12,
          color: C.primary,
        }}
      >
        <FiInfo size={14} />
        {t.checkRoster || "Check the roster for eligible presenters"}
      </div>
    </div>
  );
}

function RankingList({
  ranking,
  loading,
  isPrivileged,
  onAssign,
  assigning,
  expandedRanking,
  setExpandedRanking,
  rankingStats,
  t,
}) {
  if (loading) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="shimmer-loading"
            style={{
              height: 52,
              borderRadius: 12,
              background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "30px 20px",
          color: C.muted,
          background: C.bg,
          borderRadius: 12,
        }}
      >
        <FiUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
        <p>{t.noRanking || "No eligible presenters on the roster yet"}</p>
        {isPrivileged && (
          <button
            onClick={onAssign}
            disabled={assigning}
            style={{
              marginTop: 12,
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: C.primary,
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: assigning ? "not-allowed" : "pointer",
              opacity: assigning ? 0.6 : 1,
            }}
          >
            {assigning
              ? t.assigning || "Assigning..."
              : t.assignNext || "Assign Next"}
          </button>
        )}
      </div>
    );
  }

  const displayRanking = expandedRanking ? ranking : ranking.slice(0, 8);

  return (
    <div>
      {/* Ranking Stats */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
          padding: "10px 14px",
          background: C.bg,
          borderRadius: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiUsers size={14} /> {t.totalPresenters || "Total"}:{" "}
          <strong>{rankingStats.total}</strong>
        </span>
        <span
          style={{
            fontSize: 12,
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiStar size={14} color={C.gold} /> {t.neverPresented || "New"}:{" "}
          <strong>{rankingStats.neverPresented}</strong>
        </span>
        <span
          style={{
            fontSize: 12,
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FiClock size={14} /> {t.avgWait || "Avg wait"}:{" "}
          <strong>{rankingStats.avgDays}d</strong>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, color: C.muted }}>
          {t.rotationOrder || "Rotation order (longest-waiting first)"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {isPrivileged && (
            <button
              onClick={onAssign}
              disabled={assigning}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                background: assigning
                  ? C.border
                  : "linear-gradient(135deg, #f5c518, #d4a017)",
                color: assigning ? C.muted : C.dark,
                fontWeight: 700,
                fontSize: 12,
                cursor: assigning ? "not-allowed" : "pointer",
                opacity: assigning ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!assigning) {
                  e.currentTarget.style.transform = "scale(1.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (!assigning) {
                  e.currentTarget.style.transform = "scale(1)";
                }
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
              {assigning
                ? t.assigning || "Assigning..."
                : t.assignNext || "Assign Next"}
            </button>
          )}
          {ranking.length > 8 && (
            <button
              onClick={() => setExpandedRanking(!expandedRanking)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {expandedRanking ? (
                <FiMinimize2 size={14} />
              ) : (
                <FiMaximize2 size={14} />
              )}
              {expandedRanking
                ? t.showLess || "Show Less"
                : t.showAll || "Show All"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {displayRanking.map((r, index) => {
          const isTop3 = index < 3;
          const colors = ["#f5c518", "#d4a017", "#b8860b"];
          const bgColors = [
            "rgba(245,197,24,0.12)",
            "rgba(212,160,23,0.10)",
            "rgba(184,134,11,0.08)",
          ];
          const isNew =
            r.daysSinceLastPresented === "never presented" ||
            r.daysSinceLastPresented === null;

          return (
            <motion.div
              key={r.userId || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="ranking-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: 12,
                background: isTop3 ? bgColors[index] : "transparent",
                border: isTop3
                  ? `1.5px solid ${colors[index]}44`
                  : `1px solid ${C.border}`,
                transition: "all 0.3s ease",
                cursor: "default",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  background: isTop3 ? colors[index] : C.bg,
                  color: isTop3 ? "#fff" : C.muted,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: C.dark,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {r.name}
                  {isTop3 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: colors[index],
                      }}
                    >
                      {index === 0 ? "🔥" : index === 1 ? "⭐" : "💪"}
                    </span>
                  )}
                  {isNew && (
                    <span
                      style={{
                        fontSize: 9,
                        background: `${C.primary}15`,
                        color: C.primary,
                        padding: "1px 10px",
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      {t.new || "NEW"}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>
                    {r.department || t.noDepartment || "No department"}
                  </span>
                  <span style={{ fontSize: 10, color: C.border }}>·</span>
                  <span>
                    {r.timesPresented || 0}x {t.presented || "presented"}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isTop3 ? colors[index] : C.dark,
                  }}
                >
                  {isNew
                    ? t.neverPresented || "✨ New"
                    : `${r.daysSinceLastPresented}d`}
                </div>
                <div style={{ fontSize: 10, color: C.muted }}>
                  {isNew ? t.never || "Never" : t.daysSince || "days since"}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {ranking.length > 8 && !expandedRanking && (
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: C.muted,
            marginTop: 10,
          }}
        >
          +{ranking.length - 8} {t.more || "more"} {t.employees || "employees"}
        </p>
      )}
    </div>
  );
}

function RecordingsSection({
  recordings,
  loading,
  isPrivileged,
  currentSession,
  recordingFile,
  setRecordingFile,
  uploadingRecording,
  onUploadRecording,
  showAllRecordings,
  setShowAllRecordings,
  t,
}) {
  if (loading) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="shimmer-loading"
            style={{
              height: 76,
              borderRadius: 12,
              background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  const displayRecordings = showAllRecordings
    ? recordings
    : recordings.slice(0, 3);

  return (
    <div>
      {/* Upload section for admins */}
      {isPrivileged && currentSession && (
        <div
          style={{
            marginBottom: 18,
            padding: "16px 20px",
            borderRadius: 14,
            background:
              "linear-gradient(135deg, rgba(245,197,24,0.06), rgba(13,26,94,0.03))",
            border: `1px solid rgba(245,197,24,0.15)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <FiUpload size={16} color={C.primary} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
              {t.uploadRecordingLabel || "Upload Session Recording"}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 160 }}>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setRecordingFile(e.target.files?.[0] || null)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.border}`,
                  fontSize: 13,
                  background: C.white,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            <button
              onClick={onUploadRecording}
              disabled={!recordingFile || uploadingRecording}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background:
                  !recordingFile || uploadingRecording
                    ? C.border
                    : `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                color: !recordingFile || uploadingRecording ? C.muted : "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor:
                  !recordingFile || uploadingRecording
                    ? "not-allowed"
                    : "pointer",
                opacity: !recordingFile || uploadingRecording ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.3s ease",
                boxShadow:
                  !recordingFile || uploadingRecording
                    ? "none"
                    : `0 4px 16px ${C.primary}33`,
              }}
              onMouseEnter={(e) => {
                if (!recordingFile && !uploadingRecording) {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = `0 6px 24px ${C.primary}44`;
                }
              }}
              onMouseLeave={(e) => {
                if (!recordingFile && !uploadingRecording) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}33`;
                }
              }}
            >
              {uploadingRecording ? (
                <FiLoader
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <FiUpload size={18} />
              )}
              {uploadingRecording
                ? t.uploading || "Uploading..."
                : t.uploadRecording || "Upload Recording"}
            </button>
          </div>
          <p
            style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiInfo size={12} />
            {t.recordingDescription ||
              "Uploads are visible to all staff for 7 days, then automatically removed."}
          </p>
        </div>
      )}

      {/* Recordings list */}
      {recordings.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "30px 20px",
            color: C.muted,
            background: C.bg,
            borderRadius: 12,
          }}
        >
          <FiVideo size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ fontSize: 14 }}>
            {t.noRecordings || "No recordings currently available"}
          </p>
          <p style={{ fontSize: 12 }}>
            {t.recordingsExpire || "Recordings expire 7 days after upload"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {displayRecordings.map((r) => (
            <div
              key={r._id}
              className="recording-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                background: C.white,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${C.primary}15, ${C.primary}05)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.primary,
                  }}
                >
                  <FiVideo size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: C.dark, fontSize: 14 }}>
                    {r.presentationTitle ||
                      r.title ||
                      t.untitledSession ||
                      "Untitled"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{r.presenterName || "Unknown"}</span>
                    <span style={{ fontSize: 10, color: C.border }}>·</span>
                    {r.recordingExpiresAt && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FiClock size={12} />
                        {new Date(r.recordingExpiresAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: C.muted }}>
                      {t.expiry || "expiry"}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={r.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.3s ease",
                  boxShadow: `0 4px 12px ${C.primary}33`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow = `0 6px 20px ${C.primary}44`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}33`;
                }}
              >
                <FiPlay size={14} /> {t.watch || "Watch"}
              </a>
            </div>
          ))}

          {recordings.length > 3 && (
            <button
              onClick={() => setShowAllRecordings(!showAllRecordings)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: `1.5px solid ${C.border}`,
                background: "transparent",
                color: C.muted,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {showAllRecordings ? (
                <FiMinimize2 size={16} />
              ) : (
                <FiMaximize2 size={16} />
              )}
              {showAllRecordings
                ? t.showLess || "Show Less"
                : `${t.showAll || "Show All"} (${recordings.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PresenterSkeleton() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div
        className="shimmer-loading"
        style={{
          height: 100,
          borderRadius: 14,
          background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />
      <div
        className="shimmer-loading"
        style={{
          height: 60,
          borderRadius: 14,
          background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s ease-in-out infinite 0.3s",
        }}
      />
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
