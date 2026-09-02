// frontend/src/components/EvaluationFeed.jsx
// Employees are evaluated, not evaluators — this is what they see instead
// of the scoring form: every team's evaluation, read-only, with the ability
// to react, comment, share and bookmark — a proper social feed for
// accountability, not just a data table.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { evaluationAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  canCommentOnEvaluation,
  canReactToEvaluation,
  canDeleteEvaluationComment,
  getUserTeamId,
  isAdminOrAbove,
  isLeaderOrAbove,
} from "../utils/roles";
import {
  FiSend,
  FiTrash2,
  FiCalendar,
  FiLoader,
  FiHeart,
  FiSmile,
  FiMessageCircle,
  FiShare2,
  FiBookmark,
  FiSearch,
  FiAward,
  FiUsers,
  FiTrendingUp,
  FiCheckCircle,
  FiCopy,
  FiX,
  FiChevronDown,
  FiInbox,
  FiEye,
} from "react-icons/fi";

// ── Design Tokens (matches the Dashboard's established teal/brass/clay
//    system — same serif/sans/mono triad, same signature radial-ring motif) ─
const T = {
  ink: "#0E241C",
  inkSoft: "#3D5A4E",
  inkLight: "#6B8A7E",
  panel: "#FFFFFF",
  canvas: "#F0F5F2",
  canvasDeep: "#E4ECE7",
  teal: "#146149",
  tealDeep: "#0A3B2A",
  tealBright: "#1E8A63",
  tealLight: "#E8F5F0",
  brass: "#C89B3C",
  brassLight: "#E4C878",
  brassDark: "#A67A2E",
  clay: "#B5542E",
  clayLight: "#F5E8E0",
  mist: "#D8E3DD",
  white: "#FFFFFF",
  serif: "'Noto Serif Ethiopic', Georgia, serif",
  sans: "'Noto Sans Ethiopic', -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Cascadia Code', 'Courier New', monospace",
};

const AVATAR_HUES = [
  T.teal,
  T.brass,
  T.clay,
  "#3D6B8C",
  "#8B5A9E",
  T.tealBright,
  T.brassDark,
];

const REACTIONS = ["👍", "❤️", "🎉", "👏", "💡"];
const LIKE_EMOJI = "❤️";
const BOOKMARK_KEY = "mesob:evalBookmarks";

// ── Helpers ────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "just now";
  const date = new Date(dateStr);
  // Check if date is valid
  if (isNaN(date.getTime())) return "just now";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

function avgScore(evaluation) {
  const totals = Array.isArray(evaluation.totalScores)
    ? evaluation.totalScores
    : [];
  if (totals.length === 0) return null;
  const vals = totals.map((s) => Number(s?.total ?? s?.score ?? 0));
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hueFromString(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
}

function formatCount(n) {
  if (n < 1000) return String(n);
  if (n < 1000000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
  return `${(n / 1000000).toFixed(1)}m`;
}

// ── Avatar ─────────────────────────────────────────────────
function Avatar({ name, size = 34 }) {
  const bg = hueFromString(name || "?");
  return (
    <div
      className="ef-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, ${bg}, ${T.tealDeep})`,
      }}
    >
      {initials(name)}
    </div>
  );
}

// ── Score Ring — the feed's signature element, echoing the ───
//    Dashboard's radial performance gauge so the two pages read
//    as one product.
function ScoreRing({ score, size = 54 }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    if (score === null) return;
    let raf;
    const start = performance.now();
    const duration = 900;
    const to = Math.max(0, Math.min(100, score));
    const tick = (ts) => {
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  if (score === null) {
    return (
      <div
        className="ef-score-ring ef-score-ring-empty"
        style={{ width: size, height: size }}
      >
        <span>—</span>
      </div>
    );
  }

  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - animated / 100);
  const color = score < 50 ? T.clay : score < 75 ? T.brass : T.tealBright;

  return (
    <div className="ef-score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={T.mist}
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke 0.3s ease" }}
        />
      </svg>
      <span className="ef-score-ring-val" style={{ color }}>
        {Math.round(animated)}
      </span>
    </div>
  );
}

// ── Reaction bubble cluster (Facebook-style overlapping emoji) ─
function ReactionCluster({ groups, total, onClick }) {
  const top = Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emoji]) => emoji);
  if (total === 0) return null;
  return (
    <button className="ef-reaction-cluster" onClick={onClick} type="button">
      <span className="ef-reaction-bubbles">
        {top.map((emoji, i) => (
          <span
            key={emoji}
            className="ef-reaction-bubble"
            style={{ zIndex: top.length - i }}
          >
            {emoji}
          </span>
        ))}
      </span>
      <span className="ef-reaction-count">{formatCount(total)}</span>
    </button>
  );
}

