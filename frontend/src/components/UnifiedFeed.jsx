// frontend/src/components/UnifiedFeed.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { feedAPI } from "../services/api";
import { useToast } from "../hooks/useToast";
import { C } from "../styles/theme";
import {
  FiFileText,
  FiMessageSquare,
  FiClock,
  FiLoader,
  FiRefreshCw,
} from "react-icons/fi";

const UnifiedFeed = ({ t, isMobile, teamId, initialFilter = "all" }) => {
  const { showToast } = useToast();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(initialFilter);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;
  const loadMoreRef = useRef(null);
  const isMountedRef = useRef(true);
  const loadTriggeredRef = useRef(false);

  const td = useCallback(
    (key, fallback = "") =>
      t?.feed?.[key] || t?.dailyReport?.feed?.[key] || fallback,
    [t],
  );

  const tcm = useCallback(
    (key, fallback = "") => t?.common?.[key] || fallback,
    [t],
  );

  // Load feed
  const loadFeed = useCallback(
    async (reset = true) => {
      if (!isMountedRef.current) return;

      try {
        if (reset) {
          setLoading(true);
          setPage(0);
        } else {
          setRefreshing(true);
        }

        const params = {
          type: filterType,
          limit,
          skip: reset ? 0 : page * limit,
        };

        if (teamId) {
          params.team = teamId;
        }

        const response = await feedAPI.getFeed(params);
        const items = response.data?.data || [];

        if (reset) {
          setFeedItems(items);
          setPage(1);
        } else {
          setFeedItems((prev) => [...prev, ...items]);
          setPage((prev) => prev + 1);
        }

        setHasMore(items.length === limit);
      } catch (error) {
        console.error("Failed to load feed:", error);
        if (isMountedRef.current) {
          showToast(td("loadError", "Failed to load feed"), "error");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filterType, teamId, limit, page, showToast, td],
  );

  // Initial load - Use setTimeout to avoid setState warning
  useEffect(() => {
    isMountedRef.current = true;

    const timer = setTimeout(() => {
      if (isMountedRef.current && !loadTriggeredRef.current) {
        loadTriggeredRef.current = true;
        loadFeed(true);
      }
    }, 0);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [loadFeed]);

  // Intersection observer for infinite scroll - Fixed dependency issue
  useEffect(() => {
    if (!loadMoreRef.current || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          isMountedRef.current
        ) {
          loadFeed(false);
        }
      },
      { threshold: 0.1 },
    );

    const currentRef = loadMoreRef.current;
    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
    // ✅ Fixed: Removed loadMoreRef.current from dependencies
  }, [hasMore, loading, loadFeed]);

  // Handle refresh
  const handleRefresh = () => {
    loadFeed(true);
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
    if (userData.firstName || userData.lastName) {
      return (
        `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
        "Unknown User"
      );
    }
    return "Unknown User";
  };

  // Render feed item
  const renderFeedItem = (item) => {
    const isDaily = item.type === "daily_report";
    const Icon = isDaily ? FiFileText : FiMessageSquare;
    const color = isDaily ? C.primary : "#8B5CF6";
    const bgColor = isDaily ? `${C.primary}15` : "#8B5CF615";

    return (
      <div
        key={`${item.type}-${item.id}`}
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
                background: bgColor,
                color: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              <Icon size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>
                {getFullName(item.author)}
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
                {formatDate(item.createdAt)}
                {item.team && (
                  <>
                    <span style={{ margin: "0 4px" }}>•</span>
                    <span>{item.team?.name || td("myTeam", "My Team")}</span>
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
              background: bgColor,
              color: color,
              fontWeight: 600,
            }}
          >
            {isDaily ? td("daily", "Daily") : td("forum", "Forum")}
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
            {item.summary || td("noSummary", "No summary provided")}
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
          {isDaily ? (
            <>
              <span>
                {item.entryCount || 0} {td("entries", "entries")}
              </span>
              <span style={{ fontWeight: 600, color: C.primary }}>
                {td("total", "Total")}: {item.grandTotal || 0}
              </span>
              <span>
                💬 {item.comments?.length || 0} {td("comments", "comments")}
              </span>
              <span>
                ❤️ {item.reactions?.length || 0} {td("reactions", "reactions")}
              </span>
            </>
          ) : (
            <>
              <span>
                📋 {item.entryCount || 0} {td("topics", "topics")}
              </span>
              <span>
                👥 {item.attendeeCount || 0} {td("attendees", "attendees")}
              </span>
              <span>
                ✅ {item.agreements?.length || 0}{" "}
                {td("agreements", "agreements")}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && feedItems.length === 0) {
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
        <p>{tcm("loading", "Loading feed...")}</p>
      </div>
    );
  }

  // Empty state
  if (!feedItems || feedItems.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 20px",
          color: C.muted,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <h3 style={{ color: C.dark, marginBottom: 8 }}>
          {td("noActivity", "No Activity Yet")}
        </h3>
        <p style={{ fontSize: 14 }}>
          {td(
            "noActivityDesc",
            "When your team members submit daily or forum reports, they'll appear here.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "8px",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
          }}
        >
          {["all", "daily", "forum"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: isMobile ? "6px 12px" : "6px 16px",
                borderRadius: "20px",
                border: `1.5px solid ${filterType === type ? C.primary : C.border}`,
                background: filterType === type ? C.primary : "transparent",
                color: filterType === type ? "#fff" : C.muted,
                fontSize: isMobile ? "11px" : "12px",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: filterType === type ? 600 : 400,
              }}
            >
              {type === "all" && td("all", "All")}
              {type === "daily" && td("daily", "Daily Reports")}
              {type === "forum" && td("forum", "Forum Reports")}
            </button>
          ))}
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
            justifyContent: "center",
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

      {/* Feed Items */}
      {feedItems.map(renderFeedItem)}

      {/* Load More */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          style={{
            textAlign: "center",
            padding: "20px",
            color: C.muted,
          }}
        >
          {loading ? (
            <FiLoader
              size={20}
              style={{
                animation: "spin 1s linear infinite",
                display: "block",
                margin: "0 auto",
              }}
            />
          ) : (
            <span style={{ fontSize: 12 }}>
              {td("loadMore", "Scroll for more...")}
            </span>
          )}
        </div>
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

export default UnifiedFeed;
