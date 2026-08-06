// frontend/src/components/ForumReportFeed.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { meetingAPI } from "../services/api";
import { useToast } from "../hooks/useToast";
import { C } from "../styles/theme";
import {
  FiMessageSquare,
  FiClock,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";

const ForumReportFeed = ({ t, isMobile, teamId }) => {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadTriggeredRef = useRef(false);

  const td = useCallback(
    (key, fallback = "") =>
      t?.forumFeed?.[key] || t?.dailyReport?.feed?.[key] || fallback,
    [t],
  );

  const tcm = useCallback(
    (key, fallback = "") => t?.common?.[key] || fallback,
    [t],
  );

  // Load forum reports for the team
  const loadForumFeed = useCallback(async () => {
    if (!isMountedRef.current || !teamId) return;

    try {
      setLoading(true);
      const response = await meetingAPI.getByTeam(teamId);
      const data = response.data || [];

      if (isMountedRef.current) {
        setReports(data);
      }
    } catch (error) {
      console.error("Failed to load forum feed:", error);
      if (isMountedRef.current) {
        showToast(td("loadError", "Failed to load forum reports"), "error");
        setReports([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [teamId, showToast, td]);

  // Initial load - Use setTimeout to avoid setState warning
  useEffect(() => {
    isMountedRef.current = true;

    const timer = setTimeout(() => {
      if (isMountedRef.current && teamId && !loadTriggeredRef.current) {
        loadTriggeredRef.current = true;
        loadForumFeed();
      }
    }, 0);

    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && teamId) {
        loadForumFeed();
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [teamId, loadForumFeed]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadForumFeed();
  };

  // Format date
  const formatDate = (dateStr) => {
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
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Get full name
  const getFullName = (userData) => {
    if (!userData) return "Unknown User";
    if (userData.name) return userData.name;
    return "Unknown User";
  };

  // Loading state
  if (loading && reports.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
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
        <p>{tcm("loading", "Loading forum reports...")}</p>
      </div>
    );
  }

  // Empty state
  if (!reports || reports.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          color: C.muted,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <h3 style={{ color: C.dark, marginBottom: 8 }}>
          {td("noForumReports", "No Forum Reports Yet")}
        </h3>
        <p style={{ fontSize: 14 }}>
          {td(
            "noForumReportsDesc",
            "When this team submits forum reports, they'll appear here.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
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
            <FiMessageSquare size={isMobile ? 18 : 22} color="#8B5CF6" />
            {td("forumFeedTitle", "Forum Reports Feed")}
          </h3>
          <p
            style={{
              fontSize: isMobile ? "11px" : "13px",
              color: C.muted,
              margin: "2px 0 0",
            }}
          >
            {reports.length} {td("reports", "reports")}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: isMobile ? "6px 12px" : "6px 16px",
            fontSize: isMobile ? "11px" : "12px",
            cursor: "pointer",
            color: C.muted,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.2s",
          }}
        >
          <FiRefreshCw
            size={14}
            style={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
          {td("refresh", "Refresh")}
        </button>
      </div>

      {/* Report Cards */}
      {reports.map((report) => (
        <div
          key={report._id}
          style={{
            background: "#fff",
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: isMobile ? "14px" : "18px",
            marginBottom: "12px",
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
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#8B5CF615",
                  color: "#8B5CF6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                <FiMessageSquare size={14} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>
                  {getFullName(report.createdBy)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <FiClock size={11} />
                  {formatDate(report.createdAt)}
                  {report.teamName && (
                    <>
                      <span style={{ margin: "0 4px" }}>•</span>
                      <span>{report.teamName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 10,
                padding: "2px 10px",
                borderRadius: "99px",
                background: "#8B5CF615",
                color: "#8B5CF6",
                fontWeight: 600,
              }}
            >
              {td("forum", "Forum")}
            </span>
          </div>

          {/* Content */}
          <div
            style={{
              marginBottom: 10,
              padding: "8px 12px",
              background: "#FAFBFC",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? "13px" : "14px",
                lineHeight: 1.5,
                color: C.dark,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {report.explanation || td("noSummary", "No summary provided")}
            </p>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 11,
              color: C.muted,
            }}
          >
            <span>
              📋 {report.topics?.length || 0} {td("topics", "topics")}
            </span>
            <span>
              👥 {report.present?.length || 0} {td("attendees", "attendees")}
            </span>
            <span>
              ✅ {report.agreements?.length || 0}{" "}
              {td("agreements", "agreements")}
            </span>
            <span>
              ⚠️ {report.gaps?.length || 0} {td("gaps", "gaps")}
            </span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ForumReportFeed;
