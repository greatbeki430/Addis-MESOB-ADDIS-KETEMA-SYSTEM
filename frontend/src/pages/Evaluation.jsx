// frontend/src/pages/Evaluation.jsx
// ════════════════════════════════════════════════════════════
// pages/Evaluation - With Dynamic Comments & Database Storage
// ════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { CRITERIA } from "../constants/criteria";
import { exportEvaluationReportToPDF } from "../utils/pdfExport";
import { useAuth } from "../hooks/useAuth";
import { evaluationAPI, teamAPI } from "../services/api";
import { aiAPI } from "../services/api";
import { AISummary, AIEvaluationHelper } from "../components/ai";
import { useToast } from "../hooks/useToast";
// import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";
import SignatureModal from "../components/SignatureModal";
import EvaluationFeed from "../components/EvaluationFeed";
import {
  canEvaluateTeam,
  canViewEvaluationForm,
  // canEditEvaluation,
  canDeleteEvaluation,
  // canExportEvaluationPDF,
  getUserTeamId,
  isAdminOrAbove,
} from "../utils/roles";
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
  FiZap,
  FiInfo,
  FiList,
  FiSend,
  FiEye,
  FiTrash2,
  FiLock,
} from "react-icons/fi";

// ─── Format AI Narrative - Removes markdown and formats nicely ──
const formatAINarrative = (text) => {
  if (!text) return "";

  let formatted = text
    // Remove ** (bold markers)
    .replace(/\*\*/g, "")
    // Remove * (italic markers)
    .replace(/\*/g, "")
    // Remove ### headers
    .replace(/### /g, "")
    // Remove --- separators
    .replace(/---/g, "")
    // Clean up multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    // Remove trailing spaces
    .replace(/[ \t]+$/gm, "")
    // Clean up bullet points
    .replace(/^[•·-]\s*/gm, "• ")
    // Remove empty parentheses
    .replace(/\(\s*\)/g, "")
    .trim();

  // Remove any remaining asterisks
  formatted = formatted.replace(/\*/g, "");

  // Clean up extra spaces
  formatted = formatted.replace(/\s{2,}/g, " ");

  // Add proper section headers with spacing
  const sectionHeaders = [
    "Overall Team Performance Overview",
    "Strengths and Best Performer Recognition",
    "Areas for Improvement and Recommendations",
  ];

  sectionHeaders.forEach((header) => {
    const regex = new RegExp(`(${header})`, "g");
    formatted = formatted.replace(regex, "\n📌 $1\n");
  });

  // Clean up multiple newlines
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted;
};

function EvaluationForm({ t, lang }) {
  // ✅ Use language context
  const { language: contextLang, t: contextT } = useLanguage();
  // Use context language or props language (props take precedence)
  const currentLang = lang || contextLang || "am";

  const safeT = t || contextT || {};
  const te = safeT.evaluation || {};
  const safeCriteria = safeT.criteria || {};

  const { user } = useAuth();
  const { showToast } = useToast();

  // ─── State ──────────────────────────────────────────────────────────
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [members, setMembers] = useState(["", "", ""]);
  const [teamName, setTeamName] = useState("");
  const [showRankings, setShowRankings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluationId, setEvaluationId] = useState(null);
  const [signatures, setSignatures] = useState({});
  const [includeAINarrative, setIncludeAINarrative] = useState(true);
  const [aiNarrativeContent, setAiNarrativeContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [userTeamId, setUserTeamId] = useState(null);
  const [canEvaluate, setCanEvaluate] = useState(false);

  // ─── Tab Management ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("form"); // "form" | "history"
  const [savedEvaluations, setSavedEvaluations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [signatureModal, setSignatureModal] = useState({
    isOpen: false,
    memberName: "",
    onConfirm: null,
  });

  const inputRefs = useRef({});
  const memberInputRefs = useRef([]);
  const isMountedRef = useRef(true);

  // ─── Cleanup on unmount ─────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── Load user's team and set permissions ──────────────────────
  useEffect(() => {
    const loadUserTeam = async () => {
      try {
        setLoading(true);
        const teamId = getUserTeamId(user);
        if (teamId) {
          setUserTeamId(teamId);
          // Check if user can evaluate this team
          const canEval = canEvaluateTeam(user, teamId);
          setCanEvaluate(canEval);

          // Load team details if user is a leader
          if (canEval) {
            const response = await teamAPI.getById(teamId);
            if (response?.data) {
              const teamData = response.data;
              setTeamName(teamData.name || teamData.department || "");
              const teamMembers =
                teamData.members?.map((m) => m.name || m) || [];
              if (teamMembers.length > 0) {
                setMembers(teamMembers);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to load team:", error);
        // Don't show error toast here to avoid confusion
      } finally {
        setLoading(false);
      }
    };
    loadUserTeam();
  }, [user]);

  // ─── Effect to load history when tab changes ──────────────
  useEffect(() => {
    let isActive = true;

    const fetchHistory = async () => {
      if (activeTab === "history" && isActive) {
        setLoadingHistory(true);
        try {
          // Load history for user's team or all if admin
          let response;
          if (isAdminOrAbove(user) && !userTeamId) {
            response = await evaluationAPI.getAll();
          } else if (userTeamId) {
            response = await evaluationAPI.getByTeam(userTeamId);
          } else {
            response = { data: [] };
          }
          if (isActive) {
            setSavedEvaluations(response.data || []);
          }
        } catch (error) {
          if (isActive) {
            console.error("Failed to load evaluations:", error);
            showToast(
              te.loadError || "Failed to load evaluation history",
              "error",
            );
          }
        } finally {
          if (isActive) {
            setLoadingHistory(false);
          }
        }
      }
    };

    fetchHistory();

    return () => {
      isActive = false;
    };
  }, [activeTab, showToast, te.loadError, userTeamId, user]);

  // ─── Load an evaluation from history ──────────────────────
  const loadEvaluation = (evalData) => {
    setMembers(evalData.members || ["", "", ""]);
    setScores(evalData.scores || {});
    setComments(evalData.comments || {});
    setTeamName(evalData.teamName || "");
    setSignatures(evalData.signatures || {});
    setEvaluationId(evalData._id);
    setActiveTab("form");
    showToast(te.loadSuccess || "Evaluation loaded successfully!", "success");
  };

  const openSignatureModal = (memberName) => {
    setSignatureModal({
      isOpen: true,
      memberName,
      onConfirm: (data) => {
        handleSignatureSave(memberName, data);
        setSignatureModal({ isOpen: false, memberName: "", onConfirm: null });
      },
    });
  };

  // ─── Delete an evaluation ──────────────────────────────────────
  const deleteEvaluation = async (evalId, evalName) => {
    // Check permission
    if (!canDeleteEvaluation(user, { _id: evalId, team: userTeamId })) {
      showToast(
        "You don't have permission to delete this evaluation",
        "warning",
      );
      return;
    }

    const confirmMsg =
      te.deleteConfirm || 'Are you sure you want to delete "{name}"?';
    if (
      !window.confirm(
        confirmMsg.replace(
          "{name}",
          evalName || te.untitledTeam || "Untitled Team",
        ),
      )
    ) {
      return;
    }

    try {
      await evaluationAPI.delete(evalId);
      setSavedEvaluations((prev) => prev.filter((e) => e._id !== evalId));
      const successMsg =
        te.deleteSuccess || '✅ "{name}" deleted successfully!';
      showToast(
        successMsg.replace(
          "{name}",
          evalName || te.untitledTeam || "Untitled Team",
        ),
        "success",
      );
    } catch (error) {
      console.error("Failed to delete evaluation:", error);
      showToast(
        te.deleteError || "Failed to delete evaluation. Please try again.",
        "error",
      );
    }
  };

  // ─── Pass to Super Admin ────────────────────────────────────
  const passToSuperAdmin = async () => {
    if (!evaluationId) {
      showToast(
        te.saveFirstWarning || "Please save the evaluation first",
        "warning",
      );
      return;
    }

    // Check permission
    if (!canEvaluate) {
      showToast(
        "You don't have permission to submit this evaluation",
        "warning",
      );
      return;
    }

    try {
      await evaluationAPI.update(evaluationId, {
        status: "submitted",
        submittedTo: "superadmin",
        submittedAt: new Date().toISOString(),
      });
      showToast(
        te.passedSuccess || "✅ Evaluation passed to Super Admin for review!",
        "success",
      );
    } catch (error) {
      console.error("Failed to pass evaluation:", error);
      showToast(
        te.passedError || "Failed to pass evaluation to Super Admin",
        "error",
      );
    }
  };

  // ─── Auto-advance for SCORE fields ──────────────────────────
  const autoAdvanceScore = (currentField) => {
    const [cId, itemIdx, member] = currentField.split("-");
    const allMembers = members.filter((m) => m.trim() !== "");
    const currentMemberIndex = allMembers.indexOf(member);
    const currentCriterionIndex = parseInt(cId) - 1;
    const currentItemIndex = parseInt(itemIdx);

    const totalItemsInCurrentCriterion =
      CRITERIA[currentCriterionIndex]?.items?.length || 0;

    let nextCriterionId = parseInt(cId);
    let nextItemIdx = currentItemIndex;
    let nextMemberIndex = currentMemberIndex + 1;

    if (nextMemberIndex >= allMembers.length) {
      nextMemberIndex = 0;
      nextItemIdx = currentItemIndex + 1;

      if (nextItemIdx >= totalItemsInCurrentCriterion) {
        nextItemIdx = 0;
        nextCriterionId = parseInt(cId) + 1;

        if (nextCriterionId > CRITERIA.length) {
          nextCriterionId = 1;
        }
      }
    }

    const nextMember = allMembers[nextMemberIndex];
    if (nextMember) {
      const nextInputId = getInputId(nextCriterionId, nextItemIdx, nextMember);
      setTimeout(() => {
        const nextInput = inputRefs.current[nextInputId];
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }, 50);
    }
  };

  // ─── Auto-save to localStorage ─────────────────────────────
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
      signatures,
      lastUpdated: new Date().toISOString(),
    };

    const timer = setTimeout(() => {
      localStorage.setItem("currentEvaluation", JSON.stringify(data));
    }, 500);

    return () => clearTimeout(timer);
  }, [members, scores, comments, teamName, evaluationId, signatures]);

  // ─── Load saved evaluation ─────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const loadSavedEvaluation = () => {
      const savedEvaluation = localStorage.getItem("currentEvaluation");
      if (savedEvaluation) {
        try {
          const data = JSON.parse(savedEvaluation);
          if (isMounted) {
            if (data.members) setMembers(data.members);
            if (data.scores) setScores(data.scores);
            if (data.comments) setComments(data.comments);
            if (data.teamName) setTeamName(data.teamName);
            if (data.evaluationId) setEvaluationId(data.evaluationId);
            if (data.signatures) setSignatures(data.signatures);

            if (data.evaluationId) {
              evaluationAPI
                .getById(data.evaluationId)
                .then((res) => {
                  if (isMounted && res?.data?.signatures) {
                    setSignatures(res.data.signatures);
                  }
                })
                .catch((err) =>
                  console.warn(
                    "Could not refresh signatures from server:",
                    err,
                  ),
                );
            }
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
  }, []);

  // ─── Member management ──────────────────────────────────────
  const addMember = () => {
    if (members.length < 7) {
      setMembers((prev) => [...prev, ""]);
      const newComments = { ...comments };
      newComments[members.length] = "";
      setComments(newComments);
      setTimeout(() => {
        const newIndex = members.length;
        memberInputRefs.current[newIndex]?.focus();
      }, 100);
    }
  };

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
      const newComments = { ...comments };
      delete newComments[index];
      setComments(newComments);
    }
  };

  const updateMemberName = (index, name) => {
    const newMembers = [...members];
    newMembers[index] = name;
    setMembers(newMembers);
  };

  const updateComment = (index, comment) => {
    console.log(`📝 Updating comment for ${members[index] || index}:`, comment);
    setComments((prev) => ({
      ...prev,
      [index]: comment,
    }));
  };

  // ─── Score management ──────────────────────────────────────
  const setScore = (cId, iIdx, m, v) => {
    // Check permission - only allow if user can evaluate
    if (!canEvaluate) {
      showToast("You don't have permission to evaluate this team", "warning");
      return;
    }

    const key = `${cId}-${iIdx}-${m}`;
    const max = CRITERIA[cId - 1].items[iIdx].points;
    const value = Math.min(Number(v), max);
    setScores((s) => ({ ...s, [key]: isNaN(value) ? "" : value }));

    if (v && !isNaN(v) && v > 0) {
      autoAdvanceScore(`${cId}-${iIdx}-${m}`);
    }
  };

  const total = (m) =>
    CRITERIA.flatMap((c) =>
      c.items.map((_, i) => scores[`${c.id}-${i}-${m}`] || 0),
    ).reduce((a, b) => a + b, 0);

  // ─── Computed values ──────────────────────────────────────
  const totals = members
    .filter((m) => m.trim() !== "")
    .map((m, idx) => ({
      name: m,
      index: idx,
      total: total(m),
      comment: comments[idx] || "",
    }));

  const sortedMembers = [...totals].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.name.localeCompare(b.name);
  });

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

  // ─── Signature handling ─────────────────────────────────────
  const handleSignatureSave = (memberName, signatureData) => {
    setSignatures((prev) => ({
      ...prev,
      [memberName]: signatureData,
    }));
  };

  // ─── Save evaluation ──────────────────────────────────────
  const saveEvaluation = async () => {
    // Check permission
    if (!canEvaluate) {
      showToast(
        "You don't have permission to save evaluations for this team",
        "warning",
      );
      return;
    }

    const validMembers = members.filter((m) => m.trim() !== "");
    if (validMembers.length === 0) {
      showToast(
        te.noMembers || "Please add at least one team member",
        "warning",
      );
      return;
    }

    try {
      setSaving(true);

      const totalScoresData = validMembers.map((m) => ({
        name: m,
        total: total(m),
      }));

      const bestPerformerName =
        totalScoresData.length > 0
          ? totalScoresData.reduce((a, b) => (a.total > b.total ? a : b)).name
          : null;

      const evaluationData = {
        teamName: teamName || te.untitledTeam || "Untitled Team",
        members: validMembers,
        scores: scores,
        comments: comments,
        signatures: signatures,
        totalScores: totalScoresData,
        evaluatedBy: user?.name || user?.email || "Unknown",
        evaluatedAt: new Date().toISOString(),
        language: currentLang || "am",
        status: "submitted",
        bestPerformer: bestPerformerName,
        averageScore: averageScore,
        highestScore: highestScore,
        lowestScore: lowestScore,
        totalMembers: totalMembers,
        teamId: userTeamId,
      };

      let response;
      if (evaluationId) {
        response = await evaluationAPI.update(evaluationId, evaluationData);
        showToast(
          te.saveSuccess || "✅ Evaluation updated successfully!",
          "success",
        );
      } else {
        response = await evaluationAPI.create(evaluationData);
        setEvaluationId(response.data._id);
        showToast(
          te.saveSuccess || "✅ Evaluation saved successfully!",
          "success",
        );
      }
    } catch (error) {
      console.error("Failed to save evaluation:", error);
      showToast(
        error.response?.data?.message ||
          te.saveError ||
          "Failed to save evaluation. Please try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Reset form ──────────────────────────────────────────
  const resetForm = () => {
    setScores({});
    setComments({});
    setMembers(["", "", ""]);
    setTeamName("");
    setEvaluationId(null);
    setSignatures({});
    localStorage.removeItem("currentEvaluation");
    showToast(te.resetSuccess || "Form reset successfully", "info");
  };

  // ─── Helper functions ──────────────────────────────────────
  const getRankBadge = (index, total) => {
    if (total <= 1) return "🥇";
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90)
      return {
        label: te.performanceLevelOutstanding || "Outstanding",
        color: "#10b981",
        icon: <FiStar size={14} />,
        description:
          te.performanceOutstandingDesc ||
          "Exceptional performance exceeding all expectations",
      };
    if (score >= 80)
      return {
        label: te.performanceLevelExcellent || "Excellent",
        color: "#3b82f6",
        icon: <FiAward size={14} />,
        description:
          te.performanceExcellentDesc ||
          "Strong performance meeting all standards",
      };
    if (score >= 70)
      return {
        label: te.performanceLevelGood || "Good",
        color: "#8b5cf6",
        icon: <FiThumbsUp size={14} />,
        description:
          te.performanceGoodDesc ||
          "Satisfactory performance with room for growth",
      };
    if (score >= 60)
      return {
        label: te.performanceLevelAverage || "Average",
        color: "#f59e0b",
        icon: <FiBarChart2 size={14} />,
        description:
          te.performanceAverageDesc ||
          "Meets minimum requirements, improvement needed",
      };
    if (score >= 50)
      return {
        label: te.performanceLevelNeedsImprovement || "Needs Improvement",
        color: "#f97316",
        icon: <FiTrendingUp size={14} />,
        description:
          te.performanceImprovementDesc ||
          "Significant improvement needed in key areas",
      };
    return {
      label: te.performanceLevelNeedsAttention || "Needs Attention",
      color: "#ef4444",
      icon: <FiAlertCircle size={14} />,
      description:
        te.performanceAttentionDesc ||
        "Immediate action required to improve performance",
    };
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

  // ─── Translation helpers ──────────────────────────────────
  const teKey = (key, fallback) => safeT?.(`evaluation.${key}`) || fallback;
  const tcKey = (key, fallback) => safeT?.(`common.${key}`) || fallback;

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
        <FiLoader
          size={32}
          style={{
            animation: "spin 1s linear infinite",
            display: "block",
            margin: "0 auto 12px",
          }}
        />
        <p>Loading your team information...</p>
      </div>
    );
  }

  // ─── No Team Access ─────────────────────────────────────────────────
  if (!userTeamId && !isAdminOrAbove(user)) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          textAlign: "center",
          padding: "40px 20px",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
        <h2 style={{ color: C.dark, marginBottom: 8 }}>No Team Assigned</h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          You are not currently assigned to any team. Please contact your
          administrator to be added to a team.
        </p>
        {isAdminOrAbove(user) && (
          <p style={{ color: C.primary, fontSize: 13, marginTop: 8 }}>
            As an admin, you can view all evaluations in the history tab.
          </p>
        )}
      </div>
    );
  }

  // ─── No Permission ──────────────────────────────────────────────────
  if (!canViewEvaluationForm(user, userTeamId) && !isAdminOrAbove(user)) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "40px auto",
          textAlign: "center",
          padding: "40px 20px",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: C.dark, marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
          You don't have permission to evaluate this team. Only Team Leaders and
          above can evaluate team members.
        </p>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>
          You can view evaluations in the feed below.
        </p>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────
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
          {teKey("title", "Peer Forum Evaluation")}
        </h1>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* ✅ LANGUAGE SELECTOR */}
          {/* <LanguageSelector variant="default" /> */}

          {/* Permission badge */}
          {!canEvaluate && userTeamId && (
            <span
              style={{
                background: "#FEF3C7",
                color: "#92400E",
                padding: "2px 12px",
                borderRadius: 20,
                fontSize: "10px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiLock size={12} /> Read-Only
            </span>
          )}
          {canEvaluate && (
            <span
              style={{
                background: "#10b981",
                color: "#fff",
                padding: "2px 12px",
                borderRadius: 20,
                fontSize: "10px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FiCheck size={12} /> Team Leader
            </span>
          )}

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
            {teKey("outOf", "Out of 100 pts")}
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
              {tcKey("saved", "Saved")}
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
        {teKey("subtitle", "Addis Ababa City Admin · Public Service Bureau")}
      </p>

      {/* ─── Tab Navigation ───*/}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "clamp(16px, 4vw, 24px)",
          borderBottom: `2px solid ${C.border}`,
          paddingBottom: "8px",
          flexWrap: "nowrap",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          alignItems: "center",
          minHeight: "48px",
        }}
      >
        <button
          onClick={() => setActiveTab("form")}
          style={{
            padding: "8px 16px",
            background: activeTab === "form" ? C.primary : "transparent",
            color: activeTab === "form" ? "#fff" : C.muted,
            border: "none",
            borderRadius: 8,
            fontSize: "clamp(11px, 2.5vw, 14px)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <FiClipboard size={16} />
          <span>{teKey("evalForm", "Evaluation Form")}</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "8px 16px",
            background: activeTab === "history" ? C.primary : "transparent",
            color: activeTab === "history" ? "#fff" : C.muted,
            border: "none",
            borderRadius: 8,
            fontSize: "clamp(11px, 2.5vw, 14px)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <FiList size={16} />
          <span>
            {teKey("evalHistory", "History")} ({savedEvaluations.length})
          </span>
        </button>

        <div style={{ flex: 1, minWidth: "8px" }} />

        {evaluationId && canEvaluate && (
          <button
            onClick={passToSuperAdmin}
            style={{
              padding: "8px 16px",
              background: "#8b5cf6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: "clamp(11px, 2.5vw, 14px)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#7c3aed";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(139,92,246,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#8b5cf6";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FiSend size={16} />
            <span className="pass-to-superadmin-text">
              {teKey("passToSuperAdmin", "Pass to Super Admin")}
            </span>
            <style>{`
              @media (max-width: 480px) {
                .pass-to-superadmin-text {
                  display: none !important;
                }
              }
            `}</style>
          </button>
        )}
      </div>

      {/* ─── History Tab Content ─── */}
      {activeTab === "history" && (
        <div style={{ marginBottom: "clamp(20px, 4vw, 32px)" }}>
          {loadingHistory ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: C.muted }}
            >
              <FiLoader
                size={24}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <p>{teKey("loading", "Loading evaluations...")}</p>
            </div>
          ) : savedEvaluations.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: C.muted,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>
                {teKey("noSavedEvaluations", "No saved evaluations found")}
              </p>
              <p style={{ fontSize: 13, color: "#999" }}>
                {teKey("saveFirst", "Save an evaluation to see it here")}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {savedEvaluations.map((evalItem) => {
                const canDelete = canDeleteEvaluation(user, {
                  _id: evalItem._id,
                  team: userTeamId,
                });
                return (
                  <div
                    key={evalItem._id}
                    style={{
                      background: C.white,
                      borderRadius: 10,
                      padding: "14px 18px",
                      border: `1px solid ${C.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.boxShadow =
                        "0 4px 16px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: C.dark,
                        }}
                      >
                        {evalItem.teamName ||
                          teKey("untitledTeam", "Untitled Team")}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: C.muted,
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>
                          {evalItem.members?.length || 0}{" "}
                          {tcKey("members", "members")}
                        </span>
                        <span>•</span>
                        <span>
                          {tcKey("avg", "Avg")}: {evalItem.averageScore || 0}{" "}
                          {teKey("points", "pts")}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(evalItem.createdAt).toLocaleDateString()}
                        </span>
                        {evalItem.status && (
                          <span
                            style={{
                              background:
                                evalItem.status === "submitted"
                                  ? "#DBEAFE"
                                  : "#D1FAE5",
                              color:
                                evalItem.status === "submitted"
                                  ? "#1D4ED8"
                                  : "#065F46",
                              padding: "1px 8px",
                              borderRadius: "12px",
                              fontSize: "10px",
                              fontWeight: 600,
                            }}
                          >
                            {evalItem.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => loadEvaluation(evalItem)}
                        style={{
                          ...btn.small,
                          padding: "4px 12px",
                          fontSize: "12px",
                          background: C.primary,
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = C.light;
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = C.primary;
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <FiEye size={14} />
                        {teKey("loadEval", "Load")}
                      </button>
                      {canDelete && (
                        <button
                          onClick={() =>
                            deleteEvaluation(evalItem._id, evalItem.teamName)
                          }
                          style={{
                            padding: "4px 12px",
                            fontSize: "12px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fecaca";
                            e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fee2e2";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                        >
                          <FiTrash2 size={14} />
                          {teKey("deleteEval", "Delete")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Rest of the form content ─── */}
      {activeTab === "form" && (
        <>
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
              {teKey("teamName", "Team Name / Department")}
            </label>
            <input
              type="text"
              style={inp}
              placeholder={teKey(
                "teamNamePlaceholder",
                "e.g., Addis Ketema Service Team",
              )}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={!canEvaluate}
            />
            {!canEvaluate && (
              <p style={{ fontSize: "11px", color: "#ef4444", marginTop: 4 }}>
                <FiLock size={12} style={{ marginRight: 4 }} />
                Team name is read-only
              </p>
            )}
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
                {teKey("teamMembers", "Team Members")}{" "}
                {teKey("maxMembers", "(Max 7)")}
                {!canEvaluate && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#ef4444",
                      fontWeight: 400,
                      marginLeft: 8,
                    }}
                  >
                    🔒 Read-only
                  </span>
                )}
              </h3>
              {canEvaluate && members.length < 7 && (
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
                  {teKey("addMember", "Add Member")}
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
                    ref={(el) => (memberInputRefs.current[idx] = el)}
                    style={{ ...inp, flex: 1 }}
                    placeholder={teKey(
                      "memberPlaceholder",
                      "Member {number}",
                    ).replace("{number}", idx + 1)}
                    value={member}
                    onChange={(e) => updateMemberName(idx, e.target.value)}
                    disabled={!canEvaluate}
                  />
                  {canEvaluate && members.length > 1 && (
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
          {CRITERIA.map((c) => {
            const isReadOnly = !canEvaluate;
            return (
              <div
                key={c.id}
                style={{
                  ...card,
                  borderLeft: `5px solid ${c.color}`,
                  paddingLeft: "clamp(12px, 3vw, 20px)",
                  overflowX: "auto",
                  opacity: isReadOnly ? 0.85 : 1,
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
                  {isReadOnly && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#ef4444",
                        fontWeight: 400,
                        marginLeft: 8,
                      }}
                    >
                      🔒 Read-only
                    </span>
                  )}
                </h3>

                <div
                  style={{
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
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
                          {teKey("maxPts", "Max Pts")}
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
                                <td
                                  key={m}
                                  style={{ ...tdS, textAlign: "center" }}
                                >
                                  <input
                                    ref={(el) =>
                                      (inputRefs.current[inputId] = el)
                                    }
                                    id={inputId}
                                    type="number"
                                    min="0"
                                    max={item.points}
                                    disabled={isReadOnly}
                                    style={{
                                      width: "clamp(50px, 12vw, 60px)",
                                      border: `1.5px solid ${isReadOnly ? "#e5e7eb" : C.border}`,
                                      borderRadius: 6,
                                      padding: "clamp(3px, 1.5vw, 6px)",
                                      textAlign: "center",
                                      fontSize: "clamp(11px, 3vw, 13px)",
                                      background: isReadOnly
                                        ? "#f3f4f6"
                                        : "white",
                                      cursor: isReadOnly
                                        ? "not-allowed"
                                        : "text",
                                      opacity: isReadOnly ? 0.7 : 1,
                                    }}
                                    value={scores[`${c.id}-${idx}-${m}`] || ""}
                                    onChange={(e) =>
                                      setScore(c.id, idx, m, e.target.value)
                                    }
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
            );
          })}

          {/* RANKINGS WITH DYNAMIC COMMENTS */}
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
                  {teKey(
                    "performanceRankings",
                    "Performance Rankings & Feedback",
                  )}
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
                    {sortedMembers.length} {tcKey("members", "Members")}
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
                    {teKey("best", "Best")}: {bestPerformer}
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
                    {tcKey("avg", "Avg")}: {averageScore}
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
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
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
                      {tcKey("totalMembers", "Total Members")}
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
                      {teKey("averageScore", "Average Score")}
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
                      {teKey("highestScore", "Highest Score")}
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
                      {teKey("lowestScore", "Lowest Score")}
                    </div>
                  </div>
                </div>

                {/* Compact Cards with Comments */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
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
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.boxShadow = `0 6px 24px ${level.color}44`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = isTopThree
                              ? `0 4px 16px ${level.color}33`
                              : "0 2px 8px rgba(0,0,0,0.04)";
                          }}
                        >
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
                                  {teKey("top", "TOP")}
                                </>
                              ) : idx === 1 ? (
                                <>
                                  <FiAward size={10} />
                                  {teKey("rank2nd", "2ND")}
                                </>
                              ) : (
                                <>
                                  <FiStar size={10} />
                                  {teKey("rank3rd", "3RD")}
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
                            <span
                              style={{
                                fontSize: "9px",
                                color: C.muted,
                                marginLeft: "auto",
                              }}
                            >
                              {level.description}
                            </span>
                          </div>

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
                              {teKey("feedbackComments", "Feedback / Comments")}
                            </label>
                            <textarea
                              value={comment || ""}
                              onChange={(e) => {
                                if (!canEvaluate) {
                                  showToast(
                                    "You don't have permission to add feedback",
                                    "warning",
                                  );
                                  return;
                                }
                                const val = e.target.value;
                                console.log(
                                  `✏️ Textarea changed for ${name}:`,
                                  val,
                                );
                                updateComment(index, val);
                              }}
                              placeholder={teKey(
                                "addFeedbackPlaceholder",
                                "Add your feedback, strengths, or areas for improvement...",
                              )}
                              disabled={!canEvaluate}
                              style={{
                                width: "100%",
                                border: `1px solid ${canEvaluate ? C.border : "#e5e7eb"}`,
                                borderRadius: 6,
                                padding: "6px 8px",
                                fontSize: "clamp(10px, 2.5vw, 11px)",
                                fontFamily: F.sans,
                                resize: "vertical",
                                minHeight: "50px",
                                outline: "none",
                                transition: "border-color 0.2s",
                                background: canEvaluate ? "#fafbfc" : "#f3f4f6",
                                cursor: canEvaluate ? "text" : "not-allowed",
                                opacity: canEvaluate ? 1 : 0.6,
                              }}
                              onFocus={(e) => {
                                if (canEvaluate) {
                                  e.currentTarget.borderColor = C.primary;
                                  e.currentTarget.boxShadow = `0 0 0 2px ${C.primary}22`;
                                }
                              }}
                              onBlur={(e) => {
                                if (canEvaluate) {
                                  e.currentTarget.borderColor = C.border;
                                  e.currentTarget.boxShadow = "none";
                                }
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
                                {comment.length}{" "}
                                {tcKey("characters", "characters")}
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
                <p>
                  {teKey(
                    "noRankings",
                    "Add team members and scores to see rankings",
                  )}
                </p>
              </div>
            )}
          </div>

          {/* BEST PERFORMER DECLARATION + SIGNATURES */}
          {sortedMembers.length > 0 && (
            <div
              style={{
                ...card,
                border: `2px solid ${C.gold}`,
                background: "linear-gradient(135deg, #fff, #fffdf0)",
              }}
            >
              {/* Best Performer Announcement (unchanged) */}
              <div
                style={{
                  textAlign: "center",
                  padding: "clamp(12px, 3vw, 20px)",
                  borderBottom: `1px solid ${C.border}`,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(28px, 7vw, 40px)",
                    marginBottom: 8,
                  }}
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
                  {teKey("bestPerformerLabel", "Best Performer of the Month")}
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
                  {teKey("bestPerformerSub", "has been selected")} ·{" "}
                  {sortedMembers[0]?.total || 0} {teKey("points", "pts")}
                </div>
              </div>

              {/* Clickable Signature Cards */}
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
                  {teKey("signaturesTitle", "Digital Signatures")}
                  <span
                    style={{
                      fontSize: "10px",
                      color: C.muted,
                      fontWeight: 400,
                    }}
                  >
                    ({teKey("clickToSign", "Click to sign")})
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
                    gap: "12px",
                  }}
                >
                  {/* Team Leader card */}
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${C.primary}10, ${C.gold}10)`,
                      border: `2px solid ${C.primary}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onClick={() => openSignatureModal("teamLeader")}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}44`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: C.primary,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      <FiStar size={12} style={{ marginRight: 4 }} />
                      {teKey("teamLeaderLabel", "Team Leader")}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: C.dark,
                        margin: "4px 0",
                      }}
                    >
                      {teamName || teKey("namePlaceholder", "Name")}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: signatures.teamLeader ? "#10b981" : "#f59e0b",
                        fontWeight: 600,
                      }}
                    >
                      {signatures.teamLeader ? "✅ Signed" : "⏳ Not Signed"}
                    </div>
                  </div>

                  {/* Member cards */}
                  {sortedMembers.map(({ name }, idx) => {
                    const isSigned = !!signatures[name];
                    return (
                      <div
                        key={idx}
                        style={{
                          background: C.cardBg,
                          border: `2px solid ${isSigned ? C.primary : C.border}`,
                          borderRadius: 10,
                          padding: "12px 14px",
                          textAlign: "center",
                          cursor: "pointer",
                          transition:
                            "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                        onClick={() => openSignatureModal(name)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(0,0,0,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            color: C.muted,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {teKey("memberLabel", "Team Member")} {idx + 1}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: C.dark,
                            margin: "4px 0",
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
                            fontSize: "11px",
                            fontWeight: 600,
                            color: isSigned ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {isSigned ? "✅ Signed" : "⏳ Not Signed"}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  {teKey("dateLabel", "Date:")}
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
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* ENHANCED AI EVALUATION HELPER WITH ADVANCED INSIGHTS */}
          {/* ════════════════════════════════════════════════════════════ */}
          {evaluationId && (
            <div style={{ marginTop: "clamp(16px, 4vw, 24px)" }}>
              <div
                style={{
                  ...card,
                  border: `2px solid ${C.primary}`,
                  background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
                  padding: "clamp(16px, 4vw, 24px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "16px",
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
                        width: "40px",
                        height: "40px",
                        background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                      }}
                    >
                      <FiZap size={20} />
                    </div>
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "clamp(14px, 4vw, 16px)",
                          fontWeight: 700,
                          color: "#0F172A",
                          fontFamily: F.sans,
                        }}
                      >
                        {teKey("aiInsights", "AI Evaluation Insights")}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: C.muted,
                        }}
                      >
                        {teKey(
                          "aiInsightsDesc",
                          "Advanced AI analysis of team performance with recommendations",
                        )}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        background: C.primary,
                        color: "#fff",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "10px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiAward size={12} />
                      {teKey("aiPowered", "AI Powered")}
                    </span>
                    {evaluationId && (
                      <span
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: "10px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <FiCheck size={12} />
                        {totalMembers} {tcKey("members", "Members")}
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Evaluation Helper Component */}
                <AIEvaluationHelper
                  evaluationData={{
                    teamName:
                      teamName || teKey("untitledTeam", "Untitled Team"),
                    members: members.filter((m) => m.trim() !== ""),
                    totalScores: sortedMembers.map((m) => ({
                      member: m.name,
                      total: m.total,
                      comment: m.comment || "",
                    })),
                    comments: comments,
                    evaluatedBy: user?.name || "Administrator",
                    period: "current period",
                    averageScore: averageScore,
                    highestScore: highestScore,
                    lowestScore: lowestScore,
                    bestPerformer: bestPerformer,
                    totalMembers: totalMembers,
                    criteriaScores: sortedMembers.map((m) => {
                      const memberScores = {};
                      CRITERIA.forEach((c) => {
                        c.items.forEach((item, idx) => {
                          const key = `${c.id}-${idx}-${m.name}`;
                          memberScores[c.key] =
                            (memberScores[c.key] || 0) + (scores[key] || 0);
                        });
                      });
                      return { member: m.name, ...memberScores };
                    }),
                  }}
                  onApplyFeedback={(feedback) => {
                    // Apply AI feedback to each member's comment
                    if (feedback && feedback.individualFeedback) {
                      feedback.individualFeedback.forEach((item) => {
                        const memberIndex = members.findIndex(
                          (m) => m === item.member,
                        );
                        if (memberIndex !== -1) {
                          const existingComment = comments[memberIndex] || "";
                          const enhancedComment = `${existingComment}\n\n🤖 AI Analysis: ${item.feedback}`;
                          setComments((prev) => ({
                            ...prev,
                            [memberIndex]: enhancedComment.trim(),
                          }));
                        }
                      });
                      showToast(
                        teKey(
                          "aiFeedbackApplied",
                          "✅ Applied AI feedback for {count} member(s)",
                        ).replace(
                          "{count}",
                          feedback.individualFeedback.length,
                        ),
                        "success",
                      );
                    } else {
                      showToast(
                        teKey(
                          "aiFeedbackGenerated",
                          "AI feedback generated successfully!",
                        ),
                        "success",
                      );
                      console.log("AI Feedback:", feedback);
                    }
                  }}
                  language={currentLang} // ✅ Pass the selected language
                />

                {/* ✅ Enhanced AI Performance Insights - Responsive Cards */}
                {sortedMembers.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "14px",
                      }}
                    >
                      {/* AI Performance Summary Card */}
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          border: "1px solid #E2E8F0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <FiTrendingUp size={18} color={C.primary} />
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: C.dark,
                            }}
                          >
                            {teKey(
                              "performanceDistribution",
                              "Performance Distribution",
                            )}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          {sortedMembers.slice(0, 6).map((m, idx) => {
                            const level = getPerformanceLevel(m.total);
                            return (
                              <div
                                key={idx}
                                style={{
                                  flex: "1 1 40px",
                                  minWidth: "32px",
                                  maxWidth: "60px",
                                  textAlign: "center",
                                  background: idx === 0 ? "#F0FDF4" : "#F8FAFC",
                                  borderRadius: "6px",
                                  padding: "4px 2px",
                                  border:
                                    idx === 0
                                      ? `2px solid ${level.color}`
                                      : "1px solid #E2E8F0",
                                  position: "relative",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    color: idx === 0 ? "#15803D" : "#1E293B",
                                  }}
                                >
                                  {m.total}
                                </div>
                                <div
                                  style={{
                                    fontSize: "7px",
                                    color: C.muted,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {m.name.substring(0, 4)}
                                </div>
                                {idx === 0 && (
                                  <div
                                    style={{
                                      fontSize: "6px",
                                      color: "#15803D",
                                      fontWeight: 700,
                                      marginTop: 1,
                                    }}
                                  >
                                    ★
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {sortedMembers.length > 6 && (
                            <div
                              style={{
                                minWidth: "32px",
                                textAlign: "center",
                                padding: "4px 2px",
                                background: "#F1F5F9",
                                borderRadius: "6px",
                                fontSize: "9px",
                                color: C.muted,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              +{sortedMembers.length - 6}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "8px",
                            fontSize: "9px",
                            color: C.muted,
                            borderTop: "1px solid #E2E8F0",
                            paddingTop: "6px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>
                            {teKey("range", "Range")}: {lowestScore} -{" "}
                            {highestScore}
                          </span>
                          <span>
                            {teKey("gap", "Gap")}: {highestScore - lowestScore}{" "}
                            {teKey("points", "pts")}
                          </span>
                          <span>
                            {tcKey("avg", "Avg")}: {averageScore}
                          </span>
                        </div>
                      </div>

                      {/* AI Recommendations Card */}
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          border: "1px solid #E2E8F0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <FiTarget size={18} color={C.primary} />
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: C.dark,
                            }}
                          >
                            {teKey("aiRecommendations", "AI Recommendations")}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#1E293B",
                            lineHeight: 1.6,
                          }}
                        >
                          <ul style={{ margin: 0, paddingLeft: "16px" }}>
                            {averageScore < 70 && (
                              <li>
                                <strong>
                                  {teKey("trainingNeeded", "Training needed")}:
                                </strong>{" "}
                                {teKey(
                                  "trainingNeededDesc",
                                  "Average score below 70. Consider additional training sessions.",
                                )}
                              </li>
                            )}
                            {highestScore - lowestScore > 30 && (
                              <li>
                                <strong>
                                  {teKey("performanceGap", "Performance gap")}:
                                </strong>{" "}
                                {highestScore - lowestScore}
                                {teKey(
                                  "pointGap",
                                  "pt gap detected. Consider mentorship program.",
                                )}
                              </li>
                            )}
                            {sortedMembers.length > 5 && (
                              <li>
                                <strong>
                                  {teKey(
                                    "teamOptimization",
                                    "Team optimization",
                                  )}
                                  :
                                </strong>{" "}
                                {teKey(
                                  "teamOptimizationDesc",
                                  "Large team ({count}). Consider sub-teams.",
                                ).replace("{count}", sortedMembers.length)}
                              </li>
                            )}
                            {averageScore >= 80 && (
                              <li>
                                <strong>
                                  {teKey(
                                    "excellentPerformance",
                                    "Excellent performance",
                                  )}
                                  :
                                </strong>{" "}
                                {teKey(
                                  "excellentPerformanceDesc",
                                  "Avg ({avg}) high. Consider recognition program.",
                                ).replace("{avg}", averageScore)}
                              </li>
                            )}
                            <li>
                              <strong>
                                {teKey("reviewCriteria", "Review criteria")}:
                              </strong>{" "}
                              {teKey(
                                "reviewCriteriaDesc",
                                "Ensure consistent application across all members.",
                              )}
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* AI Performance Insights Card */}
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: "10px",
                          padding: "14px 16px",
                          border: "1px solid #E2E8F0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "10px",
                          }}
                        >
                          <FiInfo size={18} color={C.primary} />
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: C.dark,
                            }}
                          >
                            {teKey("keyInsights", "Key Insights")}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#1E293B",
                            lineHeight: 1.6,
                          }}
                        >
                          <div
                            style={{
                              marginBottom: "4px",
                              wordBreak: "break-word",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {teKey("topPerformer", "Top Performer")}:
                            </span>{" "}
                            {bestPerformer} ({highestScore}{" "}
                            {teKey("points", "pts")})
                          </div>
                          <div
                            style={{
                              marginBottom: "4px",
                              wordBreak: "break-word",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {teKey("areaForGrowth", "Area for Growth")}:
                            </span>{" "}
                            {lowestScore > 60
                              ? teKey(
                                  "maintainPerformance",
                                  "Maintain current performance levels",
                                )
                              : teKey(
                                  "significantImprovement",
                                  "Significant improvement needed",
                                )}
                          </div>
                          <div
                            style={{
                              marginBottom: "4px",
                              wordBreak: "break-word",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {teKey("teamStrength", "Team Strength")}:
                            </span>{" "}
                            {averageScore >= 75
                              ? teKey(
                                  "strongCollective",
                                  "Strong collective performance",
                                )
                              : teKey(
                                  "opportunityTeamBuilding",
                                  "Opportunity for team building",
                                )}
                          </div>
                          <div style={{ wordBreak: "break-word" }}>
                            <span style={{ fontWeight: 600 }}>
                              {teKey("recommendation", "Recommendation")}:
                            </span>{" "}
                            {averageScore >= 80
                              ? teKey(
                                  "sustainExcellence",
                                  "Focus on sustaining excellence and innovation",
                                )
                              : teKey(
                                  "implementDevelopment",
                                  "Implement targeted development programs",
                                )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Action Buttons ─── */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "clamp(8px, 2vw, 12px)",
              justifyContent: "center",
              marginTop: "clamp(20px, 5vw, 28px)",
              flexWrap: "nowrap",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {canEvaluate && (
              <button
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  padding: "clamp(8px, 2.5vw, 11px) clamp(16px, 5vw, 26px)",
                  borderRadius: 8,
                  fontSize: "clamp(12px, 3.5vw, 14px)",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: "1 1 auto",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
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
                    <span className="save-text">
                      {tcKey("saving", "Saving...")}
                    </span>
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    <span className="save-text">
                      {teKey("save", "Save Evaluation")}
                    </span>
                  </>
                )}
                <style>{`
                  @media (max-width: 480px) {
                    .save-text {
                      display: none !important;
                    }
                  }
                `}</style>
              </button>
            )}

            {/* Export button */}
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
                flex: "1 1 auto",
                justifyContent: "center",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onClick={() => {
                const bestPerformerName =
                  sortedMembers.length > 0 ? sortedMembers[0].name : null;

                // ✅ Build comments object from totals (which already has the comments)
                const commentsByName = {};
                totals.forEach((m) => {
                  if (m.name && m.name.trim()) {
                    commentsByName[m.name] = m.comment || "";
                  }
                });

                console.log(
                  "📝 commentsByName built from totals:",
                  commentsByName,
                );

                exportEvaluationReportToPDF(
                  scores,
                  members.filter((m) => m.trim() !== ""),
                  (m) => total(m),
                  bestPerformerName,
                  safeT,
                  commentsByName,
                  signatures,
                  includeAINarrative,
                  aiNarrativeContent,
                  user?.name || "Administrator",
                  safeT?.evaluation?.branchName || "አዲስ ከተማ ቅርንጫፍ",
                );
              }}
            >
              <FiDownload size={16} />
              <span className="export-text">
                {teKey("export", "Export PDF")}
              </span>
            </button>

            <button
              style={{
                ...btn.secondary,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: "1 1 auto",
                justifyContent: "center",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onClick={resetForm}
            >
              <FiRefreshCw size={16} />
              <span className="reset-text">{teKey("reset", "Reset")}</span>
              <style>{`
                @media (max-width: 480px) {
                  .reset-text {
                    display: none !important;
                  }
                }
              `}</style>
            </button>
          </div>

          {/* AI Evaluation Narrative - with toggle */}
          {evaluationId && (
            <div style={{ marginTop: "clamp(16px, 4vw, 24px)" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <FiZap size={18} color={C.primary} />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "clamp(13px, 3vw, 15px)",
                      color: C.dark,
                    }}
                  >
                    {teKey("aiNarrative", "AI Evaluation Narrative")}
                  </span>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: C.muted,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeAINarrative}
                    onChange={(e) => setIncludeAINarrative(e.target.checked)}
                    style={{ cursor: "pointer" }}
                  />
                  {teKey("includeInReport", "Include in report")}
                </label>
              </div>

              {includeAINarrative && (
                <AISummary
                  fetchFn={async (id) => {
                    // ✅ Pass the current language to the AI API
                    return aiAPI.getEvaluationSummary({
                      evaluationId: id,
                      language: currentLang,
                    });
                  }}
                  args={[evaluationId]}
                  label={teKey("aiNarrative", "AI Evaluation Narrative")}
                  formatResult={formatAINarrative}
                  onContentGenerated={(content) =>
                    setAiNarrativeContent(content)
                  }
                />
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Signature Modal */}
      <SignatureModal
        isOpen={signatureModal.isOpen}
        onClose={() =>
          setSignatureModal({ isOpen: false, memberName: "", onConfirm: null })
        }
        onConfirm={signatureModal.onConfirm}
        title={teKey("signatureFor", "Signature for")}
        subtitle={signatureModal.memberName}
        initialSignature={
          signatureModal.memberName === "teamLeader"
            ? signatures.teamLeader
            : signatures[signatureModal.memberName] || null
        }
        required={false} // Allow signing without a signature (optional)
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Role router: Employees are evaluated, not evaluators — they get a
// read-only feed (view + react + comment). Team Leader/Admin/Super Admin
// get the full scoring form above, unchanged.
// ════════════════════════════════════════════════════════════
export default function Evaluation({ t, lang }) {
  const { user } = useAuth();
  if (user?.role === "employee") {
    return <EvaluationFeed t={t} lang={lang} />;
  }
  return <EvaluationForm t={t} lang={lang} />;
}
