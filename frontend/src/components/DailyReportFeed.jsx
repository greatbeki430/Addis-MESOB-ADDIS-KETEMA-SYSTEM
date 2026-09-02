// frontend/src/components/DailyReportFeed.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { dailyReportAPI } from "../services/api";
import {
  FiMessageCircle,
  FiSend,
  FiLoader,
  FiClock,
  FiUsers,
  FiLock,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { C, F } from "../styles/theme";
import { canComment, canReact, canDeleteComment } from "../utils/roles";

const DailyReportFeed = ({ t, isMobile }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [reacting, setReacting] = useState({});
  const [filterType, setFilterType] = useState("all");
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadTriggeredRef = useRef(false);

  // Get user's team for permission checks
  // const userTeamId = getUserTeamId(user);

  // Memoize translation functions
  const td = useCallback(
    (key, fallback = "") => t?.(`dailyReport.${key}`) || fallback,
    [t],
  );

  const tcm = useCallback(
    (key, fallback = "") => t?.(`common.${key}`) || fallback,
    [t],
  );

  // Load team feed
  const loadTeamFeed = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      console.log(`🔄 Fetching team feed with filter: ${filterType}...`);
      const response = await dailyReportAPI.getTeamFeed({
        filter: filterType,
      });

      let feedData = [];
      if (response?.data?.data) {
        feedData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response?.data)) {
        feedData = response.data;
      } else if (response?.data?.reports) {
        feedData = Array.isArray(response.data.reports)
          ? response.data.reports
          : [];
      }

      console.log(`✅ Feed loaded: ${feedData.length} reports`);
      if (isMountedRef.current) {
        setReports(feedData);
      }
    } catch (error) {
      console.error("Failed to load team feed:", error);
      if (isMountedRef.current) {
        showToast(td("feedLoadError", "Failed to load team feed"), "error");
        setReports([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [showToast, td, filterType]);

  // Handle adding a comment - with permission check
  const handleAddComment = useCallback(
    async (reportId) => {
      const text = commentInputs[reportId]?.trim();
      if (!text) return;

      // Check if user can comment on this report
      const report = reports.find((r) => r._id === reportId);
      if (!report || !canComment(user, report)) {
        showToast(
          "You don't have permission to comment on this report",
          "warning",
        );
        return;
      }

      try {
        setSubmitting((prev) => ({ ...prev, [reportId]: true }));
        await dailyReportAPI.addComment(reportId, text);
        setCommentInputs((prev) => ({ ...prev, [reportId]: "" }));
        showToast(td("commentAdded", "Comment added!"), "success");
        await loadTeamFeed();
      } catch (error) {
        console.error("Failed to add comment:", error);
        showToast(td("commentError", "Failed to add comment"), "error");
      } finally {
        setSubmitting((prev) => ({ ...prev, [reportId]: false }));
      }
    },
    [commentInputs, loadTeamFeed, showToast, td, reports, user],
  );

  // Handle toggling a reaction - with permission check
  const handleToggleReaction = useCallback(
    async (reportId, emoji) => {
      // Check if user can react to this report
      const report = reports.find((r) => r._id === reportId);
      if (!report || !canReact(user, report)) {
        showToast(
          "You don't have permission to react to this report",
          "warning",
        );
        return;
      }

      try {
        setReacting((prev) => ({ ...prev, [`${reportId}-${emoji}`]: true }));
        await dailyReportAPI.react(reportId, emoji);
        await loadTeamFeed();
      } catch (error) {
        console.error("Failed to toggle reaction:", error);
        showToast(td("reactionError", "Failed to update reaction"), "error");
      } finally {
        setReacting((prev) => ({ ...prev, [`${reportId}-${emoji}`]: false }));
      }
    },
    [loadTeamFeed, showToast, td, reports, user],
  );

  // Load feed on mount and set up auto-refresh
  useEffect(() => {
    console.log("🎯 DailyReportFeed mounted - loading feed...");
    isMountedRef.current = true;

    const timer = setTimeout(() => {
      if (isMountedRef.current && !loadTriggeredRef.current) {
        loadTriggeredRef.current = true;
        loadTeamFeed();
      }
    }, 0);

    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        loadTeamFeed();
      }
    }, 30000);

    return () => {
      console.log("🔄 DailyReportFeed unmounting...");
      isMountedRef.current = false;
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loadTeamFeed]);

  // Get emoji count
  const getEmojiCount = useCallback((reactions, emoji) => {
    if (!reactions || !Array.isArray(reactions)) return 0;
    return reactions.filter((r) => r.emoji === emoji).length;
  }, []);

  // Check if current user has reacted
  const hasUserReacted = useCallback(
    (reactions, emoji) => {
      if (!reactions || !Array.isArray(reactions) || !user) return false;
      return reactions.some((r) => r.emoji === emoji && r.user === user._id);
    },
    [user],
  );

  // Format date
  const formatDate = useCallback(
    (dateStr) => {
      if (!dateStr) return "";
      try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return td("justNow", "Just now");
        if (diffMins < 60) return `${diffMins} ${td("minutesAgo", "min ago")}`;
        if (diffHours < 24) return `${diffHours} ${td("hoursAgo", "hrs ago")}`;
        if (diffDays < 7) return `${diffDays} ${td("daysAgo", "days ago")}`;
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } catch {
        return dateStr;
      }
    },
    [td],
  );

  // Get initials from user name
  const getInitials = useCallback((userData) => {
    if (!userData) return "?";
    if (userData.name) {
      const nameParts = userData.name.trim().split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return userData.name.substring(0, 2).toUpperCase();
    }
    if (userData.firstName || userData.lastName) {
      return `${(userData.firstName || "")[0]}${(userData.lastName || "")[0]}`.toUpperCase();
    }
    return "?";
  }, []);

  // Get full name
  const getFullName = useCallback((userData) => {
    if (!userData) return "Unknown User";
    if (userData.name) return userData.name;
    if (userData.firstName || userData.lastName) {
      const fullName =
        `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
      if (fullName) return fullName;
    }
    return "Unknown User";
  }, []);

  const emojis = useMemo(() => ["👍", "❤️", "🎉", "🚀", "🔥", "👏"], []);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: C.muted,
        }}
      >
        <FiLoader
          size={32}
          style={{
            animation: "spin 1s linear infinite",
            display: "block",
            margin: "0 auto 12px",
          }}
        />
        <p>{tcm("loading", "Loading team feed...")}</p>
      </div>
    );
  }

  // Empty state
  if (!reports || reports.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: C.muted,
        }}
      >
        <FiUsers
          size={48}
          style={{
            display: "block",
            margin: "0 auto 12px",
            opacity: 0.5,
          }}
        />
        <h3 style={{ color: C.dark, marginBottom: 8 }}>
          {td("noTeamReports", "No Reports from Your Team")}
        </h3>
        <p style={{ fontSize: 14 }}>
          {td(
            "teamFeedEmpty",
            "Your teammates haven't submitted any reports yet.",
          )}
        </p>
        <p style={{ fontSize: 13, marginTop: 4, opacity: 0.7 }}>
          {td("beFirst", "Be the first to share your daily accomplishments!")}
        </p>
      </div>
    );
  }

  // Main render
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "16px" : "20px",
        paddingBottom: "20px",
      }}
    >
      {/* Feed header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: "4px",
          gap: isMobile ? "8px" : "0",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: 700,
              color: C.dark,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FiUsers size={isMobile ? 18 : 22} color={C.primary} />
            {td("teamFeed", "Team Feed")}
          </h3>
          <p
            style={{
              fontSize: isMobile ? "11px" : "13px",
              color: C.muted,
              margin: "2px 0 0",
            }}
          >
            {reports.length} {td("reportsToday", "reports shared today")}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "6px" : "8px",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          {/* Filter Buttons */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              justifyContent: isMobile ? "center" : "flex-end",
            }}
          >
            {["all", "today", "week", "month"].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                style={{
                  padding: isMobile ? "5px 10px" : "4px 12px",
                  borderRadius: "16px",
                  border: `1px solid ${filterType === filter ? C.primary : C.border}`,
                  background: filterType === filter ? C.primary : "transparent",
                  color: filterType === filter ? "#fff" : C.muted,
                  fontSize: isMobile ? "9px" : "11px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontWeight: filterType === filter ? 600 : 400,
                  whiteSpace: "nowrap",
                  flex: isMobile ? "1" : "0 1 auto",
                  minWidth: isMobile ? "0" : "auto",
                  textAlign: "center",
                }}
              >
                {filter === "all" && td("filterAll", "All")}
                {filter === "today" && td("filterToday", "Today")}
                {filter === "week" && td("filterWeek", "Week")}
                {filter === "month" && td("filterMonth", "Month")}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadTeamFeed}
            style={{
              background: "none",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: isMobile ? "5px 10px" : "6px 12px",
              fontSize: isMobile ? "10px" : "12px",
              cursor: "pointer",
              color: C.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              flex: isMobile ? "1" : "0 1 auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.color = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.muted;
            }}
          >
            <FiClock size={isMobile ? 12 : 14} />
            {td("refresh", "Refresh")}
          </button>
        </div>
      </div>

      {/* Report cards */}
      {reports.map((report) => {
        const isOwnReport =
          user && report.userId && report.userId._id === user._id;

        // Check if user can interact with this report
        const canInteract = canComment(user, report) && canReact(user, report);

        return (
          <div
            key={report._id}
            style={{
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: isMobile ? "16px" : "20px",
              transition: "box-shadow 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
            }}
          >
            {/* Report header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: isMobile ? 36 : 40,
                    height: isMobile ? 36 : 40,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${C.primary}22, ${C.primary}44)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isMobile ? 14 : 16,
                    fontWeight: 700,
                    color: C.primary,
                    flexShrink: 0,
                  }}
                >
                  {getInitials(report.userId)}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: isMobile ? "14px" : "15px",
                      color: C.dark,
                    }}
                  >
                    {getFullName(report.userId)}
                    {isOwnReport && (
                      <span
                        style={{
                          fontSize: 10,
                          background: C.primary,
                          color: "#fff",
                          padding: "1px 8px",
                          borderRadius: "99px",
                          marginLeft: 8,
                          fontWeight: 500,
                        }}
                      >
                        {td("you", "You")}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? "11px" : "12px",
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiClock size={12} />
                    {formatDate(report.createdAt)}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: isMobile ? "10px" : "11px",
                  color: C.muted,
                  background: "#F1F5F9",
                  padding: "2px 10px",
                  borderRadius: "99px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {report.team?.name || td("myTeam", "My Team")}
              </div>
            </div>

            {/* Report content - Summary */}
            <div
              style={{
                marginBottom: 14,
                padding: "12px 14px",
                background: "#FAFBFC",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: isMobile ? "13px" : "14px",
                  lineHeight: 1.6,
                  color: C.dark,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {report.summary || td("noSummary", "No summary provided")}
              </p>
            </div>

            {/* Report stats */}
            {report.entries && report.entries.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 14,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: isMobile ? "11px" : "12px",
                    color: C.muted,
                    background: "#F1F5F9",
                    padding: "2px 10px",
                    borderRadius: "99px",
                  }}
                >
                  {report.entries.length} {td("entries", "entries")}
                </span>
                {report.grandTotal !== undefined && (
                  <span
                    style={{
                      fontSize: isMobile ? "11px" : "12px",
                      color: C.primary,
                      fontWeight: 600,
                      background: `${C.primary}11`,
                      padding: "2px 10px",
                      borderRadius: "99px",
                    }}
                  >
                    {td("total", "Total")}: {report.grandTotal}
                  </span>
                )}
              </div>
            )}

            {/* Reactions - Conditional based on permissions */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {emojis.map((emoji) => {
                const count = getEmojiCount(report.reactions, emoji);
                const reacted = hasUserReacted(report.reactions, emoji);
                const isReacting = reacting[`${report._id}-${emoji}`];

                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (!canInteract) {
                        showToast(
                          "You don't have permission to react",
                          "warning",
                        );
                        return;
                      }
                      handleToggleReaction(report._id, emoji);
                    }}
                    disabled={isReacting || !canInteract}
                    style={{
                      background: reacted ? `${C.primary}15` : "transparent",
                      border: `1px solid ${reacted ? C.primary : C.border}`,
                      borderRadius: 20,
                      padding: isMobile ? "4px 10px" : "6px 14px",
                      fontSize: isMobile ? "13px" : "14px",
                      cursor:
                        isReacting || !canInteract ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.2s ease",
                      opacity: isReacting ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isReacting && canInteract) {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.borderColor = C.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      if (!reacted) {
                        e.currentTarget.style.borderColor = C.border;
                      }
                    }}
                  >
                    {isReacting ? (
                      <FiLoader
                        size={12}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <>
                        {emoji}
                        {count > 0 && (
                          <span
                            style={{
                              fontSize: isMobile ? "11px" : "12px",
                              color: reacted ? C.primary : C.muted,
                              fontWeight: reacted ? 700 : 400,
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
              {!canInteract && (
                <span
                  style={{
                    fontSize: "10px",
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginLeft: 4,
                  }}
                >
                  <FiLock size={12} /> View only
                </span>
              )}
            </div>

            {/* Comments section */}
            <div>
              {/* Existing comments */}
              {report.comments && report.comments.length > 0 && (
                <div
                  style={{
                    marginBottom: 10,
                    maxHeight: 150,
                    overflowY: "auto",
                  }}
                >
                  {report.comments.map((comment, idx) => {
                    const canDelete = canDeleteComment(user, report, comment);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "6px 0",
                          borderBottom:
                            idx < report.comments.length - 1
                              ? `1px solid ${C.border}44`
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: isMobile ? "11px" : "12px",
                            fontWeight: 600,
                            color: C.dark,
                            flexShrink: 0,
                            minWidth: isMobile ? "50px" : "60px",
                          }}
                        >
                          {getFullName(comment.user)}:
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? "12px" : "13px",
                            color: C.dark,
                            flex: 1,
                            wordBreak: "break-word",
                          }}
                        >
                          {comment.text}
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? "9px" : "10px",
                            color: C.muted,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {formatDate(comment.createdAt)}
                          {canDelete && (
                            <button
                              onClick={() => {
                                // Delete comment - add API call
                                console.log("Delete comment:", comment._id);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: "2px 4px",
                                borderRadius: 4,
                                fontSize: 10,
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comment input - Conditional based on permissions */}
              {canInteract ? (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#F8FAFC",
                      borderRadius: 20,
                      border: `1px solid ${C.border}`,
                      padding: "0 12px",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <FiMessageCircle
                      size={isMobile ? 14 : 16}
                      color={C.muted}
                    />
                    <input
                      type="text"
                      placeholder={td("writeComment", "Write a comment...")}
                      value={commentInputs[report._id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [report._id]: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddComment(report._id);
                        }
                      }}
                      style={{
                        flex: 1,
                        border: "none",
                        background: "transparent",
                        padding: isMobile ? "8px 0" : "10px 0",
                        fontSize: isMobile ? "13px" : "14px",
                        outline: "none",
                        fontFamily: F.sans,
                        color: C.dark,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleAddComment(report._id)}
                    disabled={
                      submitting[report._id] ||
                      !commentInputs[report._id]?.trim()
                    }
                    style={{
                      background:
                        submitting[report._id] ||
                        !commentInputs[report._id]?.trim()
                          ? C.border
                          : C.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: isMobile ? 36 : 40,
                      height: isMobile ? 36 : 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        submitting[report._id] ||
                        !commentInputs[report._id]?.trim()
                          ? "not-allowed"
                          : "pointer",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (
                        !submitting[report._id] &&
                        commentInputs[report._id]?.trim()
                      ) {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}44`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {submitting[report._id] ? (
                      <FiLoader
                        size={isMobile ? 16 : 18}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <FiSend size={isMobile ? 14 : 16} />
                    )}
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: "#F8FAFC",
                    borderRadius: 20,
                    border: `1px solid ${C.border}`,
                    color: C.muted,
                    fontSize: isMobile ? "12px" : "13px",
                  }}
                >
                  <FiLock size={14} />
                  <span>
                    {td("readOnlyComments", "Comments are read-only")}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Spinner animation CSS */}
      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DailyReportFeed;
