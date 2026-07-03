// frontend/src/components/ai/AIReportAssistant.jsx
// Enhanced AI-powered report writing assistant with suggestions

import { useState } from "react";
import { aiAPI } from "../../services/api";
import { C, F, btn, radius, shadows } from "../../styles/theme";
import {
  FiZap,
  FiLoader,
  FiX,
  FiInfo,
  FiCheckCircle,
  FiTrendingUp,
  FiCopy,
  FiChevronDown,
  FiChevronRight,
  FiArrowRight,
} from "react-icons/fi";

const AIReportAssistant = ({
  reportContext,
  onApply,
  type = "daily",
  className = "",
  buttonText = "AI Writing Assistant",
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    keyPoints: true,
    recommendation: true,
  });

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      let response;
      let content = "";

      if (type === "forum") {
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
        response = await aiAPI.getEvaluationSummary({
          evaluationData: reportContext,
        });
        content = response.data?.summary || "";
      } else {
        response = await aiAPI.getDailyInsight(null, reportContext);
        content = response.data?.insight || "";
      }

      const lines = content.split("\n").filter(Boolean);

      setSuggestions({
        summary: lines[0] || "",
        keyPoints: lines.slice(1, 4).filter((l) => l.length > 10) || [],
        recommendation: lines[lines.length - 1] || "",
        fullText: content,
        wordCount: content.split(/\s+/).filter(Boolean).length,
      });
      setShowSuggestions(true);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      const fallbackSuggestions = getFallbackSuggestions(type);
      setSuggestions(fallbackSuggestions);
      setShowSuggestions(true);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackSuggestions = (type) => {
    if (type === "forum") {
      return {
        summary:
          "AI service is temporarily unavailable. Here are manual suggestions:",
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
        wordCount: 20,
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
      wordCount: 15,
    };
  };

  const applySuggestion = (text) => {
    if (onApply) onApply(text);
    setShowSuggestions(false);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={generateSuggestions}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
          color: "#fff",
          border: "none",
          borderRadius: radius.lg,
          fontSize: "clamp(13px, 3.5vw, 14px)",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.3s ease",
          fontFamily: F.sans,
          boxShadow: loading ? "none" : `0 4px 16px ${"#7C3AED"}44`,
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(124,58,237,0.4)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = loading
            ? "none"
            : `0 4px 16px ${"#7C3AED"}44`;
        }}
      >
        {loading ? (
          <>
            <FiLoader
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Generating...
          </>
        ) : (
          <>
            <FiZap size={16} />
            {buttonText}
          </>
        )}
      </button>

      {showSuggestions && suggestions && (
        <>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 12px)",
              width: "clamp(320px, 80vw, 450px)",
              background: "#fff",
              borderRadius: radius.xl,
              boxShadow: shadows.xl,
              border: `1px solid ${C.border}`,
              zIndex: 50,
              padding: "20px",
              maxHeight: "500px",
              overflowY: "auto",
              animation: "slideDown 0.3s ease",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                  }}
                >
                  <FiZap size={16} />
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#0F172A",
                      fontFamily: F.sans,
                    }}
                  >
                    AI Suggestions
                  </h4>
                  {suggestions.wordCount && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "11px",
                        color: C.muted,
                      }}
                    >
                      {suggestions.wordCount} words • AI generated
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                style={{
                  ...btn.icon,
                  color: "#64748B",
                  padding: "4px",
                }}
                aria-label="Close suggestions"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Summary */}
            {suggestions.summary && (
              <div
                style={{
                  marginBottom: "12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: radius.md,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => toggleSection("summary")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#EFF6FF",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1D4ED8",
                    }}
                  >
                    <FiInfo size={14} />
                    Summary
                    <span
                      style={{
                        fontSize: "9px",
                        background: "#DBEAFE",
                        color: "#1D4ED8",
                        padding: "1px 8px",
                        borderRadius: radius.pill,
                      }}
                    >
                      {suggestions.summary.split(/\s+/).filter(Boolean).length}{" "}
                      words
                    </span>
                  </div>
                  <span style={{ color: "#1D4ED8" }}>
                    {expandedSections.summary ? (
                      <FiChevronDown size={14} />
                    ) : (
                      <FiChevronRight size={14} />
                    )}
                  </span>
                </div>
                {expandedSections.summary && (
                  <div
                    style={{
                      padding: "12px 14px",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      color: "#1E293B",
                    }}
                  >
                    {suggestions.summary}
                  </div>
                )}
              </div>
            )}

            {/* Key Points */}
            {suggestions.keyPoints && suggestions.keyPoints.length > 0 && (
              <div
                style={{
                  marginBottom: "12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: radius.md,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => toggleSection("keyPoints")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#F0FDF4",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#15803D",
                    }}
                  >
                    <FiCheckCircle size={14} />
                    Key Points ({suggestions.keyPoints.length})
                  </div>
                  <span style={{ color: "#15803D" }}>
                    {expandedSections.keyPoints ? (
                      <FiChevronDown size={14} />
                    ) : (
                      <FiChevronRight size={14} />
                    )}
                  </span>
                </div>
                {expandedSections.keyPoints && (
                  <div style={{ padding: "10px 14px" }}>
                    {suggestions.keyPoints.map((point, i) => (
                      <button
                        key={i}
                        onClick={() => applySuggestion(point)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          marginBottom: "6px",
                          background: "transparent",
                          border: `1px solid ${C.border}`,
                          borderRadius: radius.md,
                          fontSize: "13px",
                          color: "#1E293B",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontFamily: F.sans,
                          lineHeight: 1.4,
                          position: "relative",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F1F5F9";
                          e.currentTarget.style.borderColor = C.primary;
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor = C.border;
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        <span style={{ marginRight: "8px", color: C.primary }}>
                          •
                        </span>
                        {point}
                        <span
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "11px",
                            color: C.primary,
                            opacity: 0,
                            transition: "opacity 0.2s ease",
                          }}
                          className="apply-hint"
                        >
                          Click to apply
                        </span>
                        <style>{`
                          button:hover .apply-hint {
                            opacity: 1;
                          }
                        `}</style>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            {suggestions.recommendation && (
              <div
                style={{
                  marginBottom: "12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: radius.md,
                  overflow: "hidden",
                }}
              >
                <div
                  onClick={() => toggleSection("recommendation")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#FFFBEB",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#92400E",
                    }}
                  >
                    <FiTrendingUp size={14} />
                    Recommendation
                  </div>
                  <span style={{ color: "#92400E" }}>
                    {expandedSections.recommendation ? (
                      <FiChevronDown size={14} />
                    ) : (
                      <FiChevronRight size={14} />
                    )}
                  </span>
                </div>
                {expandedSections.recommendation && (
                  <div
                    style={{
                      padding: "12px 14px",
                      fontSize: "13px",
                      lineHeight: 1.6,
                      color: "#1E293B",
                    }}
                  >
                    {suggestions.recommendation}
                  </div>
                )}
              </div>
            )}

            {/* Full Text Apply Button */}
            <button
              onClick={() => applySuggestion(suggestions.fullText)}
              style={{
                width: "100%",
                padding: "10px",
                background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                color: "#fff",
                border: "none",
                borderRadius: radius.md,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: F.sans,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(124,58,237,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <FiCopy size={14} />
              Apply All Suggestions
              <FiArrowRight size={14} />
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
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AIReportAssistant;
