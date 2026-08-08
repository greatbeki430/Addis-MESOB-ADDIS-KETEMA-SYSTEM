// frontend/src/components/EvaluationFeed.jsx
// Employees are evaluated, not evaluators — this is what they see instead
// of the scoring form: every team's evaluation, read-only, with the ability
// to react and discuss. Mirrors DailyReportFeed's pattern.
import { useState, useEffect, useCallback } from "react";
import { card, btn, C, F } from "../styles/theme";
import { evaluationAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  FiSend,
  FiTrash2,
  FiCalendar,
  FiLoader,
  FiThumbsUp,
  FiAward,
  FiUsers,
} from "react-icons/fi";

const REACTIONS = ["👍", "❤️", "🎉", "👏", "💡"];
// Shared page-level padding, matching every other page (incl. the leader+
// scoring form this replaces for employees) so content isn't flush against
// the top header bar.
const PAGE_PADDING = "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function avgScore(evaluation) {
  const totals = Array.isArray(evaluation.totalScores)
    ? evaluation.totalScores
    : [];
  if (totals.length === 0) return null;
  const vals = totals.map((s) => Number(s?.total ?? s?.score ?? 0));
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export default function EvaluationFeed({ t }) {
  const { user, isAdminOrSuperAdmin } = useAuth();
  const { showToast } = useToast();

  // Memoize te to prevent unnecessary re-renders and fix dependency warnings
  const te = useCallback((key, fb = "") => t?.(`evaluation.${key}`) || fb, [t]);

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [posting, setPosting] = useState(null);
  const [openPicker, setOpenPicker] = useState(null);

  // Load data once on mount - te is stable due to useCallback
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        setLoading(true);
        const res = await evaluationAPI.getAll();
        const list = Array.isArray(res.data) ? res.data : [];
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvaluations(list);
      } catch (error) {
        console.error("Failed to load evaluations:", error);
        showToast(te("loadError", "Failed to load evaluations"), "error");
      } finally {
        setLoading(false);
      }
    };

    loadEvaluations();
  }, [showToast, te]);

  // Memoize reaction handlers to prevent unnecessary re-renders
  const react = useCallback(
    async (id, emoji) => {
      try {
        const res = await evaluationAPI.react(id, emoji);
        setEvaluations((prev) =>
          prev.map((e) => (e._id === id ? res.data : e)),
        );
        setOpenPicker(null);
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to react", "error");
      }
    },
    [showToast],
  );

  const postComment = useCallback(
    async (id) => {
      const text = (commentDrafts[id] || "").trim();
      if (!text) return;
      try {
        setPosting(id);
        const res = await evaluationAPI.addComment(id, text);
        setEvaluations((prev) =>
          prev.map((e) => (e._id === id ? res.data : e)),
        );
        setCommentDrafts((prev) => ({ ...prev, [id]: "" }));
      } catch (error) {
        showToast(
          error.response?.data?.message || "Failed to post comment",
          "error",
        );
      } finally {
        setPosting(null);
      }
    },
    [commentDrafts, showToast],
  );

  const removeComment = useCallback(
    async (id, commentId) => {
      try {
        const res = await evaluationAPI.deleteComment(id, commentId);
        setEvaluations((prev) =>
          prev.map((e) => (e._id === id ? res.data : e)),
        );
      } catch (error) {
        showToast(
          error.response?.data?.message || "Failed to delete comment",
          "error",
        );
      }
    },
    [showToast],
  );

  // Memoize helper functions
  const reactionGroups = useCallback((reactions = []) => {
    const groups = {};
    reactions.forEach((r) => {
      groups[r.emoji] = (groups[r.emoji] || 0) + 1;
    });
    return groups;
  }, []);

  const myReaction = useCallback(
    (reactions = []) => {
      return reactions.find(
        (r) => r.user === user?._id || r.user?._id === user?._id,
      )?.emoji;
    },
    [user],
  );

  if (loading) {
    return (
      <div style={{ maxWidth: 820, margin: "0 auto", padding: PAGE_PADDING }}>
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <FiLoader
            size={24}
            color={C.primary}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p style={{ color: C.muted, marginTop: 12 }}>
            {te("loading", "Loading evaluations...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: PAGE_PADDING }}>
      <div
        style={{
          ...card,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <FiAward size={20} color={C.primary} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>
            {te("title", "Team Evaluations")}
          </div>
          <div style={{ fontSize: 12.5, color: C.muted }}>
            {te(
              "employeeNotice",
              "Evaluations are completed by your Team Leader or Admin. You can view, react, and comment here.",
            )}
          </div>
        </div>
      </div>

      {evaluations.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <FiUsers size={32} color={C.muted} />
          <p style={{ color: C.muted, marginTop: 12 }}>
            {te("noEvaluations", "No evaluations have been posted yet.")}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {evaluations.map((evaluation) => {
            const groups = reactionGroups(evaluation.reactions);
            const mine = myReaction(evaluation.reactions);
            const score = avgScore(evaluation);
            return (
              <div key={evaluation._id} style={{ ...card, padding: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{ fontWeight: 800, fontSize: 15, color: C.dark }}
                    >
                      {evaluation.teamName || evaluation.team?.name || "Team"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      <FiCalendar size={11} />
                      {new Date(
                        evaluation.createdAt,
                      ).toLocaleDateString()} · {timeAgo(evaluation.createdAt)}
                      {evaluation.evaluatedBy
                        ? ` · ${te("by", "by")} ${evaluation.evaluatedBy}`
                        : ""}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {score !== null && (
                      <div
                        style={{
                          background: `${C.primary}12`,
                          color: C.primary,
                          fontWeight: 800,
                          fontSize: 13,
                          padding: "4px 10px",
                          borderRadius: 8,
                        }}
                      >
                        {te("avg", "avg")} {score}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "capitalize",
                        padding: "3px 9px",
                        borderRadius: 999,
                        background:
                          evaluation.status === "approved"
                            ? "#DCFCE7"
                            : evaluation.status === "submitted"
                              ? "#DBEAFE"
                              : "#F1F5F9",
                        color:
                          evaluation.status === "approved"
                            ? "#16A34A"
                            : evaluation.status === "submitted"
                              ? "#2563EB"
                              : "#64748B",
                      }}
                    >
                      {evaluation.status || "draft"}
                    </span>
                  </div>
                </div>

                {Array.isArray(evaluation.totalScores) &&
                  evaluation.totalScores.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 12,
                      }}
                    >
                      {evaluation.totalScores.slice(0, 8).map((s, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            background: "#F1F5F9",
                            color: C.muted,
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}
                        >
                          {s.name || s.member || `#${i + 1}`} ·{" "}
                          {s.total ?? s.score ?? 0}
                        </span>
                      ))}
                    </div>
                  )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderTop: "1px solid #F1F5F9",
                    paddingTop: 10,
                    marginTop: 12,
                    position: "relative",
                    flexWrap: "wrap",
                  }}
                >
                  {Object.entries(groups).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      style={{
                        fontSize: 12,
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: 999,
                        padding: "3px 8px",
                      }}
                    >
                      {emoji} {count}
                    </span>
                  ))}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() =>
                        setOpenPicker(
                          openPicker === evaluation._id ? null : evaluation._id,
                        )
                      }
                      style={{
                        ...btn.secondary,
                        padding: "5px 10px",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: mine ? `${C.primary}15` : undefined,
                        color: mine ? C.primary : undefined,
                      }}
                    >
                      <FiThumbsUp size={13} />
                      {mine || te("react", "React")}
                    </button>
                    {openPicker === evaluation._id && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "110%",
                          left: 0,
                          background: "#fff",
                          border: "1px solid #E2E8F0",
                          borderRadius: 10,
                          boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                          padding: 6,
                          display: "flex",
                          gap: 4,
                          zIndex: 5,
                        }}
                      >
                        {REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => react(evaluation._id, emoji)}
                            style={{
                              border: "none",
                              background: "transparent",
                              fontSize: 18,
                              cursor: "pointer",
                              padding: 4,
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  {(evaluation.discussion || []).map((c) => (
                    <div
                      key={c._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "6px 0",
                        fontSize: 12.5,
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: C.dark }}>
                          {c.user?.name || "Unknown"}:
                        </span>{" "}
                        <span style={{ color: C.dark }}>{c.text}</span>
                        <div style={{ fontSize: 10.5, color: C.muted }}>
                          {timeAgo(c.createdAt)}
                        </div>
                      </div>
                      {(c.user?._id === user?._id || isAdminOrSuperAdmin) && (
                        <button
                          onClick={() => removeComment(evaluation._id, c._id)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: C.muted,
                            cursor: "pointer",
                          }}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      value={commentDrafts[evaluation._id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [evaluation._id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && postComment(evaluation._id)
                      }
                      placeholder={te("writeComment", "Write a comment...")}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        fontSize: 12.5,
                        fontFamily: F.sans,
                      }}
                    />
                    <button
                      onClick={() => postComment(evaluation._id)}
                      disabled={posting === evaluation._id}
                      style={{
                        ...btn.primary,
                        padding: "7px 12px",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <FiSend size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
