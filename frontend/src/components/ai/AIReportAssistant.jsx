// frontend/src/components/ai/AIReportAssistant.jsx
// Enhanced AI-powered report writing assistant with advanced features

import { useState, useRef } from "react";
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
  FiDownload,
  FiClock,
  FiStar,
  FiThumbsUp,
  FiAlertCircle,
  FiFileText,
  FiMessageSquare,
  FiUsers,
  FiBookOpen,
  FiSend,
} from "react-icons/fi";

const AIReportAssistant = ({
  reportContext,
  onApply,
  onGenerateFullReport,
  type = "daily",
  className = "",
  buttonText = "AI Writing Assistant",
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState("suggestions"); // suggestions | full | custom
  const [customPrompt, setCustomPrompt] = useState("");
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const [customResponse, setCustomResponse] = useState("");
  const [savedSuggestions, setSavedSuggestions] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);

  const suggestionsRef = useRef(null);

  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    keyPoints: true,
    recommendation: true,
    fullReport: true,
    actionItems: true,
  });

  // ─── Generate Suggestions ──────────────────────────────────
  const generateSuggestions = async () => {
    setLoading(true);
    try {
      let response;
      let content = "";

      // Check if we have the necessary context
      if (!reportContext || Object.keys(reportContext).length === 0) {
        setFeedback({
          type: "error",
          message: "⚠️ Please provide report context first",
        });
        setTimeout(() => setFeedback(null), 3000);
        setLoading(false);
        return;
      }

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

      // If no content from API, use fallback
      if (!content || content.trim() === "") {
        const fallbackSuggestions = getFallbackSuggestions(type);
        setSuggestions(fallbackSuggestions);
        setWordCount(fallbackSuggestions.wordCount || 0);
        setReadTime(fallbackSuggestions.readTime || 0);
        setShowSuggestions(true);
        setLoading(false);
        return;
      }

      const lines = content.split("\n").filter(Boolean);

      // Calculate word count
      const fullText = content;
      const words = fullText.split(/\s+/).filter(Boolean);
      const wc = words.length;
      setWordCount(wc);
      setReadTime(Math.ceil(wc / 200)); // Average reading speed: 200 words per minute

      // Extract action items (lines that look like tasks)
      const actionItems = lines.filter(
        (line) =>
          line.match(
            /^(action|task|to do|next|follow-up|responsible|assign)/i,
          ) ||
          line.includes("✅") ||
          line.includes("📌") ||
          line.includes("→"),
      );

      const newSuggestions = {
        summary: lines[0] || "No summary available",
        keyPoints: lines.slice(1, 5).filter((l) => l.length > 10) || [],
        recommendation: lines[lines.length - 1] || "No recommendations",
        fullText: fullText,
        wordCount: wc,
        readTime: Math.ceil(wc / 200),
        actionItems: actionItems.length > 0 ? actionItems : [],
        topicCount: reportContext.topics?.filter((t) => t.trim()).length || 0,
        attendeeCount:
          reportContext.attendees?.filter((a) => a.trim()).length || 0,
      };

      setSuggestions(newSuggestions);
      setShowSuggestions(true);

      setFeedback({
        type: "success",
        message: "✅ Suggestions generated successfully!",
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      const fallbackSuggestions = getFallbackSuggestions(type);
      setSuggestions(fallbackSuggestions);
      setWordCount(fallbackSuggestions.wordCount || 0);
      setReadTime(fallbackSuggestions.readTime || 0);
      setShowSuggestions(true);
      setFeedback({
        type: "error",
        message: "⚠️ Failed to generate suggestions. Using fallback.",
      });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // ─── Generate Full Report ──────────────────────────────────
  const generateFullReport = async () => {
    if (!suggestions?.fullText) {
      await generateSuggestions();
    }

    // Compose full report with all sections
    const fullReport = `
📋 PEER FORUM MEETING REPORT
${"=".repeat(50)}

📅 Date: ${reportContext.date || new Date().toISOString().split("T")[0]}
👥 Attendees: ${reportContext.attendees?.filter((a) => a.trim()).join(", ") || "Not specified"}

📌 TOPICS DISCUSSED:
${
  reportContext.topics
    ?.filter((t) => t.trim())
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n") || "No topics listed"
}

💬 DISCUSSION SUMMARY:
${suggestions?.summary || "No summary available"}

🔑 KEY POINTS:
${suggestions?.keyPoints?.map((p) => `• ${p}`).join("\n") || "No key points"}

⚠️ GAPS IDENTIFIED:
${
  reportContext.gaps
    ?.filter((g) => g.trim())
    .map((g, i) => `${i + 1}. ${g}`)
    .join("\n") || "No gaps identified"
}

✅ AGREEMENTS REACHED:
${
  reportContext.agreements
    ?.filter((a) => a.trim())
    .map((a, i) => `${i + 1}. ${a}`)
    .join("\n") || "No agreements"
}

🎯 RECOMMENDATIONS:
${suggestions?.recommendation || "No recommendations available"}

📝 FULL MINUTES:
${suggestions?.fullText || "No content"}

${"=".repeat(50)}
Generated by AI Assistant • ${new Date().toLocaleString()}
    `;

    setSuggestions((prev) => ({ ...prev, fullReport }));
    setActiveTab("full");

    if (onGenerateFullReport) {
      onGenerateFullReport(fullReport);
    }

    setFeedback({
      type: "success",
      message: "✅ Full report generated successfully!",
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  // ─── Custom Prompt ─────────────────────────────────────────
  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) {
      setFeedback({
        type: "error",
        message: "⚠️ Please enter a custom instruction",
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setIsCustomLoading(true);
    try {
      // Build enhanced prompt with full context
      const enhancedPrompt = `
        Context: Forum report with topics: ${reportContext.topics?.filter((t) => t.trim()).join(", ")}
        Attendees: ${reportContext.attendees?.filter((a) => a.trim()).join(", ")}
        Custom instruction: ${customPrompt}
        Based on the meeting notes provided below.
      `;

      const response = await aiAPI.getMeetingMinutes({
        title: reportContext.title || "Peer Forum Report",
        date: reportContext.date || new Date().toISOString().split("T")[0],
        attendees: reportContext.attendees || [],
        agenda: reportContext.topics?.join("; ") || "",
        notes: [
          `Topics: ${reportContext.topics?.join("; ") || ""}`,
          `Explanation: ${reportContext.explanation || ""}`,
          `Gaps: ${reportContext.gaps?.join("; ") || ""}`,
          `Agreements: ${reportContext.agreements?.join("; ") || ""}`,
          `\nCustom instruction: ${enhancedPrompt}`,
        ].join("\n"),
      });

      const content =
        response.data?.minutes || response.data?.insight || "No response";
      setCustomResponse(content);
      setActiveTab("custom");
    } catch (error) {
      console.error("Custom prompt error:", error);
      setCustomResponse("Failed to process custom request. Please try again.");
    } finally {
      setIsCustomLoading(false);
    }
  };

  // ─── Apply Suggestion ──────────────────────────────────────
  const applySuggestion = (text) => {
    if (onApply) {
      // Add timestamp and source
      const appliedText = `[AI Generated - ${new Date().toLocaleTimeString()}]\n${text}`;
      onApply(appliedText);

      // Save the applied suggestion
      setSavedSuggestions((prev) => [
        ...prev,
        {
          text: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
          fullText: text,
          appliedAt: new Date(),
        },
      ]);

      // Show feedback
      setFeedback({
        type: "success",
        message: `✅ Suggestion applied successfully! (${savedSuggestions.length + 1} total applied)`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({
        type: "error",
        message: "⚠️ No apply handler provided",
      });
      setTimeout(() => setFeedback(null), 3000);
    }
    setShowSuggestions(false);
  };

  // ─── Export Suggestions ────────────────────────────────────
  const exportSuggestions = () => {
    if (!suggestions) return;

    const content = `
AI Report Assistant - Generated Report
${"=".repeat(60)}
Generated: ${new Date().toLocaleString()}
Word Count: ${wordCount || suggestions.wordCount || 0}
Read Time: ${readTime || suggestions.readTime || 0} min

SUMMARY:
${suggestions.summary || "N/A"}

KEY POINTS:
${suggestions.keyPoints?.map((p, i) => `${i + 1}. ${p}`).join("\n") || "N/A"}

RECOMMENDATION:
${suggestions.recommendation || "N/A"}

FULL TEXT:
${suggestions.fullText || "N/A"}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Quick Actions ─────────────────────────────────────────
  const quickActions = [
    {
      label: "Summarize",
      icon: <FiFileText size={14} />,
      action: generateSuggestions,
    },
    {
      label: "Full Report",
      icon: <FiBookOpen size={14} />,
      action: generateFullReport,
    },
    {
      label: "Export",
      icon: <FiDownload size={14} />,
      action: exportSuggestions,
    },
  ];

  // ─── Fallback Suggestions ──────────────────────────────────
  const getFallbackSuggestions = (type) => {
    if (type === "forum") {
      return {
        summary:
          "AI service is temporarily unavailable. Here are manual suggestions based on your input:",
        keyPoints: [
          "Document the main discussion points from the meeting",
          "List any decisions made during the forum",
          "Identify action items and assign responsibilities",
          "Note any follow-up meetings or deadlines",
        ],
        recommendation:
          "Try the AI Assistant again when the service is available.",
        fullText: `Forum Report Summary\n\nTopics discussed: ${reportContext.topics?.filter((t) => t.trim()).join(", ") || "Not specified"}\n\nAttendees: ${reportContext.attendees?.filter((a) => a.trim()).join(", ") || "Not specified"}\n\nKey points to document from this meeting.`,
        wordCount: 25,
        readTime: 1,
        actionItems: [
          "Review meeting notes",
          "Assign action items",
          "Schedule follow-up",
        ],
        topicCount: reportContext.topics?.filter((t) => t.trim()).length || 0,
        attendeeCount:
          reportContext.attendees?.filter((a) => a.trim()).length || 0,
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
      fullText:
        "AI service is temporarily unavailable. Please try again later.",
      wordCount: 15,
      readTime: 1,
      actionItems: [],
      topicCount: 0,
      attendeeCount: 0,
    };
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Quick Actions Row */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "8px",
        }}
      >
        <button
          onClick={generateSuggestions}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
            color: "#fff",
            border: "none",
            borderRadius: radius.md,
            fontSize: "clamp(12px, 3vw, 13px)",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.3s ease",
            fontFamily: F.sans,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(124,58,237,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
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

        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "8px 14px",
              background: "#F1F5F9",
              color: "#475569",
              border: `1px solid ${C.border}`,
              borderRadius: radius.md,
              fontSize: "clamp(11px, 2.5vw, 12px)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: F.sans,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#E2E8F0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 20px",
            background: feedback.type === "success" ? "#10b981" : "#ef4444",
            color: "#fff",
            borderRadius: radius.md,
            boxShadow: shadows.xl,
            zIndex: 1000,
            animation: "slideUp 0.3s ease",
            fontFamily: F.sans,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {feedback.type === "success" ? (
            <FiCheckCircle size={18} />
          ) : (
            <FiAlertCircle size={18} />
          )}
          {feedback.message}
        </div>
      )}

      {showSuggestions && suggestions && (
        <>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 12px)",
              width: "clamp(360px, 80vw, 500px)",
              background: "#fff",
              borderRadius: radius.xl,
              boxShadow: shadows.xl,
              border: `1px solid ${C.border}`,
              zIndex: 50,
              padding: "20px",
              maxHeight: "600px",
              overflowY: "auto",
              animation: "slideDown 0.3s ease",
            }}
            ref={suggestionsRef}
          >
            {/* Header with Tabs */}
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
                    AI Report Assistant
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      color: C.muted,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{wordCount || suggestions.wordCount || 0} words</span>
                    <span>•</span>
                    <span>
                      <FiClock size={10} />{" "}
                      {readTime || suggestions.readTime || 0} min read
                    </span>
                    {suggestions.topicCount > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          <FiMessageSquare size={10} /> {suggestions.topicCount}{" "}
                          topics
                        </span>
                      </>
                    )}
                    {suggestions.attendeeCount > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          <FiUsers size={10} /> {suggestions.attendeeCount}{" "}
                          attendees
                        </span>
                      </>
                    )}
                    {savedSuggestions.length > 0 && (
                      <>
                        <span>•</span>
                        <span style={{ color: "#10b981" }}>
                          <FiCheckCircle size={10} /> {savedSuggestions.length}{" "}
                          applied
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={exportSuggestions}
                  style={{
                    ...btn.small,
                    padding: "4px 8px",
                    fontSize: "11px",
                  }}
                  title="Export report"
                >
                  <FiDownload size={14} />
                </button>
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
            </div>

            {/* Quick Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  background: "#F8FAFC",
                  padding: "8px",
                  borderRadius: radius.md,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: C.primary,
                  }}
                >
                  {wordCount || suggestions.wordCount || 0}
                </div>
                <div style={{ fontSize: "10px", color: C.muted }}>Words</div>
              </div>
              <div
                style={{
                  background: "#F8FAFC",
                  padding: "8px",
                  borderRadius: radius.md,
                  textAlign: "center",
                }}
              >
                <div
                  style={{ fontSize: "18px", fontWeight: 700, color: C.gold }}
                >
                  {suggestions.keyPoints?.length || 0}
                </div>
                <div style={{ fontSize: "10px", color: C.muted }}>
                  Key Points
                </div>
              </div>
              <div
                style={{
                  background: "#F8FAFC",
                  padding: "8px",
                  borderRadius: radius.md,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#10b981",
                  }}
                >
                  {suggestions.actionItems?.length || 0}
                </div>
                <div style={{ fontSize: "10px", color: C.muted }}>Actions</div>
              </div>
            </div>

            {/* Saved Suggestions Count Badge */}
            {savedSuggestions.length > 0 && (
              <div
                style={{
                  background: "#ECFDF5",
                  padding: "8px 12px",
                  borderRadius: radius.md,
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid #A7F3D0",
                }}
              >
                <FiCheckCircle size={14} color="#10b981" />
                <span style={{ fontSize: "12px", color: "#065F46" }}>
                  {savedSuggestions.length} suggestion
                  {savedSuggestions.length > 1 ? "s" : ""} applied to report
                </span>
                <button
                  onClick={() => {
                    setSavedSuggestions([]);
                    setFeedback({
                      type: "success",
                      message: "🗑️ Cleared applied suggestions history",
                    });
                    setTimeout(() => setFeedback(null), 3000);
                  }}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "none",
                    color: "#DC2626",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                marginBottom: "12px",
                background: "#F1F5F9",
                borderRadius: radius.md,
                padding: "4px",
              }}
            >
              {["suggestions", "full", "custom"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: "6px 12px",
                    background: activeTab === tab ? "#fff" : "transparent",
                    border: "none",
                    borderRadius: radius.md,
                    fontSize: "12px",
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? C.dark : C.muted,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: activeTab === tab ? shadows.sm : "none",
                  }}
                >
                  {tab === "suggestions" && "✨ Suggestions"}
                  {tab === "full" && "📄 Full Report"}
                  {tab === "custom" && "✏️ Custom"}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "suggestions" && (
              <>
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
                          {
                            suggestions.summary.split(/\s+/).filter(Boolean)
                              .length
                          }{" "}
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
                        <button
                          onClick={() => applySuggestion(suggestions.summary)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "8px",
                            padding: "4px 12px",
                            background: "#3B82F6",
                            color: "#fff",
                            border: "none",
                            borderRadius: radius.md,
                            fontSize: "11px",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#2563EB";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#3B82F6";
                          }}
                        >
                          <FiCopy size={12} />
                          Apply Summary
                        </button>
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
                              e.currentTarget.style.transform =
                                "translateX(4px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.borderColor = C.border;
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <span
                              style={{ marginRight: "8px", color: C.primary }}
                            >
                              •
                            </span>
                            {point}
                            <span
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "10px",
                                color: C.primary,
                                opacity: 0,
                                transition: "opacity 0.2s ease",
                              }}
                              className="apply-hint"
                            >
                              Click to apply →
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

                {/* Action Items */}
                {suggestions.actionItems &&
                  suggestions.actionItems.length > 0 && (
                    <div
                      style={{
                        marginBottom: "12px",
                        border: `1px solid ${C.border}`,
                        borderRadius: radius.md,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        onClick={() => toggleSection("actionItems")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          background: "#FEF3C7",
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
                          <FiStar size={14} />
                          Action Items ({suggestions.actionItems.length})
                        </div>
                        <span style={{ color: "#92400E" }}>
                          {expandedSections.actionItems ? (
                            <FiChevronDown size={14} />
                          ) : (
                            <FiChevronRight size={14} />
                          )}
                        </span>
                      </div>
                      {expandedSections.actionItems && (
                        <div style={{ padding: "10px 14px" }}>
                          {suggestions.actionItems.map((item, i) => (
                            <div
                              key={i}
                              style={{
                                padding: "6px 10px",
                                marginBottom: "4px",
                                background: "#FFFBEB",
                                borderRadius: radius.sm,
                                fontSize: "12px",
                                color: "#78350F",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <span style={{ fontSize: "16px" }}>📌</span>
                              {item}
                            </div>
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
                        <button
                          onClick={() =>
                            applySuggestion(suggestions.recommendation)
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "8px",
                            padding: "4px 12px",
                            background: "#F59E0B",
                            color: "#fff",
                            border: "none",
                            borderRadius: radius.md,
                            fontSize: "11px",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#D97706";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#F59E0B";
                          }}
                        >
                          <FiCopy size={12} />
                          Apply Recommendation
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === "full" && (
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: "1.8",
                  color: "#1E293B",
                  whiteSpace: "pre-wrap",
                  fontFamily: F.sans,
                  maxHeight: "300px",
                  overflowY: "auto",
                  padding: "12px",
                  background: "#F8FAFC",
                  borderRadius: radius.md,
                }}
              >
                {suggestions.fullReport ||
                  suggestions.fullText ||
                  "Generate a full report first."}
                <button
                  onClick={() =>
                    applySuggestion(
                      suggestions.fullReport ||
                        suggestions.fullText ||
                        "No content",
                    )
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "12px",
                    padding: "8px 16px",
                    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                    color: "#fff",
                    border: "none",
                    borderRadius: radius.md,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <FiCopy size={14} />
                  Apply Full Report
                </button>
              </div>
            )}

            {activeTab === "custom" && (
              <div>
                <div
                  style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
                >
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Custom instruction (e.g., 'Summarize in bullet points')"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: radius.md,
                      fontSize: "13px",
                      outline: "none",
                      fontFamily: F.sans,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                    }}
                  />
                  <button
                    onClick={handleCustomPrompt}
                    disabled={isCustomLoading || !customPrompt.trim()}
                    style={{
                      padding: "8px 16px",
                      background:
                        isCustomLoading || !customPrompt.trim()
                          ? "#CBD5E1"
                          : C.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: radius.md,
                      cursor:
                        isCustomLoading || !customPrompt.trim()
                          ? "default"
                          : "pointer",
                      fontWeight: 600,
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isCustomLoading && customPrompt.trim()) {
                        e.currentTarget.style.background = C.light;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCustomLoading && customPrompt.trim()) {
                        e.currentTarget.style.background = C.primary;
                      }
                    }}
                  >
                    {isCustomLoading ? (
                      <>
                        <FiLoader
                          size={14}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiSend size={14} />
                        Send
                      </>
                    )}
                  </button>
                </div>

                {customResponse && (
                  <div
                    style={{
                      fontSize: "13px",
                      lineHeight: "1.8",
                      color: "#1E293B",
                      whiteSpace: "pre-wrap",
                      fontFamily: F.sans,
                      maxHeight: "250px",
                      overflowY: "auto",
                      padding: "12px",
                      background: "#F8FAFC",
                      borderRadius: radius.md,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {customResponse}
                    <button
                      onClick={() => applySuggestion(customResponse)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "12px",
                        padding: "6px 14px",
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: radius.md,
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#059669";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#10b981";
                      }}
                    >
                      <FiCheckCircle size={14} />
                      Apply This
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Apply All Button */}
            <button
              onClick={() =>
                applySuggestion(
                  suggestions.fullText || suggestions.summary || "No content",
                )
              }
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
              Apply to Report
              <FiArrowRight size={14} />
            </button>

            {/* Feedback Footer */}
            <div
              style={{
                marginTop: "12px",
                paddingTop: "10px",
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                color: C.muted,
              }}
            >
              <span>
                <FiThumbsUp size={12} style={{ marginRight: "4px" }} />
                Helpful? Click any suggestion to apply
              </span>
              <span>
                <FiClock size={12} style={{ marginRight: "4px" }} />
                {new Date().toLocaleTimeString()}
              </span>
            </div>
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
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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