// ── Skeleton loading card ─────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="ef-card ef-skeleton">
      <div className="ef-skeleton-row">
        <div className="ef-skeleton-block ef-skeleton-circle" />
        <div style={{ flex: 1 }}>
          <div
            className="ef-skeleton-block"
            style={{ width: "40%", height: 12, marginBottom: 6 }}
          />
          <div
            className="ef-skeleton-block"
            style={{ width: "60%", height: 9 }}
          />
        </div>
        <div
          className="ef-skeleton-block ef-skeleton-circle"
          style={{ width: 54, height: 54 }}
        />
      </div>
      <div
        className="ef-skeleton-block"
        style={{ width: "100%", height: 28, marginTop: 14, borderRadius: 8 }}
      />
      <div
        className="ef-skeleton-block"
        style={{ width: "50%", height: 28, marginTop: 8, borderRadius: 8 }}
      />
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────
function EmptyState({ label, sub }) {
  return (
    <div className="ef-empty">
      <div className="ef-empty-icon">
        <FiInbox size={26} />
      </div>
      <div className="ef-empty-title">{label}</div>
      {sub && <div className="ef-empty-sub">{sub}</div>}
    </div>
  );
}

// ── Comment item ───────────────────────────────────────────
function CommentItem({ comment, canDelete, onDelete, onReply }) {
  return (
    <div className="ef-comment">
      <Avatar name={comment.user?.name || "?"} size={26} />
      <div className="ef-comment-body">
        <div className="ef-comment-bubble">
          <span className="ef-comment-name">
            {comment.user?.name || "Unknown"}
          </span>
          <span className="ef-comment-text">{comment.text}</span>
        </div>
        <div className="ef-comment-meta">
          <span>
            {comment.createdAt ? timeAgo(comment.createdAt) : "Just now"}
          </span>{" "}
          <button
            className="ef-comment-action"
            onClick={() => onReply(comment.user?.name)}
          >
            Reply
          </button>
          {canDelete && (
            <button
              className="ef-comment-action ef-comment-delete"
              onClick={onDelete}
            >
              <FiTrash2 size={10} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Evaluation Card ────────────────────────────────────────
function EvaluationCard({
  evaluation,
  user,
  userTeamId,
  te,
  onReact,
  onLike,
  onPostComment,
  onDeleteComment,
  commentDraft,
  onDraftChange,
  posting,
  isBookmarked,
  onToggleBookmark,
  onShare,
  index,
}) {
  const [openPicker, setOpenPicker] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [burstHeart, setBurstHeart] = useState(false);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  // ── Permission Checks using roles.js utilities ──────────────────────────────
  const canComment = canCommentOnEvaluation(user, evaluation);
  const canReact = canReactToEvaluation(user, evaluation);

  // Can delete comments if: user owns the comment OR has admin/leader permissions
  const canDeleteComments = (comment) => {
    if (!user || !comment) return false;
    // User can delete their own comments
    if (comment.user?._id === user._id || comment.user === user._id)
      return true;
    // Use the utility function for role-based deletion
    return canDeleteEvaluationComment(user, evaluation, comment);
  };

  const groups = useMemo(() => {
    const g = {};
    (evaluation.reactions || []).forEach((r) => {
      g[r.emoji] = (g[r.emoji] || 0) + 1;
    });
    return g;
  }, [evaluation.reactions]);
  const totalReactions = (evaluation.reactions || []).length;
  const myReaction = (evaluation.reactions || []).find(
    (r) => r.user === user?._id || r.user?._id === user?._id,
  )?.emoji;
  const iLiked = myReaction === LIKE_EMOJI;

  const score = avgScore(evaluation);
  const comments = evaluation.discussion || [];
  const visibleComments = showAllComments ? comments : comments.slice(-2);

  // Check if this is the user's own team
  const evalTeamId =
    evaluation.team?._id || evaluation.teamId || evaluation.team;
  const isOwnTeam =
    userTeamId && evalTeamId && userTeamId.toString() === evalTeamId.toString();

  useEffect(() => {
    const onDocClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setOpenPicker(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleDoubleTapLike = () => {
    if (!iLiked && canReact) onLike(evaluation._id);
    setBurstHeart(true);
    setTimeout(() => setBurstHeart(false), 700);
  };

  const handleReply = (name) => {
    setCommentsOpen(true);
    onDraftChange(evaluation._id, `@${name} `);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const statusColor =
    evaluation.status === "approved"
      ? T.tealBright
      : evaluation.status === "submitted"
        ? "#3D6B8C"
        : T.brass;

  return (
    <article
      className="ef-card"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="ef-status-stripe" style={{ background: statusColor }} />

      <div className="ef-card-inner">
        {/* Header */}
        <div className="ef-card-header">
          <Avatar
            name={evaluation.teamName || evaluation.team?.name || "Team"}
            size={38}
          />
          <div className="ef-card-headtext">
            <div className="ef-card-title">
              {evaluation.teamName || evaluation.team?.name || "Team"}
              {isOwnTeam && (
                <span
                  className="ef-status-pill ef-status-own"
                  style={{
                    background: T.tealLight,
                    color: T.teal,
                    fontSize: "8px",
                    padding: "1px 8px",
                    borderRadius: 12,
                  }}
                >
                  YOUR TEAM
                </span>
              )}
              <span
                className={`ef-status-pill ef-status-${evaluation.status || "draft"}`}
              >
                {evaluation.status || "draft"}
              </span>
            </div>
            <div className="ef-card-meta">
              <FiCalendar size={10} />
              {new Date(evaluation.createdAt).toLocaleDateString()} ·{" "}
              {timeAgo(evaluation.createdAt)}
              {evaluation.evaluatedBy
                ? ` · ${te("by", "by")} ${evaluation.evaluatedBy}`
                : ""}
            </div>
          </div>
          <div
            className="ef-score-wrap"
            onDoubleClick={handleDoubleTapLike}
            title={te("doubleTapLike", "Double-click to like")}
          >
            <ScoreRing score={score} />
            {burstHeart && <FiHeart className="ef-heart-burst" size={40} />}
          </div>
        </div>

        {/* Member score chips */}
        {Array.isArray(evaluation.totalScores) &&
          evaluation.totalScores.length > 0 && (
            <div className="ef-score-strip">
              {evaluation.totalScores.slice(0, 10).map((s, i) => {
                const val = s.total ?? s.score ?? 0;
                return (
                  <div className="ef-score-chip" key={i}>
                    <span className="ef-score-chip-name">
                      {s.name || s.member || `#${i + 1}`}
                    </span>
                    <div className="ef-score-chip-bar">
                      <div
                        className="ef-score-chip-fill"
                        style={{ width: `${Math.min(val, 100)}%` }}
                      />
                    </div>
                    <span className="ef-score-chip-val">{val}</span>
                  </div>
                );
              })}
            </div>
          )}

        {/* Reaction summary */}
        <div className="ef-summary-row">
          <ReactionCluster
            groups={groups}
            total={totalReactions}
            onClick={() => setCommentsOpen(true)}
          />
          {comments.length > 0 && (
            <button
              className="ef-summary-comments"
              onClick={() => setCommentsOpen((v) => !v)}
            >
              {comments.length}{" "}
              {comments.length === 1
                ? te("comment", "comment")
                : te("comments", "comments")}
            </button>
          )}
        </div>

        {/* Action bar - CONDITIONALLY RENDERED BASED ON PERMISSIONS */}
        <div className="ef-actions">
          {canReact ? (
            <>
              <button
                className={`ef-action-btn${iLiked ? " ef-action-active ef-action-like" : ""}`}
                onClick={() => onLike(evaluation._id)}
              >
                <FiHeart size={16} fill={iLiked ? "currentColor" : "none"} />
                {te("like", "Like")}
              </button>

              <div className="ef-picker-wrap" ref={pickerRef}>
                <button
                  className={`ef-action-btn${myReaction && myReaction !== LIKE_EMOJI ? " ef-action-active" : ""}`}
                  onClick={() => setOpenPicker((v) => !v)}
                >
                  <FiSmile size={16} />
                  {te("react", "React")}
                </button>
                {openPicker && (
                  <div className="ef-picker">
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        className="ef-picker-emoji"
                        onClick={() => {
                          onReact(evaluation._id, emoji);
                          setOpenPicker(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="ef-action-btn"
                onClick={() => setCommentsOpen((v) => !v)}
              >
                <FiMessageCircle size={16} />
                {te("comment", "Comment")}
              </button>
            </>
          ) : (
            <span
              className="ef-action-btn ef-action-disabled"
              style={{ color: T.inkLight, cursor: "not-allowed", opacity: 0.5 }}
            >
              <FiEye size={16} /> {te("viewOnly", "View Only")}
            </span>
          )}

          <button className="ef-action-btn" onClick={() => onShare(evaluation)}>
            <FiShare2 size={16} />
            {te("share", "Share")}
          </button>

          <button
            className={`ef-action-btn ef-action-bookmark${isBookmarked ? " ef-action-active" : ""}`}
            onClick={() => onToggleBookmark(evaluation._id)}
          >
            <FiBookmark
              size={16}
              fill={isBookmarked ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Comments - only show if user has permission to see them */}
        {commentsOpen && (
          <div className="ef-comments">
            {comments.length > 2 && !showAllComments && (
              <button
                className="ef-view-all"
                onClick={() => setShowAllComments(true)}
              >
                {te("viewAll", "View all")} {comments.length}{" "}
                {te("comments", "comments")}
              </button>
            )}
            {visibleComments.map((c) => (
              <CommentItem
                key={c._id}
                comment={c}
                canDelete={canDeleteComments(c)}
                onDelete={() => onDeleteComment(evaluation._id, c._id)}
                onReply={handleReply}
              />
            ))}
            {comments.length === 0 && (
              <div className="ef-no-comments">
                {te("noComments", "No comments yet — start the discussion.")}
              </div>
            )}

            {canComment && (
              <div className="ef-composer">
                <Avatar name={user?.name || "?"} size={28} />
                <input
                  ref={inputRef}
                  value={commentDraft || ""}
                  onChange={(e) =>
                    onDraftChange(evaluation._id, e.target.value)
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && onPostComment(evaluation._id)
                  }
                  placeholder={te("writeComment", "Write a comment…")}
                  className="ef-composer-input"
                  maxLength={500}
                />
                <button
                  className="ef-composer-send"
                  onClick={() => onPostComment(evaluation._id)}
                  disabled={
                    posting === evaluation._id || !(commentDraft || "").trim()
                  }
                >
                  {posting === evaluation._id ? (
                    <FiLoader className="ef-spin" size={14} />
                  ) : (
                    <FiSend size={14} />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function EvaluationFeed({ t }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const te = useCallback((key, fb = "") => t?.(`evaluation.${key}`) || fb, [t]);

  // Get user's team ID for permission checks
  const userTeamId = getUserTeamId(user);

  // Use utility functions for role checks
  const isAdmin = isAdminOrAbove(user);
  const isLeader = isLeaderOrAbove(user);
  const isSuperAdmin = user?.role === "superadmin";

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [posting, setPosting] = useState(null);
  // Bookmarks are read from localStorage synchronously via the lazy
  // initializer below — no effect needed to "sync" this in, since there's
  // no external subscription, just a one-time read on mount.
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const raw = localStorage.getItem(BOOKMARK_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      /* ignore malformed storage */
      return new Set();
    }
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [shareModal, setShareModal] = useState(null);

  // Load evaluations - only show evaluations user has access to
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        setLoading(true);
        let list = [];

        if (isAdmin || isSuperAdmin) {
          // Admins see all evaluations
          const res = await evaluationAPI.getAll();
          list = Array.isArray(res.data) ? res.data : [];
        } else if (isLeader) {
          // Leaders see their own team's evaluations + can view others
          const res = await evaluationAPI.getAll();
          list = Array.isArray(res.data) ? res.data : [];
          // Leaders can see all evaluations but with limited interaction on others
        } else {
          // Employees only see their own team's evaluations
          if (userTeamId) {
            const res = await evaluationAPI.getByTeam(userTeamId);
            list = Array.isArray(res.data) ? res.data : [];
          }
        }

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
  }, [userTeamId, isAdmin, isSuperAdmin, isLeader, showToast, te]);

  const persistBookmarks = useCallback((next) => {
    setBookmarks(next);
    try {
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next]));
    } catch {
      /* storage unavailable — bookmark still works for this session */
    }
  }, []);

  const toggleBookmark = useCallback(
    (id) => {
      const next = new Set(bookmarks);
      if (next.has(id)) {
        next.delete(id);
        showToast(te("bookmarkRemoved", "Removed from saved"), "info");
      } else {
        next.add(id);
        showToast(te("bookmarkAdded", "Saved"), "success");
      }
      persistBookmarks(next);
    },
    [bookmarks, persistBookmarks, showToast, te],
  );

  const react = useCallback(
    async (id, emoji) => {
      try {
        const res = await evaluationAPI.react(id, emoji);
        setEvaluations((prev) =>
          prev.map((e) => (e._id === id ? res.data : e)),
        );
      } catch (error) {
        showToast(error.response?.data?.message || "Failed to react", "error");
      }
    },
    [showToast],
  );

  const likeShortcut = useCallback((id) => react(id, LIKE_EMOJI), [react]);

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

  const handleDraftChange = useCallback((id, value) => {
    setCommentDrafts((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleShare = useCallback(
    async (evaluation) => setShareModal(evaluation),
    [],
  );

  const doShare = useCallback(
    async (evaluation) => {
      const url = `${window.location.origin}/evaluations/${evaluation._id}`;
      const title = `${evaluation.teamName || evaluation.team?.name || "Team"} evaluation`;
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch {
          /* user cancelled share sheet */
        }
      } else {
        try {
          await navigator.clipboard.writeText(url);
          showToast(te("linkCopied", "Link copied to clipboard"), "success");
        } catch {
          showToast(te("copyFailed", "Couldn't copy link"), "error");
        }
      }
      setShareModal(null);
    },
    [showToast, te],
  );

  const copyLink = useCallback(
    async (evaluation) => {
      const url = `${window.location.origin}/evaluations/${evaluation._id}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast(te("linkCopied", "Link copied to clipboard"), "success");
      } catch {
        showToast(te("copyFailed", "Couldn't copy link"), "error");
      }
      setShareModal(null);
    },
    [showToast, te],
  );

  // ── Derived stats ──────────────────────────────────────────
  const stats = useMemo(() => {
    const total = evaluations.length;
    const scores = evaluations.map(avgScore).filter((s) => s !== null);
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    const pending = evaluations.filter(
      (e) => (e.status || "draft") === "draft",
    ).length;
    const totalReactions = evaluations.reduce(
      (sum, e) => sum + (e.reactions || []).length,
      0,
    );
    return { total, avg, pending, totalReactions };
  }, [evaluations]);

  // ── Filtered + sorted feed ────────────────────────────────
  const feed = useMemo(() => {
    let list = evaluations;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.teamName || e.team?.name || "").toLowerCase().includes(q) ||
          (e.evaluatedBy || "").toLowerCase().includes(q),
      );
    }
    if (statusFilter === "bookmarked") {
      list = list.filter((e) => bookmarks.has(e._id));
    } else if (statusFilter !== "all") {
      list = list.filter((e) => (e.status || "draft") === statusFilter);
    }
    const sorted = [...list];
    if (sortBy === "score") {
      sorted.sort((a, b) => (avgScore(b) ?? -1) - (avgScore(a) ?? -1));
    } else if (sortBy === "discussed") {
      sorted.sort(
        (a, b) => (b.discussion?.length || 0) - (a.discussion?.length || 0),
      );
    } else {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return sorted;
  }, [evaluations, search, statusFilter, sortBy, bookmarks]);

  return (
    <div className="ef-page">
      {/* Header / Stats */}
      <div className="ef-hero">
        <div className="ef-hero-top">
          <FiAward size={22} color={T.brass} />
          <div>
            <div className="ef-hero-title">
              {te("title", "Team Evaluations")}
            </div>
            <div className="ef-hero-sub">
              {isAdmin || isSuperAdmin
                ? te(
                    "adminNotice",
                    "You have full access to all team evaluations.",
                  )
                : isLeader
                  ? te(
                      "leaderNotice",
                      "You can evaluate your own team and view others.",
                    )
                  : te(
                      "employeeNotice",
                      "Evaluations are completed by your Team Leader or Admin. React, comment, and follow along here.",
                    )}
            </div>
          </div>
        </div>
        <div className="ef-stats-row">
          <div className="ef-stat">
            <FiUsers size={13} color={T.teal} />
            <span className="ef-stat-val">{stats.total}</span>
            <span className="ef-stat-label">
              {te("statTotal", "Evaluations")}
            </span>
          </div>
          <div className="ef-stat">
            <FiTrendingUp size={13} color={T.brass} />
            <span className="ef-stat-val">{stats.avg ?? "—"}</span>
            <span className="ef-stat-label">{te("statAvg", "Avg score")}</span>
          </div>
          <div className="ef-stat">
            <FiCheckCircle size={13} color="#3D6B8C" />
            <span className="ef-stat-val">{stats.pending}</span>
            <span className="ef-stat-label">
              {te("statPending", "Pending")}
            </span>
          </div>
          <div className="ef-stat">
            <FiHeart size={13} color={T.clay} />
            <span className="ef-stat-val">{stats.totalReactions}</span>
            <span className="ef-stat-label">
              {te("statReactions", "Reactions")}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="ef-controls">
        <div className="ef-search">
          <FiSearch size={14} color={T.inkLight} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={te("searchPlaceholder", "Search team or evaluator…")}
          />
          {search && (
            <button className="ef-search-clear" onClick={() => setSearch("")}>
              <FiX size={13} />
            </button>
          )}
        </div>

        <div className="ef-chips">
          {[
            ["all", te("filterAll", "All")],
            ["draft", te("filterDraft", "Pending")],
            ["submitted", te("filterSubmitted", "Submitted")],
            ["approved", te("filterApproved", "Approved")],
            ["bookmarked", te("filterSaved", "Saved")],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`ef-chip${statusFilter === key ? " ef-chip-active" : ""}`}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ef-sort">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">{te("sortNewest", "Newest")}</option>
            <option value="score">{te("sortScore", "Highest score")}</option>
            <option value="discussed">
              {te("sortDiscussed", "Most discussed")}
            </option>
          </select>
          <FiChevronDown size={12} className="ef-sort-caret" />
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="ef-feed">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : feed.length === 0 ? (
        <EmptyState
          label={
            search || statusFilter !== "all"
              ? te("noMatches", "No evaluations match your filters.")
              : te("noEvaluations", "No evaluations have been posted yet.")
          }
          sub={
            search || statusFilter !== "all"
              ? te("tryDifferent", "Try a different search term or filter.")
              : te("checkBack", "Check back once your Team Leader submits one.")
          }
        />
      ) : (
        <div className="ef-feed">
          {feed.map((evaluation, i) => (
            <EvaluationCard
              key={evaluation._id}
              evaluation={evaluation}
              user={user}
              userTeamId={userTeamId}
              te={te}
              onReact={react}
              onLike={likeShortcut}
              onPostComment={postComment}
              onDeleteComment={removeComment}
              commentDraft={commentDrafts[evaluation._id]}
              onDraftChange={handleDraftChange}
              posting={posting}
              isBookmarked={bookmarks.has(evaluation._id)}
              onToggleBookmark={toggleBookmark}
              onShare={handleShare}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Share modal */}
      {shareModal && (
        <div className="ef-modal-backdrop" onClick={() => setShareModal(null)}>
          <div className="ef-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ef-modal-head">
              <span>{te("shareTitle", "Share evaluation")}</span>
              <button onClick={() => setShareModal(null)}>
                <FiX size={16} />
              </button>
            </div>
            <div className="ef-modal-team">
              <Avatar
                name={shareModal.teamName || shareModal.team?.name || "Team"}
                size={32}
              />
              <span>
                {shareModal.teamName || shareModal.team?.name || "Team"}
              </span>
            </div>
            <button
              className="ef-modal-btn ef-modal-btn-primary"
              onClick={() => doShare(shareModal)}
            >
              <FiShare2 size={14} /> {te("shareVia", "Share via…")}
            </button>
            <button
              className="ef-modal-btn"
              onClick={() => copyLink(shareModal)}
            >
              <FiCopy size={14} /> {te("copyLink", "Copy link")}
            </button>
          </div>
        </div>
      )}

      <style>{feedStyles}</style>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────
const feedStyles = `
 .ef-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 28px) clamp(20px, 6vw, 48px) 60px;
  font-family: ${T.sans};
  color: ${T.ink};
}

  /* HERO */
  .ef-hero {
    background: ${T.panel};
    border: 1px solid ${T.mist};
    border-radius: 16px;
    padding: 18px 20px;
    margin-bottom: 14px;
    box-shadow: 0 2px 12px rgba(14,36,28,0.05);
  }
  .ef-hero-top { display: flex; align-items: flex-start; gap: 12px; }
  .ef-hero-title { font-family: ${T.serif}; font-weight: 800; font-size: 19px; color: ${T.ink}; }
  .ef-hero-sub { font-size: 12.5px; color: ${T.inkSoft}; margin-top: 3px; line-height: 1.45; }
  .ef-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; }
  .ef-stat {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
    background: ${T.canvas}; border-radius: 10px; padding: 8px 10px;
  }
  .ef-stat-val { font-family: ${T.mono}; font-weight: 800; font-size: 17px; color: ${T.ink}; }
  .ef-stat-label { font-size: 9.5px; color: ${T.inkSoft}; font-weight: 600; }

  /* CONTROLS */
  .ef-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; align-items: center; }
  .ef-search {
    display: flex; align-items: center; gap: 6px;
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 10px;
    padding: 7px 10px; flex: 1 1 200px; min-width: 160px;
  }
  .ef-search input { border: none; outline: none; flex: 1; font-size: 12.5px; font-family: ${T.sans}; background: transparent; color: ${T.ink}; }
  .ef-search-clear { border: none; background: transparent; color: ${T.inkLight}; cursor: pointer; display: flex; }
  .ef-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .ef-chip {
    border: 1px solid ${T.mist}; background: ${T.panel}; color: ${T.inkSoft};
    font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 999px;
    cursor: pointer; transition: all 0.15s ease;
  }
  .ef-chip:hover { background: ${T.canvas}; }
  .ef-chip-active { background: ${T.teal}; border-color: ${T.teal}; color: #fff; }
  .ef-sort { position: relative; display: flex; align-items: center; }
  .ef-sort select {
    appearance: none; border: 1px solid ${T.mist}; background: ${T.panel};
    color: ${T.inkSoft}; font-size: 11.5px; font-weight: 600; padding: 7px 26px 7px 10px;
    border-radius: 10px; cursor: pointer; font-family: ${T.sans};
  }
  .ef-sort-caret { position: absolute; right: 9px; pointer-events: none; color: ${T.inkLight}; }

  /* FEED */
  .ef-feed { display: flex; flex-direction: column; gap: 14px; }

  /* CARD */
  .ef-card {
    background: ${T.panel};
    border: 1px solid ${T.mist};
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(14,36,28,0.05);
    animation: ef-card-in 0.4s ease both;
    transition: box-shadow 0.2s ease;
  }
  .ef-card:hover { box-shadow: 0 6px 20px -8px rgba(14,36,28,0.15); }
  @keyframes ef-card-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .ef-status-stripe { height: 3px; width: 100%; }
  .ef-card-inner { padding: 16px 18px 14px; }

  .ef-card-header { display: flex; align-items: flex-start; gap: 10px; }
  .ef-avatar {
    border-radius: 50%; color: #fff; font-weight: 800; font-family: ${T.mono};
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(10,59,42,0.2);
  }
  .ef-card-headtext { flex: 1; min-width: 0; }
  .ef-card-title { font-weight: 800; font-size: 15px; color: ${T.ink}; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ef-status-pill { font-size: 9.5px; font-weight: 700; text-transform: capitalize; padding: 2px 9px; border-radius: 999px; }
  .ef-status-approved { background: #DCFCE7; color: #16A34A; }
  .ef-status-submitted { background: #DBEAFE; color: #2563EB; }
  .ef-status-draft { background: ${T.clayLight}; color: ${T.brassDark}; }
  .ef-card-meta { font-size: 11px; color: ${T.inkSoft}; display: flex; align-items: center; gap: 5px; margin-top: 3px; }

  .ef-score-wrap { position: relative; cursor: pointer; flex-shrink: 0; }
  .ef-score-ring { position: relative; display: flex; align-items: center; justify-content: center; }
  .ef-score-ring svg { position: absolute; inset: 0; }
  .ef-score-ring-val { position: relative; font-family: ${T.mono}; font-weight: 800; font-size: 15px; }
  .ef-score-ring-empty { color: ${T.inkLight}; font-size: 12px; background: ${T.canvas}; border-radius: 50%; }
  .ef-heart-burst {
    position: absolute; top: 50%; left: 50%; color: ${T.clay};
    transform: translate(-50%, -50%) scale(0); pointer-events: none;
    animation: ef-heart-pop 0.7s ease forwards;
  }
  @keyframes ef-heart-pop {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    40% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
  }

  /* SCORE STRIP */
  .ef-score-strip { display: flex; gap: 8px; overflow-x: auto; margin-top: 14px; padding-bottom: 2px; }
  .ef-score-strip::-webkit-scrollbar { height: 3px; }
  .ef-score-strip::-webkit-scrollbar-thumb { background: ${T.mist}; border-radius: 3px; }
  .ef-score-chip {
    flex-shrink: 0; width: 96px; background: ${T.canvas}; border-radius: 10px;
    padding: 7px 9px; display: flex; flex-direction: column; gap: 4px;
  }
  .ef-score-chip-name { font-size: 10px; font-weight: 700; color: ${T.ink}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ef-score-chip-bar { height: 4px; border-radius: 2px; background: ${T.mist}; overflow: hidden; }
  .ef-score-chip-fill { height: 100%; background: linear-gradient(90deg, ${T.tealBright}, ${T.teal}); border-radius: 2px; }
  .ef-score-chip-val { font-family: ${T.mono}; font-size: 10.5px; font-weight: 800; color: ${T.inkSoft}; }

  /* SUMMARY ROW */
  .ef-summary-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 12px; padding-top: 10px; border-top: 1px solid ${T.mist};
  }
  .ef-reaction-cluster { display: flex; align-items: center; gap: 6px; border: none; background: transparent; cursor: pointer; padding: 2px 0; }
  .ef-reaction-bubbles { display: flex; }
  .ef-reaction-bubble {
    width: 20px; height: 20px; border-radius: 50%; background: ${T.panel};
    border: 1.5px solid ${T.panel}; box-shadow: 0 0 0 1px ${T.mist};
    display: flex; align-items: center; justify-content: center; font-size: 11px;
    margin-left: -6px;
  }
  .ef-reaction-bubble:first-child { margin-left: 0; }
  .ef-reaction-count { font-size: 11.5px; color: ${T.inkSoft}; font-weight: 600; }
  .ef-summary-comments { border: none; background: transparent; color: ${T.inkSoft}; font-size: 11.5px; font-weight: 600; cursor: pointer; }
  .ef-summary-comments:hover { color: ${T.teal}; text-decoration: underline; }

  /* ACTION BAR */
  .ef-actions { display: flex; align-items: center; gap: 2px; margin-top: 8px; border-top: 1px solid ${T.mist}; padding-top: 6px; }
  .ef-action-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    border: none; background: transparent; color: ${T.inkSoft};
    font-size: 12px; font-weight: 700; font-family: ${T.sans};
    padding: 8px 6px; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
  }
  .ef-action-btn:hover { background: ${T.canvas}; color: ${T.ink}; }
  .ef-action-active { color: ${T.teal}; }
  .ef-action-like.ef-action-active { color: ${T.clay}; }
  .ef-action-bookmark { flex: 0 0 auto; }
  .ef-action-bookmark.ef-action-active { color: ${T.brass}; }

  .ef-picker-wrap { position: relative; flex: 1; display: flex; }
  .ef-picker-wrap .ef-action-btn { width: 100%; }
  .ef-picker {
    position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%);
    background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 999px;
    box-shadow: 0 8px 24px rgba(14,36,28,0.15); padding: 6px 8px; display: flex; gap: 4px; z-index: 8;
  }
  .ef-picker-emoji {
    border: none; background: transparent; font-size: 19px; cursor: pointer; padding: 3px;
    transition: transform 0.12s ease; border-radius: 50%;
  }
  .ef-picker-emoji:hover { transform: scale(1.35) translateY(-2px); }

  /* COMMENTS */
  .ef-comments { margin-top: 10px; padding-top: 10px; border-top: 1px solid ${T.mist}; animation: ef-slide-down 0.2s ease; }
  @keyframes ef-slide-down { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .ef-view-all { border: none; background: transparent; color: ${T.inkSoft}; font-size: 11.5px; font-weight: 700; cursor: pointer; margin-bottom: 8px; }
  .ef-view-all:hover { color: ${T.teal}; }
  .ef-no-comments { font-size: 11.5px; color: ${T.inkLight}; font-style: italic; padding: 6px 0 10px; }

  .ef-comment { display: flex; gap: 8px; padding: 6px 0; }
  .ef-comment-body { flex: 1; min-width: 0; }
  .ef-comment-bubble { background: ${T.canvas}; border-radius: 14px; padding: 7px 12px; display: inline-block; max-width: 100%; }
  .ef-comment-name { font-weight: 800; font-size: 11.5px; color: ${T.ink}; margin-right: 6px; }
  .ef-comment-text { font-size: 12px; color: ${T.inkSoft}; word-break: break-word; }
  .ef-comment-meta { display: flex; align-items: center; gap: 10px; margin-top: 3px; padding-left: 12px; }
  .ef-comment-meta span { font-size: 10px; color: ${T.inkLight}; }
  .ef-comment-action { border: none; background: transparent; color: ${T.inkLight}; font-size: 10.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 3px; }
  .ef-comment-action:hover { color: ${T.teal}; }
  .ef-comment-delete:hover { color: ${T.clay}; }

  .ef-composer { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
  .ef-composer-input {
    flex: 1; padding: 8px 12px; border-radius: 999px; border: 1px solid ${T.mist};
    font-size: 12.5px; font-family: ${T.sans}; outline: none; background: ${T.canvas}; color: ${T.ink};
  }
  .ef-composer-input:focus { border-color: ${T.teal}; background: ${T.panel}; }
  .ef-composer-send {
    width: 32px; height: 32px; border-radius: 50%; border: none; flex-shrink: 0;
    background: ${T.teal}; color: #fff; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.15s ease;
  }
  .ef-composer-send:disabled { background: ${T.mist}; cursor: not-allowed; }
  .ef-composer-send:not(:disabled):hover { background: ${T.tealDeep}; }
  .ef-spin { animation: ef-spin 0.9s linear infinite; }
  @keyframes ef-spin { to { transform: rotate(360deg); } }

  /* SKELETON */
  .ef-skeleton { padding: 16px 18px; }
  .ef-skeleton-row { display: flex; align-items: center; gap: 10px; }
  .ef-skeleton-block {
    background: linear-gradient(90deg, ${T.canvas} 25%, ${T.canvasDeep} 37%, ${T.canvas} 63%);
    background-size: 400% 100%; border-radius: 6px; animation: ef-shimmer 1.4s ease infinite;
  }
  .ef-skeleton-circle { width: 38px; height: 38px; border-radius: 50%; }
  @keyframes ef-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

  /* EMPTY STATE */
  .ef-empty { text-align: center; padding: 56px 20px; background: ${T.panel}; border: 1px dashed ${T.mist}; border-radius: 16px; }
  .ef-empty-icon {
    width: 52px; height: 52px; border-radius: 50%; background: ${T.canvas}; color: ${T.inkLight};
    display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;
  }
  .ef-empty-title { font-weight: 700; font-size: 14px; color: ${T.ink}; }
  .ef-empty-sub { font-size: 12px; color: ${T.inkSoft}; margin-top: 4px; }

  /* SHARE MODAL */
  .ef-modal-backdrop {
    position: fixed; inset: 0; background: rgba(14,36,28,0.4); backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px;
    animation: ef-fade-in 0.15s ease;
  }
  @keyframes ef-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .ef-modal {
    background: ${T.panel}; border-radius: 16px; padding: 18px; width: 100%; max-width: 340px;
    box-shadow: 0 20px 60px rgba(14,36,28,0.3); animation: ef-modal-in 0.2s ease;
  }
  @keyframes ef-modal-in { from { transform: translateY(10px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
  .ef-modal-head { display: flex; align-items: center; justify-content: space-between; font-weight: 800; font-size: 14px; margin-bottom: 14px; }
  .ef-modal-head button { border: none; background: transparent; color: ${T.inkSoft}; cursor: pointer; }
  .ef-modal-team { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; font-weight: 700; font-size: 13px; }
  .ef-modal-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    border: 1px solid ${T.mist}; background: ${T.panel}; color: ${T.ink};
    font-weight: 700; font-size: 12.5px; padding: 10px; border-radius: 10px; cursor: pointer; margin-top: 8px;
  }
  .ef-modal-btn:hover { background: ${T.canvas}; }
  .ef-modal-btn-primary { background: ${T.teal}; border-color: ${T.teal}; color: #fff; margin-top: 0; }
  .ef-modal-btn-primary:hover { background: ${T.tealDeep}; }
  .ef-action-disabled { cursor: not-allowed; opacity: 0.5; }

  /* RESPONSIVE */
  @media (max-width: 560px) {
    .ef-stats-row { grid-template-columns: repeat(2, 1fr); }
    .ef-action-btn span, .ef-action-btn { font-size: 11px; }
    .ef-score-chip { width: 84px; }
    .ef-controls { flex-direction: column; align-items: stretch; }
  }
`;
