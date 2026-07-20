// frontend/src/components/ai/AIDashboardWidget.jsx
// AI-powered dashboard digest widget with auto-refresh.

import { useState, useEffect, useCallback, useRef } from "react";
import { aiAPI } from "../../services/api";

const AIDashboardWidget = ({
  stats,
  refreshInterval = 60000,
  className = "",
}) => {
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [fallbackDigest] = useState(
    "📊 Dashboard analytics are being prepared. Check back soon for AI-powered insights into team performance and service delivery metrics.",
  );

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDigest = useCallback(async () => {
    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);
    try {
      console.log("📊 Fetching dashboard digest with stats:", stats);
      const response = await aiAPI.getDashboardDigest(stats);

      if (isMountedRef.current) {
        setDigest(response.data.digest);
        setLastUpdated(new Date());
        setRetryCount(0);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const code =
          err?.response?.data?.code ||
          err?.response?.status ||
          "AI_UNKNOWN_ERROR";
        const status = err?.response?.status;

        let message =
          err?.response?.data?.message ||
          "AI insights are temporarily unavailable.";

        const isQuotaError =
          status === 429 ||
          message.includes("quota") ||
          message.includes("rate limit") ||
          message.includes("RESOURCE_EXHAUSTED");

        if (isQuotaError) {
          message = "AI service is busy. Please try again in a few minutes.";
          console.warn("⚠️ API quota exceeded, will retry later");
          setRetryCount((prev) => prev + 1);
        }

        setError({ message, code, isQuotaError });
        console.error(
          "[AIDashboardWidget] failed to load digest:",
          code,
          message,
          err,
        );
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [stats]);

  // Initial load + auto-refresh
  useEffect(() => {
    let isEffectActive = true;
    let retryTimeout = null;

    const loadData = async () => {
      if (!isEffectActive || !isMountedRef.current) return;

      setLoading(true);
      setError(null);
      try {
        const response = await aiAPI.getDashboardDigest(stats);
        if (isEffectActive && isMountedRef.current) {
          setDigest(response.data.digest);
          setLastUpdated(new Date());
          setRetryCount(0);
        }
      } catch (err) {
        if (isEffectActive && isMountedRef.current) {
          const code =
            err?.response?.data?.code ||
            err?.response?.status ||
            "AI_UNKNOWN_ERROR";
          const status = err?.response?.status;

          let message =
            err?.response?.data?.message ||
            "AI insights are temporarily unavailable.";

          const isQuotaError =
            status === 429 ||
            message.includes("quota") ||
            message.includes("rate limit") ||
            message.includes("RESOURCE_EXHAUSTED");

          if (isQuotaError) {
            message = "AI service is busy. Please try again in a few minutes.";
            console.warn("⚠️ API quota exceeded, will retry later");
            setRetryCount((prev) => prev + 1);
          }

          setError({ message, code, isQuotaError });
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

    loadData();

    const getInterval = () => {
      if (retryCount > 0) {
        const backoffTime = Math.min(
          60000 * Math.pow(2, retryCount - 1),
          300000,
        );
        return backoffTime;
      }
      return refreshInterval;
    };

    const interval = setInterval(() => {
      if (isEffectActive && isMountedRef.current) {
        loadData();
      }
    }, getInterval());

    return () => {
      isEffectActive = false;
      clearInterval(interval);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [stats, refreshInterval, retryCount]);

  // Loading state
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

  // Error state with fallback digest
  if (error && !digest) {
    const isQuotaError = error.isQuotaError;
    const displayMessage = isQuotaError
      ? "AI service is busy. Please try again in a few minutes."
      : "AI insights are temporarily unavailable.";

    return (
      <div
        style={{
          background: "#F8FAFC",
          borderRadius: "12px",
          padding: "12px 20px",
          border: "1px dashed #CBD5E1",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
        className={className}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#64748B", fontSize: "13px" }}>
            {displayMessage}
            {isQuotaError && retryCount > 1 && (
              <span
                style={{
                  fontSize: "11px",
                  display: "block",
                  marginTop: "2px",
                  color: "#94A3B8",
                }}
              >
                Auto-retry in {Math.min(60 * Math.pow(2, retryCount - 1), 300)}{" "}
                seconds...
              </span>
            )}
          </span>
          <button
            onClick={() => {
              setRetryCount(0);
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
        {/* Fallback digest */}
        <div
          style={{
            fontSize: "13px",
            color: "#475569",
            paddingTop: "4px",
            borderTop: "1px dashed #CBD5E1",
          }}
        >
          {fallbackDigest}
        </div>
      </div>
    );
  }

  // Success state
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
                setRetryCount(0);
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
