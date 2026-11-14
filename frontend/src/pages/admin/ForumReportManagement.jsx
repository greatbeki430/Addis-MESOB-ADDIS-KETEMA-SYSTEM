// frontend/src/pages/admin/ForumReportManagement.jsx
import { useState, useEffect, useCallback } from "react";
import {
  FiMessageSquare,
  FiAward,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiLoader,
  FiInfo,
} from "react-icons/fi";
import AdminDataManagement from "./AdminDataManagement";
import Leaderboard from "../Leaderboard";
import { C, F, FONT_SIZES, radius } from "../../styles/theme";
import { forumReportService } from "../../services/forumReportService";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { isAdminOrAbove } from "../../utils/roles";
import { forumReportTranslations } from "../../constants/translations/forumReport";

// ─── Translation lookup (admin scope, English-only)
// The Extensions tab is admin/superadmin-only. The brief's D3 mandate
// was that no raw translation keys appear on screen — so every literal
// is looked up through this helper, which reads the same
// forumReportTranslations table used by ForumReport.jsx. Language
// defaults to English (admins in this app commonly prefer English for
// audit work), but the same keys exist in en/am/om if the caller wants
// to pass a `lang` prop later. Fallback string is the third arg.
const makeT = (lang = "en") => {
  const dict =
    forumReportTranslations[lang]?.forum || forumReportTranslations.en.forum;
  return (key, fallback) => dict[key] ?? fallback;
};

// ─── Status pill ─────────────────────────────────────────────
const STATUS_STYLES = {
  pending: { bg: "#FEF3C7", fg: "#92400E" },
  approved: { bg: "#DCFCE7", fg: "#15803D" },
  rejected: { bg: "#FEE2E2", fg: "#991B1B" },
};

const StatusPill = ({ status, t }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const label =
    status === "approved"
      ? t("extensionRequestStatusApproved", "Approved")
      : status === "rejected"
        ? t("extensionRequestStatusRejected", "Rejected")
        : t("extensionRequestStatusPending", "Pending");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: s.bg,
        color: s.fg,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 9px",
        borderRadius: 999,
      }}
    >
      {status === "approved" ? (
        <FiCheckCircle size={11} />
      ) : status === "rejected" ? (
        <FiXCircle size={11} />
      ) : (
        <FiClock size={11} />
      )}
      {label}
    </span>
  );
};

