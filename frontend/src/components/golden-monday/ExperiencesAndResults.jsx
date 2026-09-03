// src/components/golden-monday/ExperiencesAndResults.jsx
// Experiences Shared (Kirkpatrick Levels 1-2) & Results Gained (Kirkpatrick Levels 3-4)
// Enhanced with beautiful UI, animations, and full translation support

import { useState, useEffect, useCallback, useRef } from "react";
import { C, F } from "../../styles/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import ConfirmModal from "../common/ConfirmModal";
import {
  FiThumbsUp,
  FiMessageCircle,
  FiTrendingUp,
  FiCheckCircle,
  FiStar,
  FiTrash2,
  FiPlus,
  FiX,
  FiBriefcase,
  FiClock,
  FiZap,
  FiSend,
  FiLoader,
  FiFilter,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const OUTCOME_CATEGORIES = [
  { value: "efficiency", label: "Efficiency", emoji: "⚡" },
  { value: "quality", label: "Quality", emoji: "🌟" },
  { value: "morale", label: "Morale", emoji: "💪" },
  { value: "retention", label: "Retention", emoji: "🤝" },
  { value: "revenue", label: "Revenue", emoji: "💰" },
  { value: "other", label: "Other", emoji: "📌" },
];

const TIMEFRAMES = [
  { value: "immediate", label: "Immediate", emoji: "⚡" },
  { value: "within-month", label: "Within a Month", emoji: "📅" },
  { value: "within-quarter", label: "Within a Quarter", emoji: "📊" },
  { value: "within-year", label: "Within a Year", emoji: "📈" },
];

const getCategoryEmoji = (category) => {
  const found = OUTCOME_CATEGORIES.find((c) => c.value === category);
  return found?.emoji || "📌";
};

const getTimeframeEmoji = (timeframe) => {
  const found = TIMEFRAMES.find((t) => t.value === timeframe);
  return found?.emoji || "📅";
};

export default function ExperiencesAndResults({ sessionId }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const [activeTab, setActiveTab] = useState("experience");
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState([]);
  const [results, setResults] = useState([]);
  const [filterTag, setFilterTag] = useState("all");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    whatILearned: "",
    relevanceRating: 5,
    wouldRecommend: true,
    whatIApplied: "",
    measurableOutcome: "",
    outcomeCategory: "other",
    timeframe: "within-month",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    id: null,
    title: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [endorsingId, setEndorsingId] = useState(null);

  const isMounted = useRef(true);
  const isInitialLoad = useRef(true);

  // Get all unique tags from experiences
  const getAllTags = useCallback(() => {
    const tagSet = new Set();
    experiences.forEach((exp) => {
      [...(exp.tags || []), ...(exp.aiSuggestedTags || [])].forEach((tag) => {
        if (tag && tag.trim()) tagSet.add(tag.trim());
      });
    });
    return Array.from(tagSet).sort();
  }, [experiences]);

  const loadData = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const [expRes, resRes] = await Promise.all([
        goldenMondayAPI.getExperiences(sessionId, null, 1, 20),
        goldenMondayAPI.getResults(sessionId, "all", 1, 20),
      ]);
      if (isMounted.current) {
        setExperiences(expRes.data.experiences || []);
        setResults(resRes.data.results || []);
      }
    } catch (err) {
      console.error("Failed to load experiences/results:", err);
      if (isMounted.current) {
        showToast(t.loadError || "Failed to load data", "error");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [sessionId, t]);

  useEffect(() => {
    isMounted.current = true;
    isInitialLoad.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadData();
    }
  }, [loadData]);

  const handleEndorse = async (type, id) => {
    setEndorsingId(id);
    try {
      const response =
        type === "experience"
          ? await goldenMondayAPI.endorseExperience(id)
          : await goldenMondayAPI.endorseResult(id);
      if (response.data.success) {
        await loadData();
        showToast(t.endorsementUpdated || "Endorsement updated!", "success");
      }
    } catch (err) {
      console.error("Failed to endorse:", err);
      showToast(t.failedEndorse || "Failed to endorse", "error");
    } finally {
      setEndorsingId(null);
    }
  };

  const handleDelete = async (type, id) => {
    setConfirmModal({
      isOpen: true,
      type,
      id,
      title: t.deleteConfirmTitle || "Delete Confirmation",
      message:
        t.deleteConfirmMessage ||
        `Are you sure you want to delete this ${type}? This action cannot be undone.`,
    });
  };

  const confirmDelete = async () => {
    const { type, id } = confirmModal;
    try {
      type === "experience"
        ? await goldenMondayAPI.deleteExperience(id)
        : await goldenMondayAPI.deleteResult(id);
      await loadData();
      showToast(t.deleteSuccess || "Deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete:", err);
      showToast(t.deleteError || "Failed to delete", "error");
    } finally {
      setConfirmModal({
        isOpen: false,
        type: null,
        id: null,
        title: "",
        message: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        session: sessionId || null,
        ...formData,
      };
      if (activeTab === "experience") {
        await goldenMondayAPI.createExperience(payload);
        showToast(t.experienceShared || "Experience shared! 🎉", "success");
      } else {
        await goldenMondayAPI.createResult(payload);
        showToast(t.resultLogged || "Result logged! 🎉", "success");
      }
      setShowForm(false);
      setFormData({
        whatILearned: "",
        relevanceRating: 5,
        wouldRecommend: true,
        whatIApplied: "",
        measurableOutcome: "",
        outcomeCategory: "other",
        timeframe: "within-month",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to submit:", err);
      showToast(t.submitError || "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderExperienceCard = (exp) => {
    const isEndorsed = exp.endorsedBy?.some((id) => id === user?._id);
    const isOwner = exp.user?._id === user?._id;
    const isPrivileged = ["admin", "superadmin", "leader"].includes(user?.role);
    const allTags = [...(exp.tags || []), ...(exp.aiSuggestedTags || [])];

    return (
      <div
        key={exp._id}
        style={{
          background: C.white,
          borderRadius: 14,
          padding: "18px 22px",
          border: `1px solid ${isEndorsed ? C.primary : C.border}`,
          marginBottom: 12,
          transition: "all 0.3s ease",
          boxShadow: isEndorsed
            ? `0 4px 16px ${C.primary}15`
            : "0 2px 8px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isEndorsed
            ? `0 4px 16px ${C.primary}15`
            : "0 2px 8px rgba(0,0,0,0.04)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {exp.userName?.charAt(0) || "?"}
              </div>
              <strong style={{ color: C.dark, fontSize: 14 }}>
                {exp.userName || t.unknown || "Unknown"}
              </strong>
              <span style={{ fontSize: 11, color: C.muted }}>
                <FiClock size={12} style={{ marginRight: 4 }} />
                {formatDistanceToNow(new Date(exp.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {exp.department && (
                <span
                  style={{
                    fontSize: 10,
                    background: C.bg,
                    padding: "2px 10px",
                    borderRadius: 12,
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiBriefcase size={10} />
                  {exp.department}
                </span>
              )}
              {isOwner && (
                <span
                  style={{
                    fontSize: 9,
                    background: C.primary + "15",
                    color: C.primary,
                    padding: "1px 8px",
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {t.you || "You"}
                </span>
              )}
            </div>

            <p
              style={{
                marginTop: 10,
                fontSize: 14,
                lineHeight: 1.7,
                color: C.dark,
                background: C.bg,
                padding: "12px 16px",
                borderRadius: 8,
                borderLeft: `3px solid ${C.primary}`,
              }}
            >
              {exp.whatILearned}
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                flexWrap: "wrap",
                marginTop: 8,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 13,
                  background: C.bg,
                  padding: "2px 10px",
                  borderRadius: 12,
                }}
              >
                <FiStar size={14} color={C.gold} />
                {exp.relevanceRating}/5 {t.relevance || "Relevance"}
              </span>
              {exp.wouldRecommend && (
                <span
                  style={{
                    fontSize: 12,
                    color: "#10b981",
                    background: "#d1fae5",
                    padding: "2px 10px",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiCheckCircle size={14} />
                  {t.wouldRecommend || "Would Recommend"}
                </span>
              )}
              {allTags.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {allTags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        background: C.primary + "08",
                        color: C.primary,
                        padding: "1px 10px",
                        borderRadius: 12,
                        border: `1px solid ${C.primary}15`,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {allTags.length > 3 && (
                    <span style={{ fontSize: 10, color: C.muted }}>
                      +{allTags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => handleEndorse("experience", exp._id)}
              disabled={endorsingId === exp._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: isEndorsed ? C.primary : "transparent",
                color: isEndorsed ? "#fff" : C.muted,
                border: `1px solid ${isEndorsed ? C.primary : C.border}`,
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: isEndorsed ? 600 : 400,
                cursor: endorsingId === exp._id ? "not-allowed" : "pointer",
                opacity: endorsingId === exp._id ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isEndorsed) {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.background = C.primary + "08";
                }
              }}
              onMouseLeave={(e) => {
                if (!isEndorsed) {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {endorsingId === exp._id ? (
                <FiLoader
                  size={12}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <FiThumbsUp size={14} />
              )}
              {exp.endorsedBy?.length || 0}
            </button>
            {(isOwner || isPrivileged) && (
              <button
                onClick={() => handleDelete("experience", exp._id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  padding: "6px 8px",
                  borderRadius: 6,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResultCard = (res) => {
    const isEndorsed = res.endorsedBy?.some((id) => id === user?._id);
    const isOwner = res.user?._id === user?._id;
    const isPrivileged = ["admin", "superadmin", "leader"].includes(user?.role);

    return (
      <div
        key={res._id}
        style={{
          background: C.white,
          borderRadius: 14,
          padding: "18px 22px",
          border: `1px solid ${isEndorsed ? "#10b981" : C.border}`,
          marginBottom: 12,
          transition: "all 0.3s ease",
          boxShadow: isEndorsed
            ? "0 4px 16px rgba(16, 185, 129, 0.15)"
            : "0 2px 8px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isEndorsed
            ? "0 4px 16px rgba(16, 185, 129, 0.15)"
            : "0 2px 8px rgba(0,0,0,0.04)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, #10b981, #34d399)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {res.userName?.charAt(0) || "?"}
              </div>
              <strong style={{ color: C.dark, fontSize: 14 }}>
                {res.userName || t.unknown || "Unknown"}
              </strong>
              <span style={{ fontSize: 11, color: C.muted }}>
                <FiClock size={12} style={{ marginRight: 4 }} />
                {formatDistanceToNow(new Date(res.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {res.department && (
                <span
                  style={{
                    fontSize: 10,
                    background: C.bg,
                    padding: "2px 10px",
                    borderRadius: 12,
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiBriefcase size={10} />
                  {res.department}
                </span>
              )}
              {isOwner && (
                <span
                  style={{
                    fontSize: 9,
                    background: C.primary + "15",
                    color: C.primary,
                    padding: "1px 8px",
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {t.you || "You"}
                </span>
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                padding: "12px 16px",
                background: `${C.primary}04`,
                borderRadius: 8,
                borderLeft: `3px solid #10b981`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: C.dark,
                }}
              >
                <strong style={{ color: "#10b981" }}>
                  {t.whatIApplied || "Applied"}:
                </strong>{" "}
                {res.whatIApplied}
              </p>
              {res.measurableOutcome && (
                <p style={{ marginTop: 6, fontSize: 14, color: C.primary }}>
                  <strong>{t.measurableOutcome || "Outcome"}:</strong>{" "}
                  {res.measurableOutcome}
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  background: C.bg,
                  padding: "2px 12px",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {getCategoryEmoji(res.outcomeCategory)}
                {OUTCOME_CATEGORIES.find((c) => c.value === res.outcomeCategory)
                  ?.label || res.outcomeCategory}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {getTimeframeEmoji(res.timeframe)}
                {TIMEFRAMES.find((t) => t.value === res.timeframe)?.label ||
                  res.timeframe}
              </span>
              {res.experience && (
                <span
                  style={{
                    fontSize: 11,
                    color: "#8b5cf6",
                    background: "#f5f3ff",
                    padding: "2px 10px",
                    borderRadius: 12,
                  }}
                >
                  <FiZap size={12} style={{ marginRight: 4 }} />
                  {t.linkedToExperience || "Linked to experience"}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => handleEndorse("result", res._id)}
              disabled={endorsingId === res._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: isEndorsed ? "#10b981" : "transparent",
                color: isEndorsed ? "#fff" : C.muted,
                border: `1px solid ${isEndorsed ? "#10b981" : C.border}`,
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: isEndorsed ? 600 : 400,
                cursor: endorsingId === res._id ? "not-allowed" : "pointer",
                opacity: endorsingId === res._id ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isEndorsed) {
                  e.currentTarget.style.borderColor = "#10b981";
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isEndorsed) {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {endorsingId === res._id ? (
                <FiLoader
                  size={12}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <FiThumbsUp size={14} />
              )}
              {res.endorsedBy?.length || 0}
            </button>
            {(isOwner || isPrivileged) && (
              <button
                onClick={() => handleDelete("result", res._id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  padding: "6px 8px",
                  borderRadius: 6,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredExperiences =
    filterTag === "all"
      ? experiences
      : experiences.filter((e) => {
          const allTags = [...(e.tags || []), ...(e.aiSuggestedTags || [])];
          return allTags.includes(filterTag);
        });

  const tags = getAllTags();

  return (
    <div style={{ fontFamily: F.sans }}>
      {/* Tabs - Enhanced */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          borderBottom: `2px solid ${C.border}`,
          paddingBottom: 10,
          background: C.white,
          borderRadius: "12px 12px 0 0",
          padding: "4px 4px 0 4px",
        }}
      >
        <button
          onClick={() => setActiveTab("experience")}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background:
              activeTab === "experience"
                ? `linear-gradient(135deg, ${C.primary}, ${C.gold})`
                : "transparent",
            color: activeTab === "experience" ? "#fff" : C.muted,
            border: "none",
            fontWeight: activeTab === "experience" ? 700 : 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            transition: "all 0.3s ease",
            flex: 1,
            justifyContent: "center",
            boxShadow:
              activeTab === "experience" ? `0 4px 16px ${C.primary}33` : "none",
          }}
        >
          <FiMessageCircle size={18} />
          {t.tabExperiences || "Experiences Shared"}
          <span
            style={{
              fontSize: 11,
              background:
                activeTab === "experience" ? "rgba(255,255,255,0.2)" : C.bg,
              padding: "1px 10px",
              borderRadius: 12,
            }}
          >
            {experiences.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("result")}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background:
              activeTab === "result"
                ? `linear-gradient(135deg, #10b981, #34d399)`
                : "transparent",
            color: activeTab === "result" ? "#fff" : C.muted,
            border: "none",
            fontWeight: activeTab === "result" ? 700 : 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            transition: "all 0.3s ease",
            flex: 1,
            justifyContent: "center",
            boxShadow:
              activeTab === "result"
                ? "0 4px 16px rgba(16, 185, 129, 0.33)"
                : "none",
          }}
        >
          <FiTrendingUp size={18} />
          {t.tabResults || "Results Gained"}
          <span
            style={{
              fontSize: 11,
              background:
                activeTab === "result" ? "rgba(255,255,255,0.2)" : C.bg,
              padding: "1px 10px",
              borderRadius: 12,
            }}
          >
            {results.length}
          </span>
        </button>
      </div>

      {/* Filter Tags - Enhanced */}
      {activeTab === "experience" && tags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
            padding: "8px 12px",
            background: C.bg,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
          }}
        >
          <FiFilter size={14} color={C.muted} style={{ marginRight: 4 }} />
          <button
            onClick={() => setFilterTag("all")}
            style={{
              padding: "4px 14px",
              borderRadius: 16,
              border: `1.5px solid ${filterTag === "all" ? C.primary : C.border}`,
              background: filterTag === "all" ? C.primary : "transparent",
              color: filterTag === "all" ? "#fff" : C.muted,
              fontSize: 11,
              fontWeight: filterTag === "all" ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {t.all || "All"}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              style={{
                padding: "4px 14px",
                borderRadius: 16,
                border: `1.5px solid ${filterTag === tag ? C.primary : C.border}`,
                background: filterTag === tag ? C.primary : "transparent",
                color: filterTag === tag ? "#fff" : C.muted,
                fontSize: 11,
                fontWeight: filterTag === tag ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Header / Post Button - Enhanced */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 13, color: C.muted }}>
          {activeTab === "experience"
            ? t.experiencesDescription ||
              "Share what you learned and how relevant it was."
            : t.resultsDescription ||
              "Log what you applied and the measurable outcome."}
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 10,
            background: showForm
              ? "#ef4444"
              : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
            color: "#fff",
            border: "none",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: showForm ? "none" : `0 4px 16px ${C.primary}33`,
          }}
          onMouseEnter={(e) => {
            if (!showForm) {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = `0 6px 24px ${C.primary}55`;
            }
          }}
          onMouseLeave={(e) => {
            if (!showForm) {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}33`;
            }
          }}
        >
          {showForm ? <FiX size={18} /> : <FiPlus size={18} />}
          {showForm ? t.close || "Close" : t.share || "Share"}
        </button>
      </div>

      {/* Form - Enhanced */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: `linear-gradient(135deg, ${C.bg}, ${C.white})`,
            borderRadius: 14,
            padding: "clamp(16px, 3vw, 24px)",
            marginBottom: 24,
            border: `2px solid ${C.primary}22`,
            boxShadow: `0 4px 20px ${C.primary}08`,
          }}
        >
          {activeTab === "experience" ? (
            <>
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: C.dark,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {t.whatILearned || "What did you learn?"}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.whatILearned}
                  onChange={(e) =>
                    setFormData({ ...formData, whatILearned: e.target.value })
                  }
                  placeholder={
                    t.whatILearnedPlaceholder || "Share your key takeaways..."
                  }
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    fontFamily: F.sans,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    resize: "vertical",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: C.dark,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {t.relevanceRating || "Relevance (1-5)"}
                  </label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, relevanceRating: v })
                        }
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: `2px solid ${formData.relevanceRating === v ? C.primary : C.border}`,
                          background:
                            formData.relevanceRating === v
                              ? C.primary
                              : "transparent",
                          color:
                            formData.relevanceRating === v ? "#fff" : C.dark,
                          fontWeight:
                            formData.relevanceRating === v ? 700 : 400,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {v}★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: C.dark,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {t.wouldRecommend || "Would you recommend?"}
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, wouldRecommend: true })
                      }
                      style={{
                        padding: "6px 16px",
                        borderRadius: 8,
                        border: `2px solid ${formData.wouldRecommend ? "#10b981" : C.border}`,
                        background: formData.wouldRecommend
                          ? "#d1fae5"
                          : "transparent",
                        color: formData.wouldRecommend ? "#065f46" : C.dark,
                        fontWeight: formData.wouldRecommend ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      ✅ Yes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, wouldRecommend: false })
                      }
                      style={{
                        padding: "6px 16px",
                        borderRadius: 8,
                        border: `2px solid ${!formData.wouldRecommend ? "#ef4444" : C.border}`,
                        background: !formData.wouldRecommend
                          ? "#fee2e2"
                          : "transparent",
                        color: !formData.wouldRecommend ? "#991b1b" : C.dark,
                        fontWeight: !formData.wouldRecommend ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      ❌ No
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: C.dark,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {t.whatIApplied || "What did you apply?"}{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.whatIApplied}
                  onChange={(e) =>
                    setFormData({ ...formData, whatIApplied: e.target.value })
                  }
                  placeholder={
                    t.whatIAppliedPlaceholder ||
                    "Describe how you used what you learned..."
                  }
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    fontFamily: F.sans,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    resize: "vertical",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: C.dark,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {t.measurableOutcome || "Measurable Outcome"}
                </label>
                <input
                  type="text"
                  value={formData.measurableOutcome}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      measurableOutcome: e.target.value,
                    })
                  }
                  placeholder={
                    t.measurableOutcomePlaceholder ||
                    "e.g., Reduced ticket resolution time by 20%"
                  }
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: C.dark,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {t.outcomeCategory || "Category"}
                  </label>
                  <select
                    value={formData.outcomeCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        outcomeCategory: e.target.value,
                      })
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 13,
                      background: C.white,
                      outline: "none",
                      minWidth: 140,
                    }}
                  >
                    {OUTCOME_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: C.dark,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {t.timeframe || "Timeframe"}
                  </label>
                  <select
                    value={formData.timeframe}
                    onChange={(e) =>
                      setFormData({ ...formData, timeframe: e.target.value })
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${C.border}`,
                      fontSize: 13,
                      background: C.white,
                      outline: "none",
                      minWidth: 140,
                    }}
                  >
                    {TIMEFRAMES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.emoji} {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 16,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                background: "transparent",
                color: C.dark,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: F.sans,
              }}
            >
              {t.cancel || "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 28px",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: F.sans,
                boxShadow: `0 4px 16px ${C.primary}33`,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = `0 6px 24px ${C.primary}55`;
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}33`;
                }
              }}
            >
              {submitting ? (
                <>
                  <FiLoader
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  {t.submitting || "Submitting..."}
                </>
              ) : (
                <>
                  <FiSend size={16} />
                  {t.post || "Post"}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Feed - Enhanced */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: C.muted,
            background: C.white,
            borderRadius: 14,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: `3px solid ${C.primary}`,
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p>{t.loading || "Loading..."}</p>
        </div>
      ) : activeTab === "experience" ? (
        filteredExperiences.length > 0 ? (
          filteredExperiences.map(renderExperienceCard)
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: C.muted,
              background: C.white,
              borderRadius: 14,
              border: `1px dashed ${C.border}`,
            }}
          >
            <FiMessageCircle
              size={40}
              style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }}
            />
            <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>
              {t.noExperiences || "No experiences shared yet"}
            </p>
            <p style={{ fontSize: 13 }}>
              {t.beTheFirst || "Be the first to share your experience!"}
            </p>
          </div>
        )
      ) : results.length > 0 ? (
        results.map(renderResultCard)
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            color: C.muted,
            background: C.white,
            borderRadius: 14,
            border: `1px dashed ${C.border}`,
          }}
        >
          <FiTrendingUp
            size={40}
            style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }}
          />
          <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>
            {t.noResults || "No results logged yet"}
          </p>
          <p style={{ fontSize: 13 }}>
            {t.startApplying || "Start applying what you've learned!"}
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            id: null,
            title: "",
            message: "",
          })
        }
        onConfirm={confirmDelete}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={t.delete || "Delete"}
        confirmColor="#dc2626"
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
