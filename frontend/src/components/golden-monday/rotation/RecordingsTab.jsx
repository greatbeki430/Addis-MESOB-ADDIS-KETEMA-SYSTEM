// src/components/golden-monday/rotation/RecordingsTab.jsx
import {
  FiVideo,
  FiPlay,
  FiClock,
  FiUpload,
  FiLoader,
  FiInfo,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";
import { C, F } from "../../../styles/theme";
import { RecordingsSkeleton } from "./Skeleton";

export default function RecordingsTab({
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
  if (loading) return <RecordingsSkeleton />;

  const displayRecordings = showAllRecordings
    ? recordings
    : recordings.slice(0, 3);

  return (
    <div>
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
                  boxSizing: "border-box",
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
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: F.sans,
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
                          { month: "short", day: "numeric" },
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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: F.sans,
              }}
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
