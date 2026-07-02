// frontend/src/components/ai/AIReportAssistant.jsx
// AI-powered report writing assistant with suggestions

import { useState } from "react";
import { aiAPI } from "../../services/api";
import { C } from "../../styles/theme";

const AIReportAssistant = ({
  reportContext,
  onApply,
  type = "daily", // "daily" | "forum" | "evaluation"
  className = "",
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      let response;
      let content = "";

      // ✅ Handle different report types
      if (type === "forum") {
        // For forum reports, use meeting minutes
        response = await aiAPI.getMeetingMinutes({
          title: reportContext.title || "Peer Forum Report",
          date: reportContext.date || new Date().toISOString().split("T")[0],
          attendees: reportContext.attendees || [],
          agenda: reportContext.topics?.join("; ") || "",
          notes: [
            `Topics: ${reportContext.topics?.join("; ") || ""}`,
            `Explanation: ${reportContext.explanation || ""}`,
            `Gaps: ${reportContext.gaps?.join("; ") || ""}`,
            `Agreements: ${reportContext.agreements?.join("; ") || ""}`,
          ].join("\n"),
        });
        content = response.data?.minutes || response.data?.insight || "";
      } else if (type === "evaluation") {
        // For evaluation reports
        response = await aiAPI.getEvaluationSummary({
          evaluationData: reportContext,
        });
        content = response.data?.summary || "";
      } else {
        // Default: daily report insight
        response = await aiAPI.getDailyInsight(null, reportContext);
        content = response.data?.insight || "";
      }

      const lines = content.split("\n").filter(Boolean);

      setSuggestions({
        summary: lines[0] || "",
        keyPoints: lines.slice(1, 4).filter((l) => l.length > 10) || [],
        recommendation: lines[lines.length - 1] || "",
        fullText: content,
      });
      setShowSuggestions(true);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);

      // ✅ Fallback suggestions when AI fails
      const fallbackSuggestions = getFallbackSuggestions(type, reportContext);
      setSuggestions(fallbackSuggestions);
      setShowSuggestions(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fallback suggestions based on report type
  const getFallbackSuggestions = (type) => {
    if (type === "forum") {
      return {
        summary:
          "AI service is temporarily unavailable. Here are some manual suggestions for your forum report:",
        keyPoints: [
          "Document the main discussion points from the meeting",
          "List any decisions made during the forum",
          "Identify action items and assign responsibilities",
          "Note any follow-up meetings or deadlines",
        ],
        recommendation:
          "Try the AI Assistant again when the service is available.",
        fullText:
          "AI service is temporarily unavailable. Please check back later.",
      };
    }
    return {
      summary: "AI service is temporarily unavailable. Please try again later.",
      keyPoints: [
        "Review your report content",
        "Check for completeness",
        "Verify all sections are filled",
      ],
      recommendation: "Try again in a few minutes.",
      fullText: "AI service is temporarily unavailable.",
    };
  };

  const applySuggestion = (text) => {
    if (onApply) onApply(text);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={generateSuggestions}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 16px",
          background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
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
            <span>✍️</span>
            AI Writing Assistant
          </>
        )}
      </button>

      {showSuggestions && suggestions && (
        <>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "clamp(300px, 80vw, 400px)",
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              border: "1px solid #E2E8F0",
              zIndex: 50,
              padding: "16px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>🧠</span>
                AI Suggestions
              </h4>
              <button
                onClick={() => setShowSuggestions(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#64748B",
                }}
              >
                ✕
              </button>
            </div>

            {suggestions.summary && (
              <div
                style={{
                  background: "#EFF6FF",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#1D4ED8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  📊 Summary
                </div>
                <p style={{ fontSize: "13px", color: "#1E293B", margin: 0 }}>
                  {suggestions.summary}
                </p>
              </div>
            )}

            {suggestions.keyPoints && suggestions.keyPoints.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "6px",
                  }}
                >
                  💡 Key Points
                </div>
                {suggestions.keyPoints.map((point, i) => (
                  <button
                    key={i}
                    onClick={() => applySuggestion(point)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "6px 10px",
                      background: "transparent",
                      border: "1px solid #E2E8F0",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#1E293B",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      marginBottom: "4px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F1F5F9";
                      e.currentTarget.style.borderColor = C.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }}
                  >
                    • {point}
                  </button>
                ))}
              </div>
            )}

            {suggestions.recommendation && (
              <div
                style={{
                  background: "#F0FDF4",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#15803D",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "4px",
                  }}
                >
                  🎯 Recommendation
                </div>
                <p style={{ fontSize: "13px", color: "#1E293B", margin: 0 }}>
                  {suggestions.recommendation}
                </p>
              </div>
            )}

            <button
              onClick={() => applySuggestion(suggestions.fullText)}
              style={{
                width: "100%",
                padding: "8px",
                background: "#F1F5F9",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#475569",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#E2E8F0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#F1F5F9";
              }}
            >
              📋 Apply All Suggestions
            </button>
          </div>

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setShowSuggestions(false)}
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

export default AIReportAssistant;
