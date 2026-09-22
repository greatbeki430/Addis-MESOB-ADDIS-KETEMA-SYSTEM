// frontend/src/components/forum-report/ForumReportHistory.jsx
//
// History tab for the Peer Forum Report.
//
// Why this is its own tab and not folded into the existing Feed:
// Feed is a social surface — you read what your teammates submitted
// and react to it. History is a functional surface — you find a saved
// report and reopen it in the form to correct it. DailyReport and
// Evaluation keep those two concerns on separate tabs; Forum Report
// now matches that convention.
//
// Permission model, mirrored on the backend (see PUT and DELETE in
// meetingRoutes.js):
//   • Members     → see the whole team's reports but can only OPEN
//                   and DELETE their OWN drafts.
//   • Team leaders → can OPEN and DELETE anything on their team that
//                   isn't locked.
//   • Admins      → can do anything.

import { useState, useEffect, useMemo, useCallback } from "react";
import { meetingAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import {
  isAdminOrAbove,
  isLeaderOrAbove,
  getUserTeamId,
} from "../../utils/roles";
import {
  FiLoader,
  FiSearch,
  FiX,
  FiEdit3,
  FiTrash2,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiLock,
  FiClock,
  FiInbox,
  FiEye,
} from "react-icons/fi";

// ── Design tokens (matches EvaluationFeed.jsx) ─────────────
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

// ── Helpers ────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return "just now";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "just now";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

// Turn the model's status enum into a visual badge.
function statusVisual(report) {
  const s = report.status || "in_progress";
  if (report.isLocked || s === "locked") {
    return {
      label: "Locked",
      bg: "#FEF2F2",
      fg: "#991B1B",
      icon: <FiLock size={11} />,
    };
  }
  if (s === "completed") {
    return {
      label: "Completed",
      bg: "#DCFCE7",
      fg: "#16A34A",
      icon: <FiCheckCircle size={11} />,
    };
  }
  if (s === "expired") {
    return {
      label: "Time expired",
      bg: "#FEF3C7",
      fg: "#92400E",
      icon: <FiClock size={11} />,
    };
  }
  if (s === "auto_saved") {
    return {
      label: "Auto-saved",
      bg: "#DBEAFE",
      fg: "#1D4ED8",
      icon: <FiRefreshCw size={11} />,
    };
  }
  return {
    label: "Draft",
    bg: T.clayLight,
    fg: T.brassDark,
    icon: <FiEdit3 size={11} />,
  };
}

// One row of the History list.
function HistoryRow({
  report,
  canOpen,
  canDelete,
  onOpen,
  onDelete,
  deleting,
}) {
  const status = statusVisual(report);
  const topics = Array.isArray(report.topics)
    ? report.topics.filter(Boolean)
    : [];
  const present = Array.isArray(report.present)
    ? report.present.filter(Boolean)
    : [];
  const agreements = Array.isArray(report.agreements)
    ? report.agreements.filter(Boolean)
    : [];
  const gaps = Array.isArray(report.gaps) ? report.gaps.filter(Boolean) : [];
  const authorName =
    report.createdByName || report.createdBy?.name || "Unknown";

  return (
    <article className="fr-history-row">
      <div className="fr-history-stripe" style={{ background: status.fg }} />
      <div className="fr-history-body">
        <header className="fr-history-head">
          <div className="fr-history-title-row">
            <FiFileText size={15} color={T.teal} />
            <span className="fr-history-title">
              {report.teamName || "Untitled Report"}
            </span>
            <span
              className="fr-history-pill"
              style={{ background: status.bg, color: status.fg }}
            >
              {status.icon}
              {status.label}
            </span>
          </div>
          <div className="fr-history-meta">
            <FiCalendar size={11} />
            {formatDate(report.date)}
            <span className="fr-history-dot">·</span>
            <span>by {authorName}</span>
            <span className="fr-history-dot">·</span>
            <span>updated {timeAgo(report.updatedAt || report.createdAt)}</span>
          </div>
        </header>

        <div className="fr-history-stats">
          <span className="fr-history-stat">
            <FiUsers size={11} /> {present.length} present
          </span>
          <span className="fr-history-stat">
            <FiFileText size={11} /> {topics.length} topics
          </span>
          <span className="fr-history-stat">
            <FiCheckCircle size={11} /> {agreements.length} agreements
          </span>
          {gaps.length > 0 && (
            <span className="fr-history-stat">
              <FiAlertCircle size={11} /> {gaps.length} gaps
            </span>
          )}
        </div>

        {topics.length > 0 && (
          <div className="fr-history-topics">
            {topics.slice(0, 2).map((topic, i) => (
              <span key={i} className="fr-history-topic">
                {topic.length > 60 ? topic.substring(0, 60) + "…" : topic}
              </span>
            ))}
            {topics.length > 2 && (
              <span className="fr-history-topic fr-history-topic-more">
                +{topics.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="fr-history-actions">
          {canOpen ? (
            <button
              type="button"
              className="fr-history-btn fr-history-btn-primary"
              onClick={() => onOpen(report)}
            >
              <FiEdit3 size={13} />
              Open
            </button>
          ) : (
            <span
              className="fr-history-btn fr-history-btn-muted"
              title="You can't reopen this report — only drafts you authored are editable, and leaders can reopen unlocked reports on their team."
            >
              <FiEye size={13} />
              View only
            </span>
          )}
          {canDelete && (
            <button
              type="button"
              className="fr-history-btn fr-history-btn-danger"
              onClick={() => onDelete(report)}
              disabled={deleting}
            >
              {deleting ? (
                <FiLoader size={13} className="fr-history-spin" />
              ) : (
                <FiTrash2 size={13} />
              )}
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyState({ filtered }) {
  return (
    <div className="fr-history-empty">
      <div className="fr-history-empty-icon">
        <FiInbox size={26} />
      </div>
      <div className="fr-history-empty-title">
        {filtered ? "No reports match your filters." : "No saved reports yet."}
      </div>
      <div className="fr-history-empty-sub">
        {filtered
          ? "Try a different search or filter."
          : "Save a report from the New Report tab and it will appear here."}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function ForumReportHistory({
  teamId,
  onOpenReport,
  onCountChange,
  refreshKey = 0,
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const userTeamId = teamId || getUserTeamId(user);
  const isAdmin = isAdminOrAbove(user);
  const isLeader = isLeaderOrAbove(user);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterKey, setFilterKey] = useState("all"); // all | mine | drafts

  const load = useCallback(
    async (showSpinner = true) => {
      try {
        if (showSpinner) setLoading(true);
        else setRefreshing(true);

        let list = [];

        if (isAdmin && !userTeamId) {
          const res = await meetingAPI.getAll({ limit: 200 });
          list = Array.isArray(res.data) ? res.data : res.data?.meetings || [];
        } else if (userTeamId) {
          const res = await meetingAPI.getByTeam(userTeamId, { limit: 200 });
          list = Array.isArray(res.data) ? res.data : res.data?.meetings || [];
        }

        list.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0),
        );

        setReports(list);
        if (onCountChange) onCountChange(list.length);
      } catch (err) {
        console.error("[History] load failed:", err);
        showToast("Failed to load saved reports", "error");
        setReports([]);
        if (onCountChange) onCountChange(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userTeamId, isAdmin, onCountChange, showToast],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => load(true), 0);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTeamId, isAdmin, refreshKey]);

  const handleRefresh = useCallback(() => load(false), [load]);

  const handleDelete = useCallback(
    async (report) => {
      const confirmed = window.confirm(
        "Delete this saved report? This cannot be undone.",
      );
      if (!confirmed) return;

      try {
        setDeletingId(report._id);
        await meetingAPI.delete(report._id);
        setReports((prev) => prev.filter((r) => r._id !== report._id));
        if (onCountChange) {
          onCountChange((prev) => Math.max(0, prev - 1));
        }
        showToast("Report deleted", "success");
      } catch (err) {
        console.error("[History] delete failed:", err);
        showToast(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to delete report",
          "error",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [onCountChange, showToast],
  );

  // Permission helpers — kept in one place so row actions and the
  // backend enforcement can be compared side by side.
  const canOpen = useCallback(
    (report) => {
      if (isAdmin) return true;

      const createdById = report.createdBy?._id || report.createdBy;
      const isOwner = createdById && String(createdById) === String(user?._id);

      const reportTeamId = report.team?._id || report.team;
      const sameTeam =
        userTeamId &&
        reportTeamId &&
        String(reportTeamId) === String(userTeamId);

      const isLocked = report.isLocked === true || report.status === "locked";
      const isDraft =
        report.status === "in_progress" || report.status === "auto_saved";

      if (isOwner && isDraft && !isLocked) return true;
      if (isLeader && sameTeam && !isLocked) return true;

      return false;
    },
    [isAdmin, isLeader, user, userTeamId],
  );

  const canDelete = useCallback(
    (report) => {
      if (isAdmin) return true;

      const createdById = report.createdBy?._id || report.createdBy;
      const isOwner = createdById && String(createdById) === String(user?._id);

      const reportTeamId = report.team?._id || report.team;
      const sameTeam =
        userTeamId &&
        reportTeamId &&
        String(reportTeamId) === String(userTeamId);

      const isDraft =
        report.status === "in_progress" || report.status === "auto_saved";

      if (isOwner && isDraft) return true;
      if (isLeader && sameTeam) return true;

      return false;
    },
    [isAdmin, isLeader, user, userTeamId],
  );

  const filtered = useMemo(() => {
    let list = reports;

    if (filterKey === "mine") {
      list = list.filter((r) => {
        const createdById = r.createdBy?._id || r.createdBy;
        return createdById && String(createdById) === String(user?._id);
      });
    } else if (filterKey === "drafts") {
      list = list.filter(
        (r) => r.status === "in_progress" || r.status === "auto_saved",
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const haystack = [
          r.teamName || "",
          r.explanation || "",
          ...(r.topics || []),
          ...(r.present || []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return list;
  }, [reports, filterKey, search, user]);

  const chips = [
    { key: "all", label: "All" },
    { key: "mine", label: "Mine" },
    { key: "drafts", label: "Drafts" },
  ];

  return (
    <div className="fr-history-root">
      <div className="fr-history-controls">
        <div className="fr-history-search">
          <FiSearch size={14} color={T.inkLight} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved reports by team, topic, or attendee…"
          />
          {search && (
            <button
              type="button"
              className="fr-history-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <FiX size={13} />
            </button>
          )}
        </div>

        <div className="fr-history-chips">
          {chips.map((c) => (
            <button
              type="button"
              key={c.key}
              className={`fr-history-chip${
                filterKey === c.key ? " fr-history-chip-active" : ""
              }`}
              onClick={() => setFilterKey(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="fr-history-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh"
        >
          <FiRefreshCw
            size={14}
            className={refreshing ? "fr-history-spin" : ""}
          />
        </button>
      </div>

      {loading ? (
        <div className="fr-history-loading">
          <FiLoader size={22} className="fr-history-spin" />
          <span>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filtered={Boolean(search || filterKey !== "all")} />
      ) : (
        <div className="fr-history-list">
          {filtered.map((report) => (
            <HistoryRow
              key={report._id}
              report={report}
              canOpen={canOpen(report)}
              canDelete={canDelete(report)}
              onOpen={onOpenReport}
              onDelete={handleDelete}
              deleting={deletingId === report._id}
            />
          ))}
        </div>
      )}

      <style>{historyStyles}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────
const historyStyles = `
.fr-history-root {
  display: flex; flex-direction: column; gap: 14px; font-family: ${T.sans};
}

.fr-history-controls {
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
}
.fr-history-search {
  display: flex; align-items: center; gap: 6px;
  background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 10px;
  padding: 7px 10px; flex: 1 1 240px;
}
.fr-history-search input {
  border: none; outline: none; flex: 1; font-size: 12.5px;
  font-family: ${T.sans}; background: transparent; color: ${T.ink};
}
.fr-history-search-clear {
  border: none; background: transparent; color: ${T.inkLight};
  cursor: pointer; display: flex;
}
.fr-history-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.fr-history-chip {
  border: 1px solid ${T.mist}; background: ${T.panel}; color: ${T.inkSoft};
  font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 999px;
  cursor: pointer; transition: all 0.15s ease; font-family: ${T.sans};
}
.fr-history-chip:hover { background: ${T.canvas}; }
.fr-history-chip-active {
  background: ${T.teal}; border-color: ${T.teal}; color: #fff;
}
.fr-history-refresh {
  border: 1px solid ${T.mist}; background: ${T.panel}; color: ${T.inkSoft};
  width: 34px; height: 34px; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.fr-history-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
.fr-history-refresh:hover:not(:disabled) { background: ${T.canvas}; }

.fr-history-list { display: flex; flex-direction: column; gap: 10px; }

.fr-history-row {
  position: relative; overflow: hidden;
  background: ${T.panel}; border: 1px solid ${T.mist}; border-radius: 14px;
  box-shadow: 0 1px 3px rgba(14,36,28,0.05);
  animation: fr-history-in 0.3s ease both;
  transition: box-shadow 0.2s ease;
}
.fr-history-row:hover {
  box-shadow: 0 6px 20px -8px rgba(14,36,28,0.15);
}
@keyframes fr-history-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.fr-history-stripe { height: 3px; width: 100%; }
.fr-history-body { padding: 14px 16px 12px; }

.fr-history-head { display: flex; flex-direction: column; gap: 4px; }
.fr-history-title-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.fr-history-title {
  font-weight: 800; font-size: 14.5px; color: ${T.ink};
}
.fr-history-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9.5px; font-weight: 700; padding: 2px 9px; border-radius: 999px;
}
.fr-history-meta {
  font-size: 11.5px; color: ${T.inkSoft};
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
}
.fr-history-dot { opacity: 0.4; }

.fr-history-stats {
  display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px;
  font-size: 11px; color: ${T.inkSoft}; font-weight: 600;
}
.fr-history-stat { display: inline-flex; align-items: center; gap: 4px; }

.fr-history-topics {
  display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;
}
.fr-history-topic {
  font-size: 11px; background: ${T.tealLight}; color: ${T.teal};
  padding: 3px 10px; border-radius: 999px; font-weight: 600;
  max-width: 280px; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap;
}
.fr-history-topic-more {
  background: ${T.canvas}; color: ${T.inkSoft};
}

.fr-history-actions {
  display: flex; gap: 8px; margin-top: 12px; padding-top: 10px;
  border-top: 1px solid ${T.mist}; flex-wrap: wrap;
}
.fr-history-btn {
  border: none; border-radius: 8px; padding: 6px 14px;
  font-size: 12px; font-weight: 700; font-family: ${T.sans};
  cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
  transition: opacity 0.15s ease, background 0.15s ease;
}
.fr-history-btn-primary { background: ${T.teal}; color: #fff; }
.fr-history-btn-primary:hover { background: ${T.tealDeep}; }
.fr-history-btn-danger { background: #FEF2F2; color: #991B1B; }
.fr-history-btn-danger:hover { background: #FECACA; }
.fr-history-btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.fr-history-btn-muted {
  background: ${T.canvas}; color: ${T.inkLight}; cursor: not-allowed;
}

.fr-history-loading {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 40px; color: ${T.inkSoft}; font-size: 13px;
}
.fr-history-empty {
  text-align: center; padding: 52px 20px;
  background: ${T.panel}; border: 1px dashed ${T.mist}; border-radius: 14px;
}
.fr-history-empty-icon {
  width: 52px; height: 52px; border-radius: 50%; background: ${T.canvas};
  color: ${T.inkLight};
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
}
.fr-history-empty-title { font-weight: 700; font-size: 14px; color: ${T.ink}; }
.fr-history-empty-sub { font-size: 12px; color: ${T.inkSoft}; margin-top: 4px; }

.fr-history-spin { animation: fr-history-spin 0.9s linear infinite; }
@keyframes fr-history-spin { to { transform: rotate(360deg); } }
`;
