// frontend/src/components/ai/AIDashboardWidget.jsx
// AI-powered dashboard digest widget with auto-refresh

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

  // ✅ Use ref to track if component is mounted
  const isMounted = useRef(true);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDigest = useCallback(async () => {
    // Don't set state if unmounted
    if (!isMounted.current) return;

    setLoading(true);
    setError(null);
    try {
      const response = await aiAPI.getDashboardDigest(stats);
      // ✅ Only update state if component is still mounted
      if (isMounted.current) {
        setDigest(response.data.digest);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        setError("Failed to load AI insights");
        console.error(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [stats]);

  // ✅ Use effect with cleanup flag pattern
  useEffect(() => {
    let isEffectActive = true;

    const loadData = async () => {
      if (!isEffectActive) return;

      setLoading(true);
      setError(null);
      try {
        const response = await aiAPI.getDashboardDigest(stats);
        // ✅ Only update state if effect is still active
        if (isEffectActive) {
          setDigest(response.data.digest);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (isEffectActive) {
          setError("Failed to load AI insights");
          console.error(err);
        }
      } finally {
        if (isEffectActive) {
          setLoading(false);
        }
      }
    };

    loadData();

    // ✅ Set up interval
    const interval = setInterval(() => {
      // Only fetch if effect is still active
      if (isEffectActive) {
        loadData();
      }
    }, refreshInterval);

    // ✅ Cleanup function - marks effect as inactive and clears interval
    return () => {
      isEffectActive = false;
      clearInterval(interval);
    };
  }, [stats, refreshInterval]);

  // Loading state
  if (loading && !digest) {
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
      >
        <span style={{ animation: "spin 1s linear infinite" }}>⚡</span>
        <span style={{ color: "#475569", fontSize: "14px" }}>
          Loading AI insights...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          background: "#FEF2F2",
          borderRadius: "12px",
          padding: "16px 20px",
          border: "1px solid #FECACA",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span style={{ color: "#B91C1C" }}>⚠️</span>
        <span style={{ color: "#B91C1C", fontSize: "14px" }}>{error}</span>
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
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => {
                // Manual refresh - use the fetchDigest function
                fetchDigest();
              }}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                color: "#2563EB",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "6px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#DBEAFE";
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
