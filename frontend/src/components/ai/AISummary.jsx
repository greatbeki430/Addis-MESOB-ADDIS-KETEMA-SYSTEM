// frontend/src/components/ai/AISummary.jsx
// Enhanced AI summary component with professional styling

import { useState, useEffect, useRef, useCallback } from "react";
import { C, F, btn, radius, shadows } from "../../styles/theme";
import {
  FiZap,
  FiLoader,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCopy,
} from "react-icons/fi";

const AISummary = ({
  fetchFn,
  args = [],
  label = "AI Analysis",
  variant = "default",
  autoGenerate = false,
}) => {
  const [insight, setInsight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ Use ref to track if component is mounted
  const isMounted = useRef(true);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    // ✅ Don't set state if unmounted
    if (!isMounted.current) return;

    setIsLoading(true);
    setError("");
    try {
      const res = await fetchFn(...args);
      // ✅ Only update state if component is still mounted
      if (isMounted.current) {
        const content =
          res.data.insight ||
          res.data.summary ||
          res.data.digest ||
          res.data.minutes ||
          "No content returned";
        setInsight(content);
        setGenerated(true);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || "AI service unavailable");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, args]);

  const handleCopy = () => {
    if (insight) {
      navigator.clipboard?.writeText(insight);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setGenerated(false);
    setInsight("");
    handleGenerate();
  };

  // ✅ Fixed useEffect with cleanup flag
  useEffect(() => {
    let isEffectActive = true;

    const loadData = async () => {
      if (!isEffectActive || !isMounted.current) return;

      if (autoGenerate && !generated) {
        setIsLoading(true);
        setError("");
        try {
          const res = await fetchFn(...args);
          if (isEffectActive && isMounted.current) {
            const content =
              res.data.insight ||
              res.data.summary ||
              res.data.digest ||
              res.data.minutes ||
              "No content returned";
            setInsight(content);
            setGenerated(true);
          }
        } catch (err) {
          if (isEffectActive && isMounted.current) {
            setError(err.response?.data?.message || "AI service unavailable");
          }
        } finally {
          if (isEffectActive && isMounted.current) {
            setIsLoading(false);
          }
        }
      }
    };

    loadData();

    return () => {
      isEffectActive = false;
    };
  }, [autoGenerate, generated, fetchFn, args]);

  const variantStyles = {
    default: {
      background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
      border: `1px solid #BFDBFE`,
      iconColor: "#1D4ED8",
      padding: "16px 20px",
    },
    compact: {
      background: "#F8FAFC",
      border: `1px solid ${C.border}`,
      iconColor: C.muted,
      padding: "12px 16px",
    },
    highlight: {
      background: "linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%)",
      border: `2px solid ${C.primary}`,
      iconColor: C.primary,
      padding: "20px 24px",
      boxShadow: shadows.md,
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 18px",
          background: "#FEF2F2",
          border: `1px solid #FECACA`,
          borderRadius: radius.lg,
        }}
      >
        <FiAlertCircle size={20} color="#DC2626" />
        <span style={{ color: "#DC2626", fontSize: "14px", flex: 1 }}>
          {error}
        </span>
        <button
          onClick={handleGenerate}
          style={{
            ...btn.small,
            color: "#DC2626",
            borderColor: "#FECACA",
          }}
        >
          <FiRefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          background: styles.background,
          border: styles.border,
          borderRadius: radius.lg,
          boxShadow: styles.boxShadow,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        <FiLoader
          size={20}
          style={{
            animation: "spin 1s linear infinite",
            color: styles.iconColor,
          }}
        />
        <span style={{ color: C.muted, fontSize: "14px" }}>
          Generating {label.toLowerCase()}...
        </span>
      </div>
    );
  }

  if (!generated) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: styles.background,
          border: styles.border,
          borderRadius: radius.lg,
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FiZap size={20} color={styles.iconColor} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: C.dark }}>
            {label}
          </span>
          <span
            style={{
              fontSize: "10px",
              background: "#DBEAFE",
              color: "#1D4ED8",
              padding: "2px 10px",
              borderRadius: radius.pill,
              fontWeight: 500,
            }}
          >
            AI Generated
          </span>
        </div>
        <button
          onClick={handleGenerate}
          style={{
            ...btn.primary,
            padding: "6px 16px",
            fontSize: "13px",
          }}
        >
          <FiZap size={14} />
          Generate
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: styles.padding,
        background: styles.background,
        border: styles.border,
        borderRadius: radius.lg,
        boxShadow: styles.boxShadow,
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "10px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCheckCircle size={18} color="#10b981" />
          <span
            style={{
              fontWeight: 600,
              fontSize: "14px",
              color: C.dark,
              fontFamily: F.sans,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "10px",
              background: "#D1FAE5",
              color: "#065F46",
              padding: "2px 10px",
              borderRadius: radius.pill,
              fontWeight: 500,
            }}
          >
            Generated
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={handleCopy}
            style={{
              ...btn.small,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiCopy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleRegenerate}
            style={{
              ...btn.small,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiRefreshCw size={14} />
            Regenerate
          </button>
        </div>
      </div>

      <div
        style={{
          fontSize: "clamp(13px, 3vw, 14px)",
          lineHeight: "1.8",
          color: "#1E293B",
          whiteSpace: "pre-wrap",
          fontFamily: F.sans,
          maxHeight: variant === "compact" ? "150px" : "300px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {insight}
      </div>

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          color: C.muted,
          borderTop: `1px solid ${C.border}`,
          paddingTop: "10px",
        }}
      >
        <FiClock size={12} />
        Generated by AI • {new Date().toLocaleString()}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default AISummary;