// ─── One request row ─────────────────────────────────────────
const ExtensionRow = ({ request, t, onApprove, onReject, busy }) => {
  const [mode, setMode] = useState(null); // null | "approve" | "reject"
  const [note, setNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMode(null);
    setNote("");
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await onApprove(request._id, note);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (submitting) return;
    if (!rejectionReason.trim()) {
      // Backend enforces this too; catch it here for immediate feedback.
      return;
    }
    try {
      setSubmitting(true);
      await onReject(request._id, rejectionReason.trim(), note);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const requesterName =
    request.requestedBy?.name ||
    request.requestedByName ||
    t("notAssigned", "Unknown");
  const teamName =
    request.meetingId?.teamName ||
    request.teamName ||
    t("noDepartment", "Unknown team");
  const createdAt = request.createdAt
    ? new Date(request.createdAt).toLocaleString()
    : "—";
  const requestedMinutes =
    request.requestedDuration != null ? request.requestedDuration : "—";

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${C.border}`,
        borderRadius: radius.lg,
        padding: 14,
        marginBottom: 10,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: FONT_SIZES.body,
              color: C.dark,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {teamName}
          </span>
          <StatusPill status={request.status} t={t} />
        </div>
        <div
          style={{
            fontSize: FONT_SIZES.small,
            color: C.muted,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            <strong style={{ color: C.dark }}>
              {t("extensionRequestedBy", "Requested by")}:
            </strong>{" "}
            {requesterName}
          </span>
          <span>
            <strong style={{ color: C.dark }}>
              {t("extensionRequestedMinutes", "Requested minutes")}:
            </strong>{" "}
            {requestedMinutes}
          </span>
          <span>
            <strong style={{ color: C.dark }}>
              {t("extensionRequestedAt", "Requested")}:
            </strong>{" "}
            {createdAt}
          </span>
        </div>
      </div>

      {/* Reason */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 2,
          }}
        >
          {t("extensionReason", "Reason")}
        </div>
        <div
          style={{
            fontSize: FONT_SIZES.small,
            color: C.dark,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {request.reason || "—"}
        </div>
      </div>

      {/* Existing admin notes (for already-decided rows) */}
      {request.adminNotes && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 2,
            }}
          >
            {t("extensionAdminNotes", "Admin notes")}
          </div>
          <div
            style={{
              fontSize: FONT_SIZES.small,
              color: C.dark,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {request.adminNotes}
          </div>
        </div>
      )}

      {request.rejectionReason && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#991B1B",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 2,
            }}
          >
            {t("extensionRejectReasonLabel", "Rejection reason")}
          </div>
          <div
            style={{
              fontSize: FONT_SIZES.small,
              color: "#991B1B",
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {request.rejectionReason}
          </div>
        </div>
      )}

      {/* Actions — only for pending requests */}
      {request.status === "pending" && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px dashed ${C.border}`,
          }}
        >
          {mode === null && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => setMode("approve")}
                disabled={busy}
                style={{
                  background: "#15803D",
                  color: "#fff",
                  border: "none",
                  padding: "7px 16px",
                  borderRadius: radius.md,
                  fontWeight: 700,
                  fontSize: FONT_SIZES.small,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiCheckCircle size={14} />
                {t("extensionApprove", "Approve")}
              </button>
              <button
                onClick={() => setMode("reject")}
                disabled={busy}
                style={{
                  background: "#991B1B",
                  color: "#fff",
                  border: "none",
                  padding: "7px 16px",
                  borderRadius: radius.md,
                  fontWeight: 700,
                  fontSize: FONT_SIZES.small,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.6 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiXCircle size={14} />
                {t("extensionReject", "Reject")}
              </button>
            </div>
          )}

          {mode === "approve" && (
            <div>
              <label
                style={{
                  fontSize: FONT_SIZES.small,
                  fontWeight: 600,
                  color: C.dark,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                {t("extensionApproveNoteLabel", "Approval note (optional)")}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  fontSize: FONT_SIZES.small,
                  fontFamily: F.sans,
                  borderRadius: radius.md,
                  border: `1px solid ${C.border}`,
                  minHeight: 60,
                  resize: "vertical",
                }}
                disabled={submitting}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  style={{
                    background: "#15803D",
                    color: "#fff",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: radius.md,
                    fontWeight: 700,
                    fontSize: FONT_SIZES.small,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting
                    ? t("saving", "Saving...")
                    : t("extensionApprove", "Approve")}
                </button>
                <button
                  onClick={reset}
                  disabled={submitting}
                  style={{
                    background: "transparent",
                    color: C.muted,
                    border: `1px solid ${C.border}`,
                    padding: "6px 14px",
                    borderRadius: radius.md,
                    fontWeight: 600,
                    fontSize: FONT_SIZES.small,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {t("cancel", "Cancel")}
                </button>
              </div>
            </div>
          )}

          {mode === "reject" && (
            <div>
              <label
                style={{
                  fontSize: FONT_SIZES.small,
                  fontWeight: 600,
                  color: C.dark,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                {t("extensionRejectReasonLabel", "Rejection reason")}{" "}
                <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  fontSize: FONT_SIZES.small,
                  fontFamily: F.sans,
                  borderRadius: radius.md,
                  border: `1px solid ${rejectionReason.trim() ? C.primary : C.border}`,
                  minHeight: 60,
                  resize: "vertical",
                }}
                disabled={submitting}
              />
              {!rejectionReason.trim() && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#991B1B",
                    marginTop: 2,
                  }}
                >
                  {t(
                    "extensionRejectReasonRequired",
                    "Rejection reason is required.",
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleReject}
                  disabled={submitting || !rejectionReason.trim()}
                  style={{
                    background: "#991B1B",
                    color: "#fff",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: radius.md,
                    fontWeight: 700,
                    fontSize: FONT_SIZES.small,
                    cursor:
                      submitting || !rejectionReason.trim()
                        ? "not-allowed"
                        : "pointer",
                    opacity: submitting || !rejectionReason.trim() ? 0.6 : 1,
                  }}
                >
                  {submitting
                    ? t("saving", "Saving...")
                    : t("extensionReject", "Reject")}
                </button>
                <button
                  onClick={reset}
                  disabled={submitting}
                  style={{
                    background: "transparent",
                    color: C.muted,
                    border: `1px solid ${C.border}`,
                    padding: "6px 14px",
                    borderRadius: radius.md,
                    fontWeight: 600,
                    fontSize: FONT_SIZES.small,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {t("cancel", "Cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Extensions panel ─────────────────────────────────────────
const ExtensionsPanel = ({ t, onPendingCountChange }) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState("pending"); // pending | approved | rejected | all
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    async (showSpinner = true) => {
      try {
        if (showSpinner) setLoading(true);
        else setRefreshing(true);
        const data = await forumReportService.getExtensionRequests(
          status === "all" ? "" : status,
        );
        const list = Array.isArray(data?.requests) ? data.requests : [];
        setRequests(list);
        // Pending count is only meaningful when we're on the pending
        // filter or when we've fetched the full list. Recompute from
        // the full list when status === "all"; otherwise do a cheap
        // pending-only fetch to keep the badge live without extra
        // chatter.
        if (status === "pending" || status === "all") {
          const count = list.filter((r) => r.status === "pending").length;
          if (onPendingCountChange) onPendingCountChange(count);
        } else {
          try {
            const pendingData =
              await forumReportService.getExtensionRequests("pending");
            const pendingList = Array.isArray(pendingData?.requests)
              ? pendingData.requests
              : [];
            if (onPendingCountChange) onPendingCountChange(pendingList.length);
          } catch {
            /* non-critical — keep badge as-is */
          }
        }
      } catch (err) {
        console.error("[Extensions] load failed:", err);
        showToast(
          err?.response?.data?.message ||
            t("extensionNoRequests", "Failed to load extension requests"),
          "error",
        );
        setRequests([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status, onPendingCountChange, showToast, t],
  );

  useEffect(() => {
    const id = setTimeout(() => load(true), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApprove = async (id, adminNotes) => {
    setBusyId(id);
    try {
      await forumReportService.approveExtension(id, adminNotes || "");
      showToast(
        t("extensionApproveSuccess", "✅ Extension approved"),
        "success",
      );
      await load(false);
    } catch (err) {
      console.error("[Extensions] approve failed:", err);
      showToast(
        err?.response?.data?.message ||
          t("extensionRejectError", "Failed to approve"),
        "error",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id, rejectionReason, adminNotes) => {
    setBusyId(id);
    try {
      await forumReportService.rejectExtension(
        id,
        rejectionReason,
        adminNotes || "",
      );
      showToast(t("extensionRejectSuccess", "Extension rejected"), "success");
      await load(false);
    } catch (err) {
      console.error("[Extensions] reject failed:", err);
      showToast(
        err?.response?.data?.message ||
          t("extensionRejectError", "Failed to reject"),
        "error",
      );
    } finally {
      setBusyId(null);
    }
  };

  const filterChips = [
    { key: "pending", label: t("extensionFilterPending", "Pending") },
    { key: "approved", label: t("extensionFilterApproved", "Approved") },
    { key: "rejected", label: t("extensionFilterRejected", "Rejected") },
    { key: "all", label: t("extensionFilterAll", "All") },
  ];

  return (
    <div>
      {/* Filters + refresh */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          {filterChips.map((chip) => {
            const active = status === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setStatus(chip.key)}
                style={{
                  border: `1px solid ${active ? C.primary : C.border}`,
                  background: active ? C.primary : "#fff",
                  color: active ? "#fff" : C.muted,
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: F.sans,
                  transition: "all 0.15s ease",
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          aria-label={t("extensionRefresh", "Refresh")}
          title={t("extensionRefresh", "Refresh")}
          style={{
            border: `1px solid ${C.border}`,
            background: "#fff",
            color: C.muted,
            width: 34,
            height: 34,
            borderRadius: radius.md,
            cursor: refreshing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: refreshing ? 0.5 : 1,
          }}
        >
          <FiRefreshCw
            size={14}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: C.muted,
            fontSize: FONT_SIZES.small,
          }}
        >
          <FiLoader
            size={22}
            style={{
              animation: "spin 1s linear infinite",
              marginBottom: 6,
            }}
          />
          <div>{t("extensionLoading", "Loading extension requests...")}</div>
        </div>
      ) : requests.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: C.muted,
            fontSize: FONT_SIZES.small,
            background: "#fff",
            borderRadius: radius.lg,
            border: `1px dashed ${C.border}`,
          }}
        >
          <FiInfo size={22} style={{ opacity: 0.4, marginBottom: 6 }} />
          <div>{t("extensionNoRequests", "No extension requests.")}</div>
        </div>
      ) : (
        requests.map((r) => (
          <ExtensionRow
            key={r._id}
            request={r}
            t={t}
            onApprove={handleApprove}
            onReject={handleReject}
            busy={busyId === r._id}
          />
        ))
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────
const ForumReportManagement = () => {
  const { user } = useAuth();
  const isAdmin = isAdminOrAbove(user);
  const t = makeT("en");

  const [tab, setTab] = useState("data");
  const [pendingCount, setPendingCount] = useState(0);

  // If somehow a non-admin lands here and tries to switch to the
  // extensions tab (via the URL or a stale state), force them back to
  // data. Cheap belt-and-braces — the Extensions tab button won't be
  // rendered for non-admins, so this is a defensive fallback only.
  useEffect(() => {
    if (!isAdmin && tab === "extensions") {
      setTab("data");
    }
  }, [isAdmin, tab]);

  // Fetch the pending-extension count once on mount so the badge is
  // visible before the admin opens the tab. Fails silently if not an
  // admin (which is the correct behavior — non-admins don't have the
  // endpoint). Safe to spam because `getExtensionRequests` is a single
  // indexed query.
  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await forumReportService.getExtensionRequests("pending");
        if (cancelled) return;
        const list = Array.isArray(data?.requests) ? data.requests : [];
        setPendingCount(list.length);
      } catch {
        /* ignore — badge stays 0 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const tabs = [
    {
      key: "data",
      label: t("data", "Data"),
      icon: <FiMessageSquare size={14} />,
    },
    {
      key: "rankings",
      label: t("rankings", "Rankings"),
      icon: <FiAward size={14} />,
    },
  ];
  if (isAdmin) {
    tabs.push({
      key: "extensions",
      label: t("extensionsTab", "Extensions"),
      icon: <FiClock size={14} />,
      badge: pendingCount,
    });
  }

  return (
    <div style={{ padding: 8 }}>
      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          borderRadius: radius.lg,
          padding: 4,
          marginBottom: 12,
          maxWidth: 480,
          fontFamily: F.sans,
        }}
      >
        {tabs.map(({ key, label, icon, badge }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: radius.md,
                border: "none",
                background: active ? "#fff" : "transparent",
                color: active ? C.dark : C.muted,
                fontWeight: active ? 700 : 500,
                fontSize: FONT_SIZES.small,
                cursor: "pointer",
                boxShadow: active ? "0 1px 4px rgba(13,26,94,0.08)" : "none",
              }}
            >
              {icon}
              {label}
              {badge > 0 && (
                <span
                  style={{
                    background: "#EF4444",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 999,
                    lineHeight: 1.4,
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "data" ? (
        <AdminDataManagement dataType="forum-reports" />
      ) : tab === "rankings" ? (
        <Leaderboard />
      ) : (
        isAdmin && (
          <ExtensionsPanel t={t} onPendingCountChange={setPendingCount} />
        )
      )}
    </div>
  );
};

export default ForumReportManagement;
