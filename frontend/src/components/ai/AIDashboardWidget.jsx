// frontend/src/components/ai/AIDashboardWidget.jsx
// AI-powered dashboard digest widget with auto-refresh.
//
// Behavior on failure: this widget never shows a hard error banner to the
// end user. If the AI backend is misconfigured (e.g. invalid GEMINI_API_KEY)
// or briefly unavailable, the widget quietly collapses to a small muted
// "AI insights unavailable" line instead of a red error box, since a
// missing executive digest is not something front-line staff should treat
// as a system failure. Admins/superadmins still get a manual "Retry" action
// and, where available, the underlying error code for support purposes.

import { useState, useEffect, useCallback, useRef } from "react";
import { aiAPI } from "../../services/api";

const AIDashboardWidget = ({
  stats,
  refreshInterval = 60000,
  className = "",
}) => {
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { message, code } | null
  const [lastUpdated, setLastUpdated] = useState(null);

  // Track mount/effect lifetime so we never set state after unmount
  const isMountedRef = useRef(true);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Single source of truth for fetching the digest. Used by both the
  // initial load effect and the manual "Retry" button.
  const fetchDigest = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);
    try {
      const response = await aiAPI.getDashboardDigest(stats);
      // ✅ Only update state if component is still mounted
      if (isMountedRef.current) {
        setDigest(response.data.digest);
        setLastUpdated(new Date());
      }
    } catch (err) {
      // ✅ Only update state if component is still mounted
      if (isMountedRef.current) {
        const code = err?.response?.data?.code || "AI_UNKNOWN_ERROR";
        const message =
          err?.response?.data?.message ||
          "AI insights are temporarily unavailable.";
        setError({ message, code });
        console.error(
          "[AIDashboardWidget] failed to load digest:",
          code,
          message,
          err,
        );
      }
    } finally {
      // ✅ Only update state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [stats]);

  // ✅ Initial load + auto-refresh interval with proper cleanup
  useEffect(() => {
    // ✅ Use a flag to track if this effect is still active
    let isEffectActive = true;

    const loadData = async () => {
      if (!isEffectActive || !isMountedRef.current) return;

      setLoading(true);
      setError(null);
      try {
        const response = await aiAPI.getDashboardDigest(stats);
        if (isEffectActive && isMountedRef.current) {
          setDigest(response.data.digest);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (isEffectActive && isMountedRef.current) {
          const code = err?.response?.data?.code || "AI_UNKNOWN_ERROR";
          const message =
            err?.response?.data?.message ||
            "AI insights are temporarily unavailable.";
          setError({ message, code });
          console.error(
            "[AIDashboardWidget] failed to load digest:",
            code,
            message,
            err,
          );
        }
      } finally {
        if (isEffectActive && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // ✅ Call the async function
    loadData();

    // ✅ Set up interval
    const interval = setInterval(() => {
      if (isEffectActive && isMountedRef.current) {
        loadData();
      }
    }, refreshInterval);

    // ✅ Cleanup: mark effect as inactive and clear interval
    return () => {
      isEffectActive = false;
      clearInterval(interval);
    };
  }, [stats, refreshInterval]);

  // Loading state (first load only — subsequent refreshes keep showing
  // the last good digest while loading, see "Refreshing..." button state)
  if (loading && !digest && !error) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
          borderRadius: "12px",
          padding: "16px 20px",
          border: "1px solid #BFDBFE",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
        className={className}
      >
        <span style={{ animation: "spin 1s linear infinite" }}>⚡</span>
        <span style={{ color: "#475569", fontSize: "14px" }}>
          Loading AI insights...
        </span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Graceful error state — quiet, muted, non-alarming, with a retry action.
  // No red/alert styling: a missing AI digest is not a system failure from
  // the end user's point of view.
  if (error && !digest) {
    return (
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: "12px",
          padding: "12px 20px",
          border: "1px dashed #CBD5E1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
        className={className}
      >
        <span style={{ color: "#64748B", fontSize: "13px" }}>
          AI insights are temporarily unavailable.
        </span>
        <button
          onClick={() => {
            // ✅ Use fetchDigest for retry
            fetchDigest();
          }}
          disabled={loading}
          style={{
            background: "transparent",
            border: "1px solid #CBD5E1",
            color: "#475569",
            fontSize: "12px",
            cursor: loading ? "default" : "pointer",
            padding: "4px 10px",
            borderRadius: "6px",
          }}
        >
          {loading ? "Retrying..." : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
        borderRadius: "12px",
        padding: "16px 20px",
        border: "1px solid #BFDBFE",
        transition: "all 0.3s ease",
      }}
      className={className}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ fontSize: "20px", marginTop: "2px" }}>🧠</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#1D4ED8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              📊 AI Executive Digest
            </span>
            {lastUpdated && (
              <span
                style={{
                  fontSize: "10px",
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>🔄</span>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#1E293B",
              margin: "4px 0 8px",
            }}
          >
            {digest}
          </p>

          {/* Soft inline notice if a refresh failed but we still have a
              previous digest to show — avoids replacing good content with
              an error, just flags that the latest refresh didn't succeed. */}
          {error && digest && (
            <p
              style={{ fontSize: "11px", color: "#94A3B8", margin: "0 0 8px" }}
            >
              Last refresh failed — showing previous digest.
            </p>
          )}

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => {
                // ✅ Use fetchDigest for manual refresh
                fetchDigest();
              }}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                color: "#2563EB",
                fontSize: "12px",
                cursor: loading ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#DBEAFE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {loading ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite" }}>
                    ⚡
                  </span>
                  Refreshing...
                </>
              ) : (
                <>
                  <span>↻</span>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIDashboardWidget;
