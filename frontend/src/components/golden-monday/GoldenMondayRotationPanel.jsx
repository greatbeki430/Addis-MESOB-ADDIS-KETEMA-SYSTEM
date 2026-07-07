// src/components/golden-monday/GoldenMondayRotationPanel.jsx
// Presenter rotation, self-chosen title, and catch-up recordings — the
// three new pieces of Golden Monday requested on top of the existing
// landing page. Self-contained so it drops into GoldenMonday.jsx with a
// single import + render call.

import { useState, useCallback } from "react";
import { C, F } from "../../styles/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import {
  FiUsers,
  FiRefreshCw,
  FiEdit3,
  FiVideo,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

const card = {
  background: C.white,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: "clamp(16px, 3vw, 24px)",
  marginBottom: 24,
};

const btn = (bg = C.primary, color = C.white) => ({
  background: bg,
  color,
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontFamily: F.sans,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
});

export default function GoldenMondayRotationPanel() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const gmCopy = t?.goldenMonday || {};
  const isPrivileged = ["leader", "admin", "superadmin"].includes(user?.role);

  const [ranking, setRanking] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const [recordingFile, setRecordingFile] = useState(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);

  // Track if initial load has been done
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Helper for translations
  const getText = (obj) => obj?.[language] || obj?.en || obj;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rotationRes, sessionsRes, recordingsRes] = await Promise.all([
        goldenMondayAPI.previewRotation(),
        goldenMondayAPI.getAll(),
        goldenMondayAPI.getLiveRecordings(),
      ]);

      setRanking(rotationRes.data.ranking || []);

      // The most recent scheduled/ongoing session with a presenter is
      // "this week's" session.
      const sessions = sessionsRes.data || [];
      const upcoming = sessions.find(
        (s) => s.presenter && s.status !== "cancelled",
      );
      setCurrentSession(upcoming || null);
      setTitleDraft(upcoming?.presentationTitle || "");

      setRecordings(recordingsRes.data || []);
    } catch (err) {
      console.error("Golden Monday rotation load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on first render using a state flag - no useEffect needed
  if (!initialLoadDone) {
    setInitialLoadDone(true);
    loadAll();
  }

  const handleAssignNext = async () => {
    setAssigning(true);
    try {
      const res = await goldenMondayAPI.assignRotation();
      if (res.data.alreadyAssigned) {
        showToast("This week's presenter is already assigned", "info");
      } else {
        showToast(
          `${res.data.session.presenterName} assigned to present next`,
          "success",
        );
      }
      await loadAll();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to assign presenter",
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
      showToast("Presentation title saved", "success");
      await loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save title", "error");
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
      showToast("Recording uploaded — visible to staff for 7 days", "success");
      setRecordingFile(null);
      await loadAll();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to upload recording",
        "error",
      );
    } finally {
      setUploadingRecording(false);
    }
  };

  const isMyTurn =
    currentSession?.presenter &&
    user?._id &&
    String(currentSession.presenter) === String(user._id);

  return (
    <div>
      {/* ── Who presents next ─────────────────────────────── */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <FiUsers color={C.primary} size={20} />
          <h3 style={{ margin: 0, color: C.dark, fontFamily: F.sans }}>
            {getText(gmCopy.rotationTitle) || "Presenter Rotation"}
          </h3>
        </div>

        {loading ? (
          <p style={{ color: C.muted }}>
            {getText(gmCopy.loadingRotation) || "Loading rotation…"}
          </p>
        ) : currentSession?.presenter ? (
          <div>
            <p style={{ margin: "0 0 6px", color: C.muted, fontSize: 14 }}>
              {getText(gmCopy.thisWeekPresenter) || "This week's presenter"}
            </p>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 18,
                fontWeight: 700,
                color: C.dark,
              }}
            >
              {currentSession.presenterName}{" "}
              {currentSession.presenterDepartment && (
                <span style={{ fontWeight: 400, color: C.muted, fontSize: 14 }}>
                  ({currentSession.presenterDepartment})
                </span>
              )}
            </p>
            <p style={{ margin: "0 0 14px", color: C.muted, fontSize: 13 }}>
              {currentSession.presentationTitle
                ? `Presenting: "${currentSession.presentationTitle}"`
                : getText(gmCopy.titleNotChosen) || "Title not chosen yet"}
            </p>

            {/* Presenter (or a leader/admin on their behalf) picks a title */}
            {(isMyTurn || isPrivileged) && (
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 6,
                  }}
                >
                  {isMyTurn
                    ? getText(gmCopy.chooseTitle) ||
                      "Choose your presentation title"
                    : getText(gmCopy.setTitleOnBehalf) ||
                      "Set title on presenter's behalf"}
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    placeholder="e.g. Handling Difficult Citizen Requests"
                    style={{
                      flex: 1,
                      minWidth: 220,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontFamily: F.sans,
                    }}
                  />
                  <button
                    style={btn()}
                    onClick={handleSaveTitle}
                    disabled={savingTitle || !titleDraft.trim()}
                  >
                    <FiEdit3 size={14} />{" "}
                    {savingTitle
                      ? getText(gmCopy.saving) || "Saving…"
                      : getText(gmCopy.saveTitle) || "Save Title"}
                  </button>
                </div>

                {currentSession.suggestedTopics?.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        margin: "0 0 6px",
                      }}
                    >
                      {getText(gmCopy.aiTopicIdeas) ||
                        "AI topic ideas (tap to use):"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {currentSession.suggestedTopics.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => setTitleDraft(t)}
                          style={{
                            background: C.bg,
                            border: `1px solid ${C.border}`,
                            borderRadius: 20,
                            padding: "6px 12px",
                            fontSize: 12,
                            color: C.dark,
                            cursor: "pointer",
                            fontFamily: F.sans,
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: C.muted, marginBottom: 14 }}>
            {getText(gmCopy.nobodyAssigned) ||
              "Nobody assigned yet for the coming Monday."}
          </p>
        )}

        {isPrivileged && (
          <button
            style={btn(C.gold, C.dark)}
            onClick={handleAssignNext}
            disabled={assigning}
          >
            <FiRefreshCw size={14} />{" "}
            {assigning
              ? getText(gmCopy.assigning) || "Assigning…"
              : getText(gmCopy.assignNext) || "Assign Next Presenter"}
          </button>
        )}

        {/* Ranked queue, for transparency */}
        {isPrivileged && ranking.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 8px" }}>
              {getText(gmCopy.rotationOrder) ||
                "Rotation order (longest-waiting first):"}
            </p>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13,
                color: C.dark,
              }}
            >
              {ranking.slice(0, 5).map((r) => (
                <li key={r.userId} style={{ marginBottom: 4 }}>
                  {r.name}{" "}
                  <span style={{ color: C.muted }}>
                    —{" "}
                    {r.daysSinceLastPresented === "never presented"
                      ? getText(gmCopy.neverPresented) || "never presented"
                      : `${r.daysSinceLastPresented} ${getText(gmCopy.daysSince) || "days since last time"}`}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* ── Recording upload (leader/admin) ───────────────── */}
      {isPrivileged && currentSession && (
        <div style={card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <FiVideo color={C.primary} size={20} />
            <h3 style={{ margin: 0, color: C.dark, fontFamily: F.sans }}>
              {getText(gmCopy.sessionRecording) || "Session Recording"}
            </h3>
          </div>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>
            {getText(gmCopy.recordingDescription) ||
              "Uploads are visible to all staff for 7 days, then automatically removed."}
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setRecordingFile(e.target.files?.[0] || null)}
            />
            <button
              style={btn()}
              onClick={handleUploadRecording}
              disabled={!recordingFile || uploadingRecording}
            >
              <FiVideo size={14} />{" "}
              {uploadingRecording
                ? getText(gmCopy.uploading) || "Uploading…"
                : getText(gmCopy.uploadRecording) || "Upload Recording"}
            </button>
          </div>
        </div>
      )}

      {/* ── This week's catch-up recordings ───────────────── */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <FiClock color={C.primary} size={20} />
          <h3 style={{ margin: 0, color: C.dark, fontFamily: F.sans }}>
            {getText(gmCopy.catchUp) || "Catch Up — Recent Recordings"}
          </h3>
        </div>
        {recordings.length === 0 ? (
          <p style={{ color: C.muted, fontSize: 14 }}>
            {getText(gmCopy.noRecordings) ||
              "No recordings currently available (recordings expire 7 days after upload)."}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {recordings.map((r) => (
              <div
                key={r._id}
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: C.dark }}>
                    {r.presentationTitle || r.title}
                  </p>
                  <p
                    style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}
                  >
                    {r.presenterName} ·{" "}
                    {new Date(r.recordingExpiresAt).toLocaleDateString()}{" "}
                    {getText(gmCopy.expiry) || "expiry"}
                  </p>
                </div>
                <a
                  href={r.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...btn(C.bg, C.dark), textDecoration: "none" }}
                >
                  <FiCheckCircle size={14} /> {getText(gmCopy.watch) || "Watch"}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── helper ──────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
