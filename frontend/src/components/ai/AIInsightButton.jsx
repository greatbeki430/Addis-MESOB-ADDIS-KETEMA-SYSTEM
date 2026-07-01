// frontend/src/components/ai/AIInsightButton.jsx
// A more feature-rich AI insight button with multiple display options

import { useState } from "react";
import { C } from "../../styles/theme";

const AIInsightButton = ({
  fetchFn,
  args = [],
  label = "AI Insight",
  variant = "primary", // "primary" | "secondary" | "outline"
  size = "md", // "sm" | "md" | "lg"
  onSuccess,
  onError,
  showIcon = true,
  className = "",
  buttonText = "Generate AI Insight",
}) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn(...args);
      const content =
        res.data?.insight ||
        res.data?.summary ||
        res.data?.digest ||
        res.data?.minutes ||
        res.data?.analysis ||
        "No content returned";

      setInsight(content);
      setShowModal(true);
      if (onSuccess) onSuccess(content);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to generate insight";
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Size styles
  const sizeStyles = {
    sm: { padding: "4px 12px", fontSize: "12px" },
    md: { padding: "8px 16px", fontSize: "13px" },
    lg: { padding: "10px 20px", fontSize: "15px" },
  };

  // Variant styles
  const variantStyles = {
    primary: {
      background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
      color: "#fff",
      border: "none",
    },
    secondary: {
      background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
      color: "#fff",
      border: "none",
    },
    outline: {
      background: "transparent",
      color: C.primary,
      border: `2px solid ${C.primary}`,
    },
  };

  const styles = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    borderRadius: "10px",
    fontWeight: 600,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  };

  return (
    <>
      <button
        onClick={generateInsight}
        disabled={loading}
        className={className}
        style={styles}
        onMouseEnter={(e) => {
          if (!loading && !e.currentTarget.style.border?.includes("2px")) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(124,58,237,0.3)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {loading ? (
          <>
            <span style={{ animation: "spin 1s linear infinite" }}>⚡</span>
            Generating...
          </>
        ) : (
          <>
            {showIcon && <span>✨</span>}
            {buttonText}
          </>
        )}
      </button>

      {/* Error message */}
      {error && !showModal && (
        <div style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px" }}>
          ⚠ {error}
        </div>
      )}

      {/* Modal */}
      {showModal && insight && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              animation: "fadeIn 0.3s ease",
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "clamp(20px, 5vw, 32px)",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                animation: "slideUp 0.3s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontSize: "24px" }}>🧠</span>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#0F172A",
                      }}
                    >
                      {label}
                    </h3>
                    <p
                      style={{ margin: 0, fontSize: "12px", color: "#64748B" }}
                    >
                      Generated by AI • {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#64748B",
                    padding: "4px",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: "1.8",
                  color: "#1E293B",
                  whiteSpace: "pre-wrap",
                  background: "#F8FAFC",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                {insight}
              </div>

              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(insight);
                    alert("Copied to clipboard!");
                  }}
                  style={{
                    background: "#F1F5F9",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                    color: "#475569",
                    transition: "all 0.2s",
                  }}
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: C.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      )}
    </>
  );
};

export default AIInsightButton;
