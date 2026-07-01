// frontend/src/components/ai/AIEvaluationHelper.jsx
// AI-powered evaluation feedback generator

import { useState } from "react";
import { aiAPI } from "../../services/api";
import { C } from "../../styles/theme";

const AIEvaluationHelper = ({
  evaluationData,
  onApplyFeedback,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.getEvaluationSummary({
        evaluationData: {
          ...evaluationData,
          generateDetailedFeedback: true,
        },
      });

      setFeedback(response.data.summary);
      setShowFeedback(true);
    } catch (error) {
      console.error("Failed to generate feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFeedback = (text) => {
    if (onApplyFeedback) onApplyFeedback(text);
    setShowFeedback(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={generateFeedback}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 20px",
          background: "linear-gradient(135deg, #059669, #047857)",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(5,150,105,0.3)";
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
            Generating Feedback...
          </>
        ) : (
          <>
            <span>📝</span>
            AI Evaluation Feedback
          </>
        )}
      </button>

      {showFeedback && feedback && (
        <>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "clamp(320px, 80vw, 450px)",
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              border: "1px solid #E2E8F0",
              zIndex: 50,
              padding: "20px",
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>🧠</span>
                AI Evaluation Feedback
              </h4>
              <button
                onClick={() => setShowFeedback(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#64748B",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.8",
                color: "#1E293B",
                whiteSpace: "pre-wrap",
                background: "#F8FAFC",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {feedback}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => applyFeedback(feedback)}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  background: C.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                📋 Apply to Evaluation
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(feedback);
                  alert("Copied to clipboard!");
                }}
                style={{
                  padding: "8px 16px",
                  background: "#F1F5F9",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "#475569",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E2E8F0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F1F5F9";
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setShowFeedback(false)}
          />
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIEvaluationHelper;
