// src/components/golden-monday/rotation/PresenterTab.jsx
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiCheck,
  FiCopy,
  FiCpu,
  FiInfo,
  FiLoader,
  FiUsers,
} from "react-icons/fi";
import { C, F } from "../../../styles/theme";
import { PresenterSkeleton } from "./Skeleton";
import SessionActionsBar from "./SessionActionsBar"; // ✅ FIXED: was missing

export default function PresenterTab({
  loading,
  currentSession,
  isMyTurn,
  isPrivileged,
  titleDraft,
  setTitleDraft,
  savingTitle,
  onSaveTitle,
  onCopyTitle,
  copySuccess,
  onRefresh,
  onOpenManualPicker,
  t,
}) {
  if (loading) {
    return <PresenterSkeleton />;
  }

  if (!currentSession?.presenter) {
    return <NoPresenterCard t={t} onOpenManualPicker={onOpenManualPicker} />;
  }

  return (
    <motion.div
      key="presenter"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <style>{`
        /* ─── Presenter card responsive rules ─────────────────────
           On narrow screens the desktop row (avatar | name block)
           and the title row (input | save button) both squeeze and
           wrap mid-element, which reads as broken. Force them onto
           their own lines, center the avatar, and let the input
           take the full width. Only applies below 640px. */
        @media (max-width: 640px) {
          .gm-presenter-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
          }
          .gm-presenter-meta {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
          }
          .gm-presenter-meta-divider {
            display: none !important;
          }
          .gm-presenter-title-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .gm-presenter-title-input,
          .gm-presenter-title-btn {
            width: 100% !important;
            min-width: 0 !important;
            justify-content: center !important;
          }
          .gm-presenter-card {
            padding: 16px !important;
          }
          .gm-presenter-avatar {
            width: 60px !important;
            height: 60px !important;
          }
        }
      `}</style>

      {isPrivileged && (
        <SessionActionsBar
          session={currentSession}
          onAction={onRefresh}
          t={t}
        />
      )}

      <CurrentPresenterCard
        session={currentSession}
        isMyTurn={isMyTurn}
        isPrivileged={isPrivileged}
        titleDraft={titleDraft}
        setTitleDraft={setTitleDraft}
        savingTitle={savingTitle}
        onSaveTitle={onSaveTitle}
        onCopyTitle={onCopyTitle}
        copySuccess={copySuccess}
        t={t}
      />
    </motion.div>
  );
}

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
      className="gm-presenter-card"
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

      <div
        className="gm-presenter-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div
          className="gm-presenter-avatar"
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

        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
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
                }}
              >
                {t.yourTurn || "🌟 Your Turn!"}
              </span>
            )}
          </div>

          {/* Department + date. Uses a wrapper class so the mobile
              media query can stack them and hide the `|` divider,
              which otherwise reads as a stray character. */}
          <div
            className="gm-presenter-meta"
            style={{
              fontSize: 14,
              color: C.muted,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span>
              {session.presenterDepartment || t.noDepartment || "No department"}
            </span>
            <span
              className="gm-presenter-meta-divider"
              style={{ fontSize: 12, color: C.border }}
            >
              |
            </span>
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
            className="gm-presenter-meta"
            style={{
              fontSize: 13,
              color: C.muted,
              marginTop: 6,
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
                  wordBreak: "break-word",
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
                    flexShrink: 0,
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
          <div
            className="gm-presenter-title-row"
            style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
          >
            <input
              className="gm-presenter-title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder={
                t.titlePlaceholder ||
                "e.g. Digital Transformation in Public Service"
              }
              style={{
                flex: 1,
                minWidth: 200,
                padding: "12px 16px",
                borderRadius: 12,
                border: `1.5px solid ${C.border}`,
                fontFamily: F.sans,
                fontSize: 14,
                outline: "none",
                background: C.white,
                boxSizing: "border-box",
              }}
            />
            <button
              className="gm-presenter-title-btn"
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
                whiteSpace: "nowrap",
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

function NoPresenterCard({ t, onOpenManualPicker }) {
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
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>🎯</div>
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
          marginTop: 20,
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
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

        {onOpenManualPicker && (
          <button
            onClick={onOpenManualPicker}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 18px",
              borderRadius: 20,
              background: "transparent",
              border: `1.5px solid ${C.border}`,
              color: C.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: F.sans,
            }}
          >
            <FiUsers size={14} />
            {t.pickManually || "Or pick someone manually"}
          </button>
        )}
      </div>
    </div>
  );
}
