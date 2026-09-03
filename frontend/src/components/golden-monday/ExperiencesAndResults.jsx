// src/components/golden-monday/ExperiencesAndResults.jsx
// ============================================================
// 📊 GOLDEN MONDAY - Experiences & Results Premium Panel
// Kirkpatrick Levels 1-4 with Glassmorphism Design
// Complete with animations, endorsements, and rich interactions
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FiBarChart2,
  FiChevronDown,
  FiChevronRight,
  FiEye,
  FiEyeOff,
  FiGrid,
} from "react-icons/fi";
import { formatDistanceToNow, format } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// GLASSMORPHISM STYLES
// ─────────────────────────────────────────────────────────────────────────────
const glass = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const OUTCOME_CATEGORIES = [
  { value: "efficiency", label: "Efficiency", emoji: "⚡", color: "#8b5cf6" },
  { value: "quality", label: "Quality", emoji: "🌟", color: "#f59e0b" },
  { value: "morale", label: "Morale", emoji: "💪", color: "#ef4444" },
  { value: "retention", label: "Retention", emoji: "🤝", color: "#10b981" },
  { value: "revenue", label: "Revenue", emoji: "💰", color: "#3b82f6" },
  { value: "other", label: "Other", emoji: "📌", color: "#6b7280" },
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

const getCategoryColor = (category) => {
  const found = OUTCOME_CATEGORIES.find((c) => c.value === category);
  return found?.color || "#6b7280";
};

const getTimeframeEmoji = (timeframe) => {
  const found = TIMEFRAMES.find((t) => t.value === timeframe);
  return found?.emoji || "📅";
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ExperiencesAndResults({ sessionId }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  // ── State ──
  const [activeTab, setActiveTab] = useState("experience");
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState([]);
  const [results, setResults] = useState([]);
  const [filterTag, setFilterTag] = useState("all");
  const [viewMode, setViewMode] = useState("feed"); // "feed" | "grid"
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
  const [expandedCards, setExpandedCards] = useState({});
  const [showStats, setShowStats] = useState(true);
  const [sortBy, setSortBy] = useState("recent"); // "recent" | "popular" | "rating"

  const isMounted = useRef(true);
  const isInitialLoad = useRef(true);

  // ── Derived Data ──
  const allTags = useMemo(() => {
    const tagSet = new Set();
    experiences.forEach((exp) => {
      [...(exp.tags || []), ...(exp.aiSuggestedTags || [])].forEach((tag) => {
        if (tag && tag.trim()) tagSet.add(tag.trim());
      });
    });
    return Array.from(tagSet).sort();
  }, [experiences]);

  const stats = useMemo(() => {
    const totalExperiences = experiences.length;
    const totalResults = results.length;
    const totalEndorsements = [...experiences, ...results].reduce(
      (sum, item) => sum + (item.endorsedBy?.length || 0),
      0,
    );
    const avgRating =
      experiences.length > 0
        ? experiences.reduce((sum, e) => sum + (e.relevanceRating || 0), 0) /
          experiences.length
        : 0;
    const topTags = [...experiences, ...results]
      .flatMap((item) => [
        ...(item.tags || []),
        ...(item.aiSuggestedTags || []),
      ])
      .reduce((acc, tag) => {
        if (tag) acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
    const sortedTags = Object.entries(topTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalExperiences,
      totalResults,
      totalEndorsements,
      avgRating: avgRating > 0 ? avgRating.toFixed(1) : "N/A",
      topTags: sortedTags,
    };
  }, [experiences, results]);

  // ── Load Data ──
  const loadData = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const [expRes, resRes] = await Promise.all([
        goldenMondayAPI.getExperiences(sessionId, null, 1, 50),
        goldenMondayAPI.getResults(sessionId, "all", 1, 50),
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

  // ── Sort Functions ──
  const getSortedItems = useCallback(
    (items, type) => {
      const sorted = [...items];
      switch (sortBy) {
        case "recent":
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case "popular":
          sorted.sort(
            (a, b) => (b.endorsedBy?.length || 0) - (a.endorsedBy?.length || 0),
          );
          break;
        case "rating":
          if (type === "experience") {
            sorted.sort(
              (a, b) => (b.relevanceRating || 0) - (a.relevanceRating || 0),
            );
          }
          break;
        default:
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return sorted;
    },
    [sortBy],
  );

  // ── Handlers ──
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

  const toggleCardExpand = (id) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ── Filtered Data ──
  const filteredExperiences =
    filterTag === "all"
      ? experiences
      : experiences.filter((e) => {
          const allTags = [...(e.tags || []), ...(e.aiSuggestedTags || [])];
          return allTags.includes(filterTag);
        });

  const sortedExperiences = getSortedItems(filteredExperiences, "experience");
  const sortedResults = getSortedItems(results, "result");

  // ── Render Helpers ──
  const renderStarRating = (rating) => {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= rating ? C.gold : C.border,
              fontSize: 14,
            }}
          >
            ★
          </span>
        ))}
      </span>
    );
  };

  const renderTags = (tags, max = 3) => {
    const displayTags = tags.slice(0, max);
    const remaining = tags.length - max;
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {displayTags.map((tag, i) => (
          <span
            key={i}
            style={{
              fontSize: 10,
              background: `${C.primary}08`,
              color: C.primary,
              padding: "2px 10px",
              borderRadius: 12,
              border: `1px solid ${C.primary}15`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${C.primary}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${C.primary}08`;
            }}
            onClick={() => setFilterTag(tag)}
          >
            #{tag}
          </span>
        ))}
        {remaining > 0 && (
          <span style={{ fontSize: 10, color: C.muted }}>+{remaining}</span>
        )}
      </div>
    );
  };

  const renderExperienceCard = (exp) => {
    const isEndorsed = exp.endorsedBy?.some((id) => id === user?._id);
    const isOwner = exp.user?._id === user?._id;
    const isPrivileged = ["admin", "superadmin", "leader"].includes(user?.role);
    const allTags = [...(exp.tags || []), ...(exp.aiSuggestedTags || [])];
    const isExpanded = expandedCards[exp._id] || false;

    return (
      <motion.div
        key={exp._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
        style={{
          ...glass,
          borderRadius: 16,
          padding: "20px 24px",
          border: `1px solid ${isEndorsed ? C.primary : C.border}`,
          marginBottom: 14,
          transition: "all 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {exp.userName?.charAt(0) || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <strong style={{ color: C.dark, fontSize: 14 }}>
                  {exp.userName || t.unknown || "Unknown"}
                </strong>
                {isOwner && (
                  <span
                    style={{
                      fontSize: 9,
                      background: `${C.primary}15`,
                      color: C.primary,
                      padding: "1px 10px",
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    {t.you || "You"}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiClock size={12} />
                  {formatDistanceToNow(new Date(exp.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: C.muted,
                  flexWrap: "wrap",
                }}
              >
                {exp.department && (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <FiBriefcase size={12} />
                    {exp.department}
                  </span>
                )}
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <FiStar size={12} color={C.gold} />
                  {renderStarRating(exp.relevanceRating)}
                </span>
                {exp.wouldRecommend && (
                  <span
                    style={{
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiCheckCircle size={12} />
                    {t.wouldRecommend || "Recommended"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => handleEndorse("experience", exp._id)}
              disabled={endorsingId === exp._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 20,
                background: isEndorsed ? C.primary : "transparent",
                color: isEndorsed ? "#fff" : C.muted,
                border: `1.5px solid ${isEndorsed ? C.primary : C.border}`,
                fontSize: 12,
                fontWeight: isEndorsed ? 600 : 400,
                cursor: endorsingId === exp._id ? "not-allowed" : "pointer",
                opacity: endorsingId === exp._id ? 0.6 : 1,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!isEndorsed) {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.background = `${C.primary}08`;
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
                  size={14}
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fee2e2")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <FiTrash2 size={16} />
              </button>
            )}
            <button
              onClick={() => toggleCardExpand(exp._id)}
              style={{
                background: "none",
                border: "none",
                color: C.muted,
                cursor: "pointer",
                padding: "4px 6px",
                transition: "all 0.2s ease",
              }}
            >
              {isExpanded ? (
                <FiChevronDown size={18} />
              ) : (
                <FiChevronRight size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            marginTop: 12,
            padding: "14px 18px",
            background: C.bg,
            borderRadius: 10,
            borderLeft: `3px solid ${isEndorsed ? C.primary : C.gold}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.7,
              color: C.dark,
              whiteSpace: isExpanded ? "pre-wrap" : "normal",
              overflow: isExpanded ? "visible" : "hidden",
              display: "-webkit-box",
              WebkitLineClamp: isExpanded ? "none" : 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {exp.whatILearned}
          </p>
        </div>

        {/* Tags and Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          {allTags.length > 0 && renderTags(allTags)}
          <span style={{ fontSize: 11, color: C.muted }}>
            {format(new Date(exp.createdAt), "MMM d, yyyy")}
          </span>
        </div>
      </motion.div>
    );
  };

  const renderResultCard = (res) => {
    const isEndorsed = res.endorsedBy?.some((id) => id === user?._id);
    const isOwner = res.user?._id === user?._id;
    const isPrivileged = ["admin", "superadmin", "leader"].includes(user?.role);
    const isExpanded = expandedCards[res._id] || false;

    return (
      <motion.div
        key={res._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2 }}
        style={{
          ...glass,
          borderRadius: 16,
          padding: "20px 24px",
          border: `1px solid ${isEndorsed ? "#10b981" : C.border}`,
          marginBottom: 14,
          transition: "all 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `linear-gradient(135deg, #10b981, #34d399)`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {res.userName?.charAt(0) || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <strong style={{ color: C.dark, fontSize: 14 }}>
                  {res.userName || t.unknown || "Unknown"}
                </strong>
                {isOwner && (
                  <span
                    style={{
                      fontSize: 9,
                      background: `${C.primary}15`,
                      color: C.primary,
                      padding: "1px 10px",
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    {t.you || "You"}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiClock size={12} />
                  {formatDistanceToNow(new Date(res.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: C.muted,
                  flexWrap: "wrap",
                }}
              >
                {res.department && (
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <FiBriefcase size={12} />
                    {res.department}
                  </span>
                )}
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: getCategoryColor(res.outcomeCategory),
                  }}
                >
                  {getCategoryEmoji(res.outcomeCategory)}
                  {OUTCOME_CATEGORIES.find(
                    (c) => c.value === res.outcomeCategory,
                  )?.label || res.outcomeCategory}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {getTimeframeEmoji(res.timeframe)}
                  {TIMEFRAMES.find((t) => t.value === res.timeframe)?.label ||
                    res.timeframe}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => handleEndorse("result", res._id)}
              disabled={endorsingId === res._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 16px",
                borderRadius: 20,
                background: isEndorsed ? "#10b981" : "transparent",
                color: isEndorsed ? "#fff" : C.muted,
                border: `1.5px solid ${isEndorsed ? "#10b981" : C.border}`,
                fontSize: 12,
                fontWeight: isEndorsed ? 600 : 400,
                cursor: endorsingId === res._id ? "not-allowed" : "pointer",
                opacity: endorsingId === res._id ? 0.6 : 1,
                transition: "all 0.3s ease",
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
                  size={14}
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fee2e2")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <FiTrash2 size={16} />
              </button>
            )}
            <button
              onClick={() => toggleCardExpand(res._id)}
              style={{
                background: "none",
                border: "none",
                color: C.muted,
                cursor: "pointer",
                padding: "4px 6px",
                transition: "all 0.2s ease",
              }}
            >
              {isExpanded ? (
                <FiChevronDown size={18} />
              ) : (
                <FiChevronRight size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              padding: "14px 18px",
              background: `${C.primary}04`,
              borderRadius: 10,
              borderLeft: `3px solid #10b981`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.7,
                color: C.dark,
              }}
            >
              <strong style={{ color: "#10b981" }}>Applied:</strong>{" "}
              {res.whatIApplied}
            </p>
            {res.measurableOutcome && (
              <p
                style={{
                  marginTop: 6,
                  fontSize: 14,
                  color: C.primary,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiBarChart2 size={16} />
                <strong>Outcome:</strong> {res.measurableOutcome}
              </p>
            )}
          </div>

          {res.experience && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 14px",
                background: "#f5f3ff",
                borderRadius: 8,
                border: `1px solid #e9d5ff`,
                fontSize: 12,
                color: "#6d28d9",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FiZap size={14} />
              {t.linkedToExperience || "Linked to experience"}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 11, color: C.muted }}>
            {format(new Date(res.createdAt), "MMM d, yyyy")}
          </span>
        </div>
      </motion.div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: F.sans }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-btn {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .tab-btn:hover:not(.active) {
          transform: translateY(-2px);
          background: rgba(13, 26, 94, 0.04);
        }
        .tab-btn.active {
          box-shadow: 0 4px 16px rgba(13, 26, 94, 0.3);
        }
        .stat-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .stat-card:hover {
          transform: translateY(-4px);
        }
        .fade-in {
          animation: fadeInUp 0.3s ease forwards;
        }
      `}</style>

      {/* ── STATS BANNER ── */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: t.experiences || "Experiences",
              value: stats.totalExperiences,
              icon: <FiMessageCircle size={18} />,
              color: C.primary,
            },
            {
              label: t.results || "Results",
              value: stats.totalResults,
              icon: <FiTrendingUp size={18} />,
              color: "#10b981",
            },
            {
              label: t.endorsements || "Endorsements",
              value: stats.totalEndorsements,
              icon: <FiThumbsUp size={18} />,
              color: "#8b5cf6",
            },
            {
              label: t.avgRating || "Avg Rating",
              value: stats.avgRating,
              icon: <FiStar size={18} />,
              color: C.gold,
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="stat-card"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
                backdropFilter: "blur(12px)",
                border: `1px solid ${stat.color}22`,
                borderRadius: 12,
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {stat.icon}
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── TABS ── */}
      <div
        style={{
          ...glass,
          borderRadius: 14,
          padding: "4px",
          display: "flex",
          gap: 4,
          marginBottom: 16,
        }}
      >
        {[
          {
            id: "experience",
            label: t.tabExperiences || "Experiences Shared",
            icon: <FiMessageCircle size={16} />,
            color: C.primary,
          },
          {
            id: "result",
            label: t.tabResults || "Results Gained",
            icon: <FiTrendingUp size={16} />,
            color: "#10b981",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: activeTab === tab.id ? tab.color : "transparent",
              color: activeTab === tab.id ? "#fff" : C.muted,
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.3s ease",
              fontFamily: F.sans,
            }}
          >
            {tab.icon}
            {tab.label}
            <span
              style={{
                fontSize: 10,
                background:
                  activeTab === tab.id ? "rgba(255,255,255,0.2)" : C.bg,
                padding: "1px 10px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {activeTab === "experience" ? experiences.length : results.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── FILTER & SORT BAR ── */}
      <div
        style={{
          ...glass,
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {activeTab === "experience" && allTags.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              flex: 1,
            }}
          >
            <FiFilter size={14} color={C.muted} />
            <button
              onClick={() => setFilterTag("all")}
              style={{
                padding: "3px 12px",
                borderRadius: 14,
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
            {allTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                style={{
                  padding: "3px 12px",
                  borderRadius: 14,
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
            {allTags.length > 8 && (
              <span style={{ fontSize: 11, color: C.muted }}>
                +{allTags.length - 8}
              </span>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: `1.5px solid ${C.border}`,
              fontSize: 12,
              background: C.white,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="recent">{t.sortRecent || "Most Recent"}</option>
            <option value="popular">{t.sortPopular || "Most Popular"}</option>
            {activeTab === "experience" && (
              <option value="rating">{t.sortRating || "Highest Rated"}</option>
            )}
          </select>

          <button
            onClick={() => setViewMode(viewMode === "feed" ? "grid" : "feed")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1.5px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            {viewMode === "feed" ? (
              <FiGrid size={14} />
            ) : (
              <FiMessageCircle size={14} />
            )}
            {viewMode === "feed" ? t.gridView || "Grid" : t.feedView || "Feed"}
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1.5px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            {showStats ? <FiEye size={14} /> : <FiEyeOff size={14} />}
            {showStats
              ? t.hideStats || "Hide Stats"
              : t.showStats || "Show Stats"}
          </button>
        </div>
      </div>

      {/* ── SHARE BUTTON ── */}
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 24px",
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
            boxShadow: showForm ? "none" : `0 4px 20px ${C.primary}44`,
            fontFamily: F.sans,
          }}
        >
          {showForm ? <FiX size={18} /> : <FiPlus size={18} />}
          {showForm ? t.close || "Close" : t.share || "Share Your Experience"}
        </motion.button>
      </div>

      {/* ── FORM ── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            style={{
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                ...glass,
                borderRadius: 16,
                padding: "clamp(20px, 3vw, 28px)",
                border: `2px solid ${C.primary}33`,
              }}
            >
              {activeTab === "experience" ? (
                <>
                  <div style={{ marginBottom: 16 }}>
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
                        setFormData({
                          ...formData,
                          whatILearned: e.target.value,
                        })
                      }
                      placeholder={
                        t.whatILearnedPlaceholder ||
                        "Share your key takeaways..."
                      }
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: `1.5px solid ${C.border}`,
                        fontFamily: F.sans,
                        fontSize: 14,
                        outline: "none",
                        transition: "all 0.3s ease",
                        resize: "vertical",
                        background: C.white,
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

                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
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
                        {t.relevanceRating || "Relevance Rating"}
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, relevanceRating: v })
                            }
                            style={{
                              padding: "8px 14px",
                              borderRadius: 8,
                              border: `2px solid ${formData.relevanceRating === v ? C.primary : C.border}`,
                              background:
                                formData.relevanceRating === v
                                  ? C.primary
                                  : "transparent",
                              color:
                                formData.relevanceRating === v
                                  ? "#fff"
                                  : C.dark,
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
                            padding: "8px 20px",
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
                            padding: "8px 20px",
                            borderRadius: 8,
                            border: `2px solid ${!formData.wouldRecommend ? "#ef4444" : C.border}`,
                            background: !formData.wouldRecommend
                              ? "#fee2e2"
                              : "transparent",
                            color: !formData.wouldRecommend
                              ? "#991b1b"
                              : C.dark,
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
                  <div style={{ marginBottom: 16 }}>
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
                        setFormData({
                          ...formData,
                          whatIApplied: e.target.value,
                        })
                      }
                      placeholder={
                        t.whatIAppliedPlaceholder ||
                        "Describe how you used what you learned..."
                      }
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: `1.5px solid ${C.border}`,
                        fontFamily: F.sans,
                        fontSize: 14,
                        outline: "none",
                        transition: "all 0.3s ease",
                        resize: "vertical",
                        background: C.white,
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

                  <div style={{ marginBottom: 16 }}>
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
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: `1.5px solid ${C.border}`,
                        fontSize: 14,
                        outline: "none",
                        transition: "all 0.3s ease",
                        background: C.white,
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
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: `1.5px solid ${C.border}`,
                          fontSize: 13,
                          background: C.white,
                          outline: "none",
                          minWidth: 140,
                          cursor: "pointer",
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
                          setFormData({
                            ...formData,
                            timeframe: e.target.value,
                          })
                        }
                        style={{
                          padding: "8px 14px",
                          borderRadius: 8,
                          border: `1.5px solid ${C.border}`,
                          fontSize: 13,
                          background: C.white,
                          outline: "none",
                          minWidth: 140,
                          cursor: "pointer",
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
                  marginTop: 20,
                  justifyContent: "flex-end",
                  paddingTop: 16,
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    background: "transparent",
                    color: C.dark,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: F.sans,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = C.bg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 32px",
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                    color: "#fff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: F.sans,
                    boxShadow: `0 4px 20px ${C.primary}44`,
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.boxShadow = `0 6px 28px ${C.primary}55`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = `0 4px 20px ${C.primary}44`;
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
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── FEED ── */}
      {loading ? (
        <div
          style={{
            ...glass,
            borderRadius: 14,
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `3px solid ${C.primary}`,
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: C.muted }}>{t.loading || "Loading..."}</p>
        </div>
      ) : activeTab === "experience" ? (
        sortedExperiences.length > 0 ? (
          viewMode === "feed" ? (
            sortedExperiences.map(renderExperienceCard)
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {sortedExperiences.map((exp) => (
                <div key={exp._id} style={{ height: "100%" }}>
                  {renderExperienceCard(exp)}
                </div>
              ))}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              ...glass,
              borderRadius: 14,
              padding: "50px 20px",
              textAlign: "center",
            }}
          >
            <FiMessageCircle
              size={48}
              style={{ opacity: 0.3, display: "block", margin: "0 auto 16px" }}
            />
            <p style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>
              {t.noExperiences || "No experiences shared yet"}
            </p>
            <p style={{ fontSize: 14, color: C.muted }}>
              {t.beTheFirst || "Be the first to share your experience!"}
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                marginTop: 16,
                padding: "10px 28px",
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = `0 4px 20px ${C.primary}44`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <FiPlus size={16} style={{ marginRight: 8 }} />
              {t.shareNow || "Share Now"}
            </button>
          </motion.div>
        )
      ) : sortedResults.length > 0 ? (
        viewMode === "feed" ? (
          sortedResults.map(renderResultCard)
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {sortedResults.map((res) => (
              <div key={res._id} style={{ height: "100%" }}>
                {renderResultCard(res)}
              </div>
            ))}
          </div>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            ...glass,
            borderRadius: 14,
            padding: "50px 20px",
            textAlign: "center",
          }}
        >
          <FiTrendingUp
            size={48}
            style={{ opacity: 0.3, display: "block", margin: "0 auto 16px" }}
          />
          <p style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>
            {t.noResults || "No results logged yet"}
          </p>
          <p style={{ fontSize: 14, color: C.muted }}>
            {t.startApplying || "Start applying what you've learned!"}
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              marginTop: 16,
              padding: "10px 28px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #10b981, #34d399)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(16, 185, 129, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FiPlus size={16} style={{ marginRight: 8 }} />
            {t.logResult || "Log a Result"}
          </button>
        </motion.div>
      )}

      {/* ── CONFIRM MODAL ── */}
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
    </div>
  );
}
