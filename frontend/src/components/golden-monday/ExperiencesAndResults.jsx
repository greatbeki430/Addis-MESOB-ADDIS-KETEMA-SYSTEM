// src/components/golden-monday/ExperiencesAndResults.jsx
import { useState, useEffect, useCallback } from "react";
import { C, F } from "../../styles/theme";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiThumbsUp,
  FiMessageCircle,
  FiTrendingUp,
  FiCheckCircle,
  FiStar,
  FiTrash2,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

const OUTCOME_CATEGORIES = [
  { value: "efficiency", label: "Efficiency" },
  { value: "quality", label: "Quality" },
  { value: "morale", label: "Morale" },
  { value: "retention", label: "Retention" },
  { value: "revenue", label: "Revenue" },
  { value: "other", label: "Other" },
];

const TIMEFRAMES = [
  { value: "immediate", label: "Immediate" },
  { value: "within-month", label: "Within a Month" },
  { value: "within-quarter", label: "Within a Quarter" },
  { value: "within-year", label: "Within a Year" },
];

export default function ExperiencesAndResults({ sessionId }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const [activeTab, setActiveTab] = useState("experience");
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState([]);
  const [results, setResults] = useState([]);
  const [paginationExp, setPaginationExp] = useState({ page: 1, total: 0 });
  const [paginationRes, setPaginationRes] = useState({ page: 1, total: 0 });

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
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, resRes] = await Promise.all([
        goldenMondayAPI.getExperiences(sessionId, null, 1, 20),
        goldenMondayAPI.getResults(sessionId, "all", 1, 20),
      ]);
      setExperiences(expRes.data.experiences || []);
      setPaginationExp(expRes.data.pagination || { page: 1, total: 0 });
      setResults(resRes.data.results || []);
      setPaginationRes(resRes.data.pagination || { page: 1, total: 0 });
    } catch (err) {
      console.error("Failed to load experiences/results:", err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEndorse = async (type, id) => {
    try {
      const response =
        type === "experience"
          ? await goldenMondayAPI.endorseExperience(id)
          : await goldenMondayAPI.endorseResult(id);
      if (response.data.success) {
        loadData();
        showToast("Endorsement updated!", "success");
      }
    } catch (err) {
      showToast("Failed to endorse", "error");
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;
    try {
      type === "experience"
        ? await goldenMondayAPI.deleteExperience(id)
        : await goldenMondayAPI.deleteResult(id);
      loadData();
      showToast("Deleted successfully", "success");
    } catch (err) {
      showToast("Failed to delete", "error");
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
        showToast("Experience shared! 🎉", "success");
      } else {
        await goldenMondayAPI.createResult(payload);
        showToast("Result logged! 🎉", "success");
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
      loadData();
    } catch (err) {
      showToast("Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderExperienceCard = (exp) => (
    <div
      key={exp._id}
      style={{
        background: C.white,
        borderRadius: 12,
        padding: "16px 20px",
        border: `1px solid ${C.border}`,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ color: C.dark }}>{exp.userName}</strong>
            <span style={{ fontSize: 12, color: C.muted }}>
              {formatDistanceToNow(new Date(exp.createdAt), {
                addSuffix: true,
              })}
            </span>
            {exp.department && (
              <span
                style={{
                  fontSize: 11,
                  background: C.bg,
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {exp.department}
              </span>
            )}
          </div>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 1.6,
              color: C.dark,
            }}
          >
            {exp.whatILearned}
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
              }}
            >
              <FiStar size={14} color={C.gold} /> {exp.relevanceRating}/5
            </span>
            {exp.wouldRecommend && (
              <span style={{ fontSize: 12, color: C.primary }}>
                <FiCheckCircle size={14} /> Would Recommend
              </span>
            )}
            {exp.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {exp.tags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      background: C.bg,
                      padding: "2px 8px",
                      borderRadius: 12,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handleEndorse("experience", exp._id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: exp.endorsedBy?.includes(user?._id)
                ? C.primary
                : "transparent",
              color: exp.endorsedBy?.includes(user?._id) ? "#fff" : C.muted,
              border: `1px solid ${exp.endorsedBy?.includes(user?._id) ? C.primary : C.border}`,
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <FiThumbsUp size={14} /> {exp.endorsedBy?.length || 0}
          </button>
          {(user?._id === exp.user?._id ||
            ["admin", "superadmin", "leader"].includes(user?.role)) && (
            <button
              onClick={() => handleDelete("experience", exp._id)}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
              }}
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderResultCard = (res) => (
    <div
      key={res._id}
      style={{
        background: C.white,
        borderRadius: 12,
        padding: "16px 20px",
        border: `1px solid ${C.border}`,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ color: C.dark }}>{res.userName}</strong>
            <span style={{ fontSize: 12, color: C.muted }}>
              {formatDistanceToNow(new Date(res.createdAt), {
                addSuffix: true,
              })}
            </span>
            {res.department && (
              <span
                style={{
                  fontSize: 11,
                  background: C.bg,
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                {res.department}
              </span>
            )}
          </div>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 1.6,
              color: C.dark,
            }}
          >
            <strong>Applied:</strong> {res.whatIApplied}
          </p>
          {res.measurableOutcome && (
            <p style={{ fontSize: 14, color: C.primary }}>
              <strong>Outcome:</strong> {res.measurableOutcome}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                background: C.bg,
                padding: "2px 8px",
                borderRadius: 12,
              }}
            >
              {OUTCOME_CATEGORIES.find((c) => c.value === res.outcomeCategory)
                ?.label || res.outcomeCategory}
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              <FiTrendingUp size={14} />{" "}
              {TIMEFRAMES.find((t) => t.value === res.timeframe)?.label ||
                res.timeframe}
            </span>
            {res.experience && (
              <span style={{ fontSize: 12, color: C.muted }}>
                Linked to an experience
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => handleEndorse("result", res._id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: res.endorsedBy?.includes(user?._id)
                ? C.primary
                : "transparent",
              color: res.endorsedBy?.includes(user?._id) ? "#fff" : C.muted,
              border: `1px solid ${res.endorsedBy?.includes(user?._id) ? C.primary : C.border}`,
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <FiThumbsUp size={14} /> {res.endorsedBy?.length || 0}
          </button>
          {(user?._id === res.user?._id ||
            ["admin", "superadmin", "leader"].includes(user?.role)) && (
            <button
              onClick={() => handleDelete("result", res._id)}
              style={{
                background: "none",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
              }}
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: `2px solid ${C.border}`,
          paddingBottom: 8,
        }}
      >
        <button
          onClick={() => setActiveTab("experience")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: activeTab === "experience" ? C.primary : "transparent",
            color: activeTab === "experience" ? "#fff" : C.muted,
            border: "none",
            fontWeight: activeTab === "experience" ? 600 : 400,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiMessageCircle size={16} /> Experiences Shared
        </button>
        <button
          onClick={() => setActiveTab("result")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: activeTab === "result" ? C.primary : "transparent",
            color: activeTab === "result" ? "#fff" : C.muted,
            border: "none",
            fontWeight: activeTab === "result" ? 600 : 400,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiTrendingUp size={16} /> Results Gained
        </button>
      </div>

      {/* Header / Post Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 14, color: C.muted }}>
          {activeTab === "experience"
            ? "Share what you learned and how relevant it was."
            : "Log what you applied and the measurable outcome."}
        </span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            background: C.primary,
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? "Close" : "Share"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: C.white,
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            border: `1px solid ${C.border}`,
          }}
        >
          {activeTab === "experience" ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  What did you learn? *
                </label>
                <textarea
                  rows={3}
                  value={formData.whatILearned}
                  onChange={(e) =>
                    setFormData({ ...formData, whatILearned: e.target.value })
                  }
                  placeholder="Share your key takeaways..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontFamily: F.sans,
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
                      color: C.muted,
                      marginBottom: 4,
                    }}
                  >
                    Relevance (1-5)
                  </label>
                  <select
                    value={formData.relevanceRating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        relevanceRating: parseInt(e.target.value),
                      })
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: C.muted,
                      marginBottom: 4,
                    }}
                  >
                    Recommend?
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.wouldRecommend}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wouldRecommend: e.target.checked,
                      })
                    }
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  What did you apply? *
                </label>
                <textarea
                  rows={3}
                  value={formData.whatIApplied}
                  onChange={(e) =>
                    setFormData({ ...formData, whatIApplied: e.target.value })
                  }
                  placeholder="Describe how you used what you learned..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontFamily: F.sans,
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Measurable Outcome
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
                  placeholder="e.g., Reduced ticket resolution time by 20%"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: C.muted,
                      marginBottom: 4,
                    }}
                  >
                    Category
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
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {OUTCOME_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      color: C.muted,
                      marginBottom: 4,
                    }}
                  >
                    Timeframe
                  </label>
                  <select
                    value={formData.timeframe}
                    onChange={(e) =>
                      setFormData({ ...formData, timeframe: e.target.value })
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {TIMEFRAMES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 8,
              background: C.primary,
              color: "#fff",
              border: "none",
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? "Submitting..."
              : `Post ${activeTab === "experience" ? "Experience" : "Result"}`}
          </button>
        </form>
      )}

      {/* Feed */}
      {loading ? (
        <p style={{ color: C.muted, textAlign: "center", padding: "40px 0" }}>
          Loading...
        </p>
      ) : activeTab === "experience" ? (
        experiences.length > 0 ? (
          experiences.map(renderExperienceCard)
        ) : (
          <p style={{ color: C.muted, textAlign: "center", padding: "40px 0" }}>
            No experiences shared yet. Be the first!
          </p>
        )
      ) : results.length > 0 ? (
        results.map(renderResultCard)
      ) : (
        <p style={{ color: C.muted, textAlign: "center", padding: "40px 0" }}>
          No results logged yet. Start applying what you've learned!
        </p>
      )}
    </div>
  );
}
