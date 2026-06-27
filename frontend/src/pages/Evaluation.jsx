// ════════════════════════════════════════════════════════════
// pages/Evaluation - With Dynamic Comments & Database Storage
// ════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { CRITERIA } from "../constants/criteria";
import { exportEvaluationReportToPDF } from "../utils/pdfExport";
import { useAuth } from "../hooks/useAuth";
import { evaluationAPI } from "../services/api";
import { useToast } from "../hooks/useToast";
import {
  FiChevronDown,
  FiUser,
  FiUsers,
  FiStar,
  FiAward,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiCheck,
  FiX,
  FiPlus,
  FiSave,
  FiDownload,
  FiRefreshCw,
  FiLoader,
  FiCalendar,
  FiMessageSquare,
  FiThumbsUp,
  FiTarget,
  FiClipboard,
  FiPenTool,
  FiAlertCircle,
} from "react-icons/fi";

export default function Evaluation({ t, lang }) {
  // ✅ Safe access to translations
  const safeT = t || {};
  const te = safeT.evaluation || {};
  const safeCriteria = safeT.criteria || {};

  const { user } = useAuth();
  const { showToast } = useToast();
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [members, setMembers] = useState(["", "", ""]);
  const [teamName, setTeamName] = useState("");
  const [showRankings, setShowRankings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluationId, setEvaluationId] = useState(null);

  // ✅ Create refs for all input fields
  const inputRefs = useRef({});

  // ✅ Load existing evaluation if editing - FIXED: wrap in a function with cleanup
  useEffect(() => {
    let isMounted = true;

    const loadSavedEvaluation = () => {
      const savedEvaluation = localStorage.getItem("currentEvaluation");
      if (savedEvaluation) {
        try {
          const data = JSON.parse(savedEvaluation);
          // Only update state if component is still mounted
          if (isMounted) {
            if (data.members) setMembers(data.members);
            if (data.scores) setScores(data.scores);
            if (data.comments) setComments(data.comments);
            if (data.teamName) setTeamName(data.teamName);
            if (data.evaluationId) setEvaluationId(data.evaluationId);
          }
        } catch (e) {
          console.error("Failed to load saved evaluation:", e);
        }
      }
    };

    loadSavedEvaluation();

    return () => {
      isMounted = false;
    };
  }, []); // ✅ Empty dependency array - runs once on mount

  // ✅ Auto-save to localStorage - FIXED: use a debounced approach
  useEffect(() => {
    const hasData =
      members.some((m) => m.trim() !== "") || Object.keys(scores).length > 0;

    if (!hasData) return;

    const data = {
      members,
      scores,
      comments,
      teamName,
      evaluationId,
      lastUpdated: new Date().toISOString(),
    };

    // Use a timeout to debounce saves
    const timer = setTimeout(() => {
      localStorage.setItem("currentEvaluation", JSON.stringify(data));
    }, 500);

    return () => clearTimeout(timer);
  }, [members, scores, comments, teamName, evaluationId]);

  // Add new member (max 7)
  const addMember = () => {
    if (members.length < 7) {
      setMembers([...members, ""]);
      // Initialize comment for new member
      const newComments = { ...comments };
      newComments[members.length] = "";
      setComments(newComments);
    }
  };

  // Remove member
  const removeMember = (index) => {
    if (members.length > 1) {
      const newMembers = members.filter((_, i) => i !== index);
      setMembers(newMembers);
      const newScores = { ...scores };
      Object.keys(newScores).forEach((key) => {
        if (key.endsWith(`-${members[index]}`)) {
          delete newScores[key];
        }
      });
      setScores(newScores);
      // Remove comment
      const newComments = { ...comments };
      delete newComments[index];
      setComments(newComments);
    }
  };

  // Update member name
  const updateMemberName = (index, name) => {
    const newMembers = [...members];
    newMembers[index] = name;
    setMembers(newMembers);
  };

  // Update comment for a member
  const updateComment = (index, comment) => {
    const newComments = { ...comments };
    newComments[index] = comment;
    setComments(newComments);
  };

  const setScore = (cId, iIdx, m, v) => {
    const key = `${cId}-${iIdx}-${m}`;
    const max = CRITERIA[cId - 1].items[iIdx].points;
    setScores((s) => ({ ...s, [key]: Math.min(Number(v), max) }));
  };

  const total = (m) =>
    CRITERIA.flatMap((c) =>
      c.items.map((_, i) => scores[`${c.id}-${i}-${m}`] || 0),
    ).reduce((a, b) => a + b, 0);

  const totals = members
    .filter((m) => m.trim() !== "")
    .map((m, idx) => ({
      name: m,
      index: idx,
      total: total(m),
      comment: comments[idx] || "",
    }));

  // ✅ Sort by score descending, then by name for equal scores
  const sortedMembers = [...totals].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.name.localeCompare(b.name);
  });

  // Calculate summary stats
  const totalMembers = sortedMembers.length;
  const averageScore =
    totalMembers > 0
      ? Math.round(
          sortedMembers.reduce((sum, m) => sum + m.total, 0) / totalMembers,
        )
      : 0;
  const highestScore = sortedMembers[0]?.total || 0;
  const lowestScore = sortedMembers[sortedMembers.length - 1]?.total || 0;
  const bestPerformer = sortedMembers[0]?.name || "—";

  // ✅ Save evaluation to database
  const saveEvaluation = async () => {
    const validMembers = members.filter((m) => m.trim() !== "");
    if (validMembers.length === 0) {
      showToast("Please add at least one team member", "warning");
      return;
    }

    try {
      setSaving(true);

      // Calculate total scores for each member
      const totalScoresData = validMembers.map((m) => ({
        name: m,
        total: total(m),
      }));

      // Find best performer
      const bestPerformerName =
        totalScoresData.length > 0
          ? totalScoresData.reduce((a, b) => (a.total > b.total ? a : b)).name
          : null;

      // Prepare data for backend
      const evaluationData = {
        teamName: teamName || "Untitled Team",
        members: validMembers,
        scores: scores,
        comments: comments,
        totalScores: totalScoresData,
        evaluatedBy: user?.name || user?.email || "Unknown",
        evaluatedAt: new Date().toISOString(),
        language: lang || "en",
        status: "submitted",
        bestPerformer: bestPerformerName,
      };

      let response;
      if (evaluationId) {
        // Update existing
        response = await evaluationAPI.update(evaluationId, evaluationData);
        showToast("✅ Evaluation updated successfully!", "success");
      } else {
        // Create new
        response = await evaluationAPI.create(evaluationData);
        setEvaluationId(response.data._id);
        showToast("✅ Evaluation saved successfully!", "success");
      }

      // Clear localStorage after successful save
      localStorage.removeItem("currentEvaluation");
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      showToast(
        error.response?.data?.message ||
          "Failed to save evaluation. Please try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // ✅ Get rank badge
  const getRankBadge = (index, total) => {
    if (total <= 1) return "🥇";
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  // ✅ Get performance level
  const getPerformanceLevel = (score) => {
    if (score >= 90)
      return {
        label: "Outstanding",
        color: "#10b981",
        icon: <FiStar size={14} />,
      };
    if (score >= 80)
      return {
        label: "Excellent",
        color: "#3b82f6",
        icon: <FiAward size={14} />,
      };
    if (score >= 70)
      return {
        label: "Good",
        color: "#8b5cf6",
        icon: <FiThumbsUp size={14} />,
      };
    if (score >= 60)
      return {
        label: "Average",
        color: "#f59e0b",
        icon: <FiBarChart2 size={14} />,
      };
    if (score >= 50)
      return {
        label: "Needs Improvement",
        color: "#f97316",
        icon: <FiTrendingUp size={14} />,
      };
    return {
      label: "Needs Attention",
      color: "#ef4444",
      icon: <FiAlertCircle size={14} />,
    };
  };

  // Keyboard navigation
  const handleKeyDown = (e, cId, itemIdx, member) => {
    const allMembers = members.filter((m) => m.trim() !== "");
    const currentMemberIndex = allMembers.indexOf(member);

    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      let nextCriterionId = cId;
      let nextItemIdx = itemIdx;
      let nextMemberIndex = currentMemberIndex + 1;

      if (nextMemberIndex >= allMembers.length) {
        nextMemberIndex = 0;
        nextItemIdx = itemIdx + 1;
        if (nextItemIdx >= CRITERIA[cId - 1].items.length) {
          nextItemIdx = 0;
          nextCriterionId = cId + 1;
          if (nextCriterionId > CRITERIA.length) {
            nextCriterionId = 1;
          }
        }
      }

      const nextMember = allMembers[nextMemberIndex];
      if (nextMember) {
        const nextInputId = getInputId(
          nextCriterionId,
          nextItemIdx,
          nextMember,
        );
        inputRefs.current[nextInputId]?.focus();
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      let prevCriterionId = cId;
      let prevItemIdx = itemIdx;
      let prevMemberIndex = currentMemberIndex - 1;

      if (prevMemberIndex < 0) {
        prevMemberIndex = allMembers.length - 1;
        prevItemIdx = itemIdx - 1;
        if (prevItemIdx < 0) {
          const prevCriterion = CRITERIA[cId - 2];
          if (prevCriterion) {
            prevItemIdx = prevCriterion.items.length - 1;
            prevCriterionId = cId - 1;
          } else {
            const lastCriterion = CRITERIA[CRITERIA.length - 1];
            prevItemIdx = lastCriterion.items.length - 1;
            prevCriterionId = CRITERIA.length;
          }
        }
      }

      const prevMember = allMembers[prevMemberIndex];
      if (prevMember) {
        const prevInputId = getInputId(
          prevCriterionId,
          prevItemIdx,
          prevMember,
        );
        inputRefs.current[prevInputId]?.focus();
      }
    }
  };

  const getInputId = (cId, iIdx, m) =>
    `score-${cId}-${iIdx}-${m.replace(/\s/g, "")}`;

  const thS = {
    background: C.dark,
    color: C.light,
    padding: "clamp(6px, 2vw, 10px) clamp(6px, 2vw, 10px)",
    textAlign: "left",
    fontFamily: F.sans,
    fontWeight: 700,
    fontSize: "clamp(10px, 3vw, 12px)",
  };

  const tdS = {
    padding: "clamp(6px, 2vw, 10px) clamp(6px, 2vw, 10px)",
    borderBottom: "1px solid #eef2ee",
    fontFamily: F.sans,
    fontSize: "clamp(10px, 3vw, 12px)",
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px, 3vw, 14px)",
          marginBottom: "clamp(12px, 3vw, 20px)",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(20px, 6vw, 24px)",
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FiClipboard size={24} color={C.primary} />
          {te.title || "Peer Forum Evaluation"}
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              background: C.primary,
              color: "#fff",
              padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 3vw, 12px)",
              borderRadius: 20,
              fontSize: "clamp(10px, 3vw, 11px)",
              fontWeight: 700,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FiTarget size={12} />
            {te.outOf || "Out of 100 pts"}
          </span>
          {evaluationId && (
            <span
              style={{
                background: "#10b981",
                color: "#fff",
                padding: "2px 10px",
                borderRadius: 20,
                fontSize: "10px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiCheck size={12} />
              Saved
            </span>
          )}
        </div>
      </div>

      <p
        style={{
          color: "#555",
          marginBottom: "clamp(16px, 4vw, 22px)",
          fontSize: "clamp(12px, 3.5vw, 13px)",
          fontFamily: F.sans,
        }}
      >
        {te.subtitle || "Addis Ababa City Admin · Public Service Bureau"}
      </p>

      {/* Team Name Input */}
      <div style={card}>
        <label
          style={{
            display: "block",
            fontSize: "clamp(12px, 3.5vw, 13px)",
            fontWeight: 600,
            marginBottom: 8,
            color: C.dark,
          }}
        >
          <FiUsers size={14} style={{ marginRight: 6 }} />
          Team Name / Department
        </label>
        <input
          type="text"
          style={inp}
          placeholder="e.g., Addis Ketema Service Team"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>

      {/* Dynamic Team Members Section */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: "clamp(13px, 4vw, 15px)",
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.sans,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiUsers size={18} color={C.primary} />
            {te.teamMembers || "Team Members"} (Max 7)
          </h3>
          {members.length < 7 && (
            <button
              onClick={addMember}
              style={{
                background: C.primary,
                color: "#fff",
                border: "none",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiPlus size={14} />
              Add Member
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
            gap: 12,
          }}
        >
          {members.map((member, idx) => (
            <div
              key={idx}
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <input
                style={{ ...inp, flex: 1 }}
                placeholder={`Member ${idx + 1}`}
                value={member}
                onChange={(e) => updateMemberName(idx, e.target.value)}
              />
              {members.length > 1 && (
                <button
                  onClick={() => removeMember(idx)}
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: 6,
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Criteria Sections */}
      {CRITERIA.map((c) => (
        <div
          key={c.id}
          style={{
            ...card,
            borderLeft: `5px solid ${c.color}`,
            paddingLeft: "clamp(12px, 3vw, 20px)",
            overflowX: "auto",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(13px, 4vw, 15px)",
              fontWeight: 800,
              color: c.color,
              fontFamily: F.sans,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: 6,
            }}
          >
            <FiTarget size={16} />
            {safeCriteria[c.key] || c.key}
            <span
              style={{
                fontWeight: 400,
                fontSize: "clamp(10px, 3vw, 12px)",
                color: "#888",
              }}
            >
              ({c.weight}%)
            </span>
          </h3>

          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "clamp(10px, 3vw, 12px)",
                minWidth: 500,
              }}
            >
              <thead>
                <tr>
                  <th style={thS}>መስፈርት / Criterion</th>
                  <th style={{ ...thS, textAlign: "center" }}>
                    {te.maxPts || "Max Pts"}
                  </th>
                  {members
                    .filter((m) => m.trim() !== "")
                    .map((m) => (
                      <th
                        key={m}
                        style={{
                          ...thS,
                          textAlign: "center",
                          minWidth: "80px",
                        }}
                      >
                        {m.length > 15 ? m.substring(0, 12) + "..." : m}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {c.items.map((item, idx) => (
                  <tr
                    key={idx}
                    style={idx % 2 === 0 ? { background: C.cardBg } : {}}
                  >
                    <td style={tdS}>{item.text}</td>
                    <td
                      style={{
                        ...tdS,
                        textAlign: "center",
                        fontWeight: 700,
                        color: c.color,
                      }}
                    >
                      {item.points}
                    </td>
                    {members
                      .filter((m) => m.trim() !== "")
                      .map((m) => {
                        const inputId = getInputId(c.id, idx, m);
                        return (
                          <td key={m} style={{ ...tdS, textAlign: "center" }}>
                            <input
                              ref={(el) => (inputRefs.current[inputId] = el)}
                              id={inputId}
                              type="number"
                              min="0"
                              max={item.points}
                              style={{
                                width: "clamp(50px, 12vw, 60px)",
                                border: `1.5px solid ${C.border}`,
                                borderRadius: 6,
                                padding: "clamp(3px, 1.5vw, 6px)",
                                textAlign: "center",
                                fontSize: "clamp(11px, 3vw, 13px)",
                              }}
                              value={scores[`${c.id}-${idx}-${m}`] || ""}
                              onChange={(e) =>
                                setScore(c.id, idx, m, e.target.value)
                              }
                              onKeyDown={(e) => handleKeyDown(e, c.id, idx, m)}
                            />
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ✅ RANKINGS WITH DYNAMIC COMMENTS */}
      <div style={card}>
        <div
          onClick={() => setShowRankings(!showRankings)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            padding: "8px 4px",
            borderRadius: 8,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FiChevronDown
              size={20}
              style={{
                transform: showRankings ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.2s ease",
                color: C.primary,
              }}
            />
            <h3
              style={{
                margin: 0,
                fontSize: "clamp(14px, 4vw, 18px)",
                fontWeight: 800,
                color: C.dark,
                fontFamily: F.sans,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FiBarChart2 size={18} color={C.primary} />
              Performance Rankings & Feedback
            </h3>
            {!showRankings && sortedMembers.length > 0 && (
              <span
                style={{
                  background: C.primary,
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {sortedMembers.length} Members
              </span>
            )}
          </div>
          {!showRankings && sortedMembers.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(11px, 3vw, 13px)",
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiAward size={14} color={C.gold} />
                Best: {bestPerformer}
              </span>
              <span
                style={{
                  fontSize: "clamp(11px, 3vw, 13px)",
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiTrendingUp size={14} color={C.primary} />
                Avg: {averageScore}
              </span>
            </div>
          )}
        </div>

        {showRankings && sortedMembers.length > 0 && (
          <div style={{ marginTop: 20 }}>
            {/* Summary Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  background: C.bg,
                  borderRadius: 8,
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(20px, 4vw, 24px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {totalMembers}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <FiUsers size={12} />
                  Total Members
                </div>
              </div>
              <div
                style={{
                  background: C.bg,
                  borderRadius: 8,
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(20px, 4vw, 24px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {averageScore}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <FiTrendingUp size={12} />
                  Average Score
                </div>
              </div>
              <div
                style={{
                  background: C.bg,
                  borderRadius: 8,
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(20px, 4vw, 24px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {highestScore}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <FiAward size={12} />
                  Highest Score
                </div>
              </div>
              <div
                style={{
                  background: C.bg,
                  borderRadius: 8,
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(20px, 4vw, 24px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {lowestScore}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: C.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <FiTrendingDown size={12} />
                  Lowest Score
                </div>
              </div>
            </div>

            {/* ✅ Compact Cards with Comments */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                gap: 12,
              }}
            >
              {sortedMembers.map(
                ({ name, index, total: memberTotal, comment }, idx) => {
                  const level = getPerformanceLevel(memberTotal);
                  const rankBadge = getRankBadge(idx, sortedMembers.length);
                  const isTopThree = idx < 3;

                  return (
                    <div
                      key={name}
                      style={{
                        background: C.white,
                        borderRadius: 10,
                        padding: "14px 16px",
                        border: `2px solid ${isTopThree ? level.color : C.border}`,
                        boxShadow: isTopThree
                          ? `0 4px 16px ${level.color}33`
                          : "0 2px 8px rgba(0,0,0,0.04)",
                        transition: "all 0.3s ease",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = `0 6px 24px ${level.color}44`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = isTopThree
                          ? `0 4px 16px ${level.color}33`
                          : "0 2px 8px rgba(0,0,0,0.04)";
                      }}
                    >
                      {/* Top performer badge */}
                      {isTopThree && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            background: level.color,
                            color: "#fff",
                            padding: "2px 12px",
                            fontSize: "9px",
                            fontWeight: 700,
                            borderRadius: "0 10px 0 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {idx === 0 ? (
                            <>
                              <FiAward size={10} />
                              TOP
                            </>
                          ) : idx === 1 ? (
                            <>
                              <FiAward size={10} />
                              2ND
                            </>
                          ) : (
                            <>
                              <FiStar size={10} />
                              3RD
                            </>
                          )}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "clamp(15px, 3vw, 17px)",
                              fontWeight: 800,
                              color: C.dark,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <FiUser size={14} color={C.primary} />
                            {name}
                          </span>
                          <span
                            style={{
                              fontSize: "clamp(11px, 2.5vw, 13px)",
                              fontWeight: 700,
                            }}
                          >
                            {rankBadge}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "clamp(18px, 4vw, 22px)",
                            fontWeight: 900,
                            color: level.color,
                          }}
                        >
                          {memberTotal}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div
                        style={{
                          background: C.bg,
                          borderRadius: 4,
                          height: 4,
                          overflow: "hidden",
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: `${memberTotal}%`,
                            height: "100%",
                            background: `linear-gradient(90deg, ${level.color}, ${level.color}dd)`,
                            borderRadius: 4,
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>

                      {/* Performance level */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginBottom: 6,
                        }}
                      >
                        {level.icon}
                        <span
                          style={{
                            fontSize: "clamp(10px, 2.5vw, 11px)",
                            fontWeight: 600,
                            color: level.color,
                          }}
                        >
                          {level.label}
                        </span>
                      </div>

                      {/* ✅ DYNAMIC COMMENT INPUT */}
                      <div style={{ marginTop: 4 }}>
                        <label
                          style={{
                            fontSize: "clamp(9px, 2vw, 10px)",
                            fontWeight: 600,
                            color: C.muted,
                            display: "block",
                            marginBottom: 2,
                          }}
                        >
                          <FiMessageSquare
                            size={10}
                            style={{ marginRight: 4 }}
                          />
                          Feedback / Comments
                        </label>
                        <textarea
                          value={comment || ""}
                          onChange={(e) => updateComment(index, e.target.value)}
                          placeholder="Add your feedback, strengths, or areas for improvement..."
                          style={{
                            width: "100%",
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            padding: "6px 8px",
                            fontSize: "clamp(10px, 2.5vw, 11px)",
                            fontFamily: F.sans,
                            resize: "vertical",
                            minHeight: "50px",
                            outline: "none",
                            transition: "border-color 0.2s",
                            background: "#fafbfc",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.borderColor = C.primary;
                            e.currentTarget.boxShadow = `0 0 0 2px ${C.primary}22`;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.borderColor = C.border;
                            e.currentTarget.boxShadow = "none";
                          }}
                        />
                        {comment && comment.length > 0 && (
                          <div
                            style={{
                              fontSize: "9px",
                              color: C.muted,
                              marginTop: 2,
                              textAlign: "right",
                            }}
                          >
                            {comment.length} characters
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        )}

        {showRankings && sortedMembers.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "30px 20px",
              color: C.muted,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              <FiClipboard size={32} color={C.muted} />
            </div>
            <p>Add team members and scores to see rankings</p>
          </div>
        )}
      </div>

      {/* ✅ BEST PERFORMER DECLARATION + SIGNATURES
           Matches physical document: "የወሩ ምርጥ ፈፃሚ …ሆኖ ተመርጧል"
           Team Leader + up to 5 member signatures as per official form */}
      {sortedMembers.length > 0 && (
        <div
          style={{
            ...card,
            border: `2px solid ${C.gold}`,
            background: "linear-gradient(135deg, #fff, #fffdf0)",
          }}
        >
          {/* Best Performer Announcement */}
          <div
            style={{
              textAlign: "center",
              padding: "clamp(12px, 3vw, 20px)",
              borderBottom: `1px solid ${C.border}`,
              marginBottom: 20,
            }}
          >
            <div
              style={{ fontSize: "clamp(28px, 7vw, 40px)", marginBottom: 8 }}
            >
              <FiAward
                size={40}
                color={C.gold}
                style={{ display: "block", margin: "0 auto" }}
              />
            </div>
            <div
              style={{
                fontSize: "clamp(12px, 3vw, 14px)",
                color: C.muted,
                fontFamily: F.sans,
                marginBottom: 8,
              }}
            >
              {te.bestPerformerLabel ||
                "የወሩ ምርጥ ፈፃሚ / Best Performer of the Month"}
            </div>
            <div
              style={{
                fontSize: "clamp(18px, 5vw, 26px)",
                fontWeight: 900,
                color: C.dark,
                fontFamily: F.serif,
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: 4,
              }}
            >
              {sortedMembers[0]?.name || "—"}
            </div>
            <div
              style={{
                fontSize: "clamp(11px, 3vw, 13px)",
                color: C.muted,
                fontFamily: F.sans,
              }}
            >
              {te.bestPerformerSub || "ሆኖ ተመርጧል"} ·{" "}
              {sortedMembers[0]?.total || 0} {te.points || "pts"}
            </div>
          </div>

          {/* Signature Grid — Team Leader + up to 5 members */}
          <div>
            <div
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                fontWeight: 700,
                color: C.dark,
                fontFamily: F.sans,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FiPenTool size={14} />
              {te.signaturesTitle || "ፊርማዎች / Signatures"}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 160px), 1fr))",
                gap: "clamp(12px, 3vw, 20px)",
              }}
            >
              {/* Team Leader signature box */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${C.primary}10, ${C.gold}10)`,
                  border: `1.5px solid ${C.primary}`,
                  borderRadius: 10,
                  padding: "clamp(10px, 3vw, 16px)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(10px, 2.5vw, 11px)",
                    fontWeight: 700,
                    color: C.primary,
                    fontFamily: F.sans,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                >
                  <FiStar size={12} />
                  {te.teamLeaderLabel || "ቡድን መሪ / Team Leader"}
                </div>
                <input
                  type="text"
                  placeholder={te.namePlaceholder || "ስም / Name"}
                  style={{
                    width: "100%",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    padding: "6px 8px",
                    fontSize: "clamp(11px, 2.5vw, 12px)",
                    fontFamily: F.sans,
                    marginBottom: 8,
                    textAlign: "center",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <div
                  style={{
                    borderBottom: `1.5px solid ${C.dark}`,
                    marginTop: 24,
                    marginBottom: 4,
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    color: C.muted,
                    fontFamily: F.sans,
                  }}
                >
                  {te.signatureLine || "ፊርማ / Signature"}
                </div>
              </div>

              {/* Member signature boxes — one per evaluated member, max 5 */}
              {sortedMembers.slice(0, 5).map(({ name }, idx) => (
                <div
                  key={idx}
                  style={{
                    background: C.cardBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "clamp(10px, 3vw, 16px)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(10px, 2.5vw, 11px)",
                      fontWeight: 600,
                      color: C.muted,
                      fontFamily: F.sans,
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {te.memberLabel || "ተመዛኝ ፈፃሚ"} {idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(11px, 2.5vw, 13px)",
                      fontWeight: 700,
                      color: C.dark,
                      fontFamily: F.sans,
                      marginBottom: 4,
                      minHeight: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <FiUser size={12} color={C.primary} />
                    {name}
                  </div>
                  <div
                    style={{
                      borderBottom: `1.5px solid ${C.dark}`,
                      marginTop: 24,
                      marginBottom: 4,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 10,
                      color: C.muted,
                      fontFamily: F.sans,
                    }}
                  >
                    {te.signatureLine || "ፊርማ / Signature"}
                  </div>
                </div>
              ))}
            </div>

            {/* Date row */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 16,
                gap: 8,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "clamp(11px, 3vw, 12px)",
                  color: C.muted,
                  fontFamily: F.sans,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiCalendar size={12} />
                {te.dateLabel || "ቀን / Date:"}
              </span>
              <span
                style={{
                  fontSize: "clamp(11px, 3vw, 12px)",
                  color: C.dark,
                  fontFamily: F.sans,
                  fontWeight: 700,
                  borderBottom: `1px solid ${C.border}`,
                  minWidth: 120,
                  paddingBottom: 2,
                }}
              >
                {new Date().toLocaleDateString("en-GB")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "clamp(8px, 3vw, 12px)",
          justifyContent: "center",
          marginTop: "clamp(20px, 5vw, 28px)",
          flexWrap: "wrap",
        }}
      >
        <button
          style={{
            background: "#10b981",
            color: "#fff",
            border: "none",
            padding: "clamp(8px, 2.5vw, 11px) clamp(16px, 5vw, 26px)",
            borderRadius: 8,
            fontSize: "clamp(12px, 3.5vw, 14px)",
            fontWeight: 700,
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={saveEvaluation}
          disabled={saving}
        >
          {saving ? (
            <>
              <FiLoader
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
              Saving...
            </>
          ) : (
            <>
              <FiSave size={16} />
              Save Evaluation
            </>
          )}
        </button>
        <button
          style={{
            background: "#dc2626",
            color: "#fff",
            border: "none",
            padding: "clamp(8px, 2.5vw, 11px) clamp(16px, 5vw, 26px)",
            borderRadius: 8,
            fontSize: "clamp(12px, 3.5vw, 14px)",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={() => {
            const bestPerformerName =
              sortedMembers.length > 0 ? sortedMembers[0].name : null;
            exportEvaluationReportToPDF(
              scores,
              members.filter((m) => m.trim() !== ""),
              (m) => total(m),
              bestPerformerName,
              t,
              comments,
            );
          }}
        >
          <FiDownload size={16} />
          Export PDF
        </button>
        <button
          style={{
            ...btn.secondary,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={() => {
            setScores({});
            setComments({});
            setMembers(["", "", ""]);
            setTeamName("");
            setEvaluationId(null);
            localStorage.removeItem("currentEvaluation");
          }}
        >
          <FiRefreshCw size={16} />
          {te.reset || "Reset"}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
