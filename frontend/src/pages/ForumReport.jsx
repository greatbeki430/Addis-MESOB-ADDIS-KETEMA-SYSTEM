/* eslint-disable react-hooks/set-state-in-effect */
// frontend/src/pages/ForumReport.jsx
// Enhanced Professional Forum Report Page with AI Integration - FIXED

import { useState, useRef, useEffect } from "react";
import {
  btn,
  C,
  F,
  card,
  inp,
  shadows,
  radius,
  text,
  SPACING,
} from "../styles/theme";
import Field from "../components/ui/Field";
import Section from "../components/ui/Section";
import { exportForumReportToPDF } from "../utils/pdfExport";
import { meetingAPI } from "../services/api";
import { aiAPI } from "../services/api";
import { teamAPI } from "../services/api";
import { AISummary, AIReportAssistant } from "../components/ai";
import { useToast } from "../hooks/useToast";

// ✅ React Icons
import {
  FiPlus,
  FiX,
  FiUsers,
  FiUserX,
  FiCalendar,
  FiFileText,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
  FiEdit3,
  FiPenTool,
  FiDownload,
  FiSave,
  FiLoader,
  FiChevronDown,
  FiChevronRight,
  FiCheck,
  FiInfo,
  FiUserCheck as FiUserCheckIcon,
  FiZap,
  FiTrendingUp,
  FiChevronLeft,
} from "react-icons/fi";

// ─── FONT SIZES ──────────────────────────────────────────────
const FONT_SIZES = {
  h1: "clamp(22px, 5vw, 28px)",
  h2: "clamp(18px, 4vw, 24px)",
  h3: "clamp(16px, 3.5vw, 20px)",
  body: "clamp(12px, 3vw, 14px)",
  small: "clamp(10px, 2.5vw, 12px)",
};

// ─── Team Selector Component ─────────────────────────────────
const TeamSelector = ({ teams, selectedTeam, setSelectedTeam, t, loading }) => {
  const tf = t?.forum || {};
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "clamp(20px, 4vw, 40px)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "clamp(24px, 5vw, 32px)",
        }}
      >
        <div
          style={{
            width: "clamp(60px, 12vw, 80px)",
            height: "clamp(60px, 12vw, 80px)",
            background: `linear-gradient(135deg, ${C.primary}15, ${C.primary}08)`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "clamp(32px, 8vw, 40px)",
          }}
        >
          <FiMessageSquare size={40} color={C.primary} />
        </div>
        <h2
          style={{
            fontSize: FONT_SIZES.h1,
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.serif,
            marginBottom: 8,
          }}
        >
          {tf.selectTeamPrompt || "Select a Team"}
        </h2>
        <p
          style={{
            fontSize: FONT_SIZES.body,
            color: C.muted,
            fontFamily: F.sans,
          }}
        >
          {tf.selectTeamHelper ||
            "Choose a team from the list below to start or view their forum report"}
        </p>
      </div>

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input
          type="text"
          placeholder={tf.searchTeams || "Search teams..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: `1.5px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
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

      {/* Teams Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
          <FiLoader
            size={24}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p>{tf.loadingTeams || "Loading teams..."}</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: C.muted,
            background: C.bg,
            borderRadius: 12,
          }}
        >
          <FiUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p>{tf.noTeamsFound || "No teams found"}</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {filteredTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              style={{
                padding: "clamp(14px, 2vw, 18px)",
                background: C.white,
                borderRadius: 12,
                border: `2px solid ${selectedTeam?.id === team.id ? C.primary : C.border}44`,
                cursor: "pointer",
                transition: "all 0.3s ease",
                textAlign: "left",
                boxShadow:
                  selectedTeam?.id === team.id
                    ? `0 4px 20px ${C.primary}22`
                    : "0 2px 8px rgba(0,0,0,0.04)",
                transform:
                  selectedTeam?.id === team.id ? "scale(1.02)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (selectedTeam?.id !== team.id) {
                  e.currentTarget.style.borderColor = C.primary + "66";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTeam?.id !== team.id) {
                  e.currentTarget.style.borderColor = C.border + "44";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.04)";
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                    background: `linear-gradient(135deg, ${C.primary}15, ${C.primary}08)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FiUsers size={18} color={C.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: C.dark,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {team.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {team.department || tf.noDepartment || "No department"}
                  </div>
                </div>
                {selectedTeam?.id === team.id && (
                  <div
                    style={{
                      background: C.primary,
                      color: "#fff",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FiCheck size={14} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Enhanced Dynamic Field Group ────────────────────────────
// ✅ FIXED: "Add Another" button now matches parent width
const DynamicFieldGroup = ({
  title,
  values,
  onAdd,
  onRemove,
  onUpdate,
  renderField,
  labelPrefix = "",
  placeholderPrefix = "",
  icon,
  maxItems = 20,
  helperText = "",
}) => {
  const handleAdd = () => {
    if (values.length < maxItems) {
      onAdd();
    }
  };

  return (
    <Section title={title} icon={icon}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {values.map((value, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 12px",
              background: C.cardBg,
              borderRadius: radius.md,
              border: `1px solid ${C.border}`,
              transition: "all 0.2s ease",
              animation: `fadeInUp ${0.2 + idx * 0.05}s ease`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.background = "#f0f3ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.background = C.cardBg;
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderField ? (
                renderField(value, idx)
              ) : (
                <Field
                  label={`${labelPrefix} ${idx + 1}`}
                  value={value}
                  onChange={(v) => onUpdate(idx, v)}
                  placeholder={`${placeholderPrefix} ${idx + 1}`}
                />
              )}
            </div>

            {values.length > 1 && (
              <button
                onClick={() => onRemove(idx)}
                aria-label="Remove item"
                style={{
                  ...btn.icon,
                  color: "#dc2626",
                  background: "#fee2e2",
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fecaca";
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ✅ "Add Another" button - full width */}
      {values.length < maxItems && (
        <button
          onClick={handleAdd}
          style={{
            ...btn.secondary,
            padding: "6px 14px",
            fontSize: "12px",
            marginTop: "8px",
            width: "100%", // ✅ Full width
            justifyContent: "center",
          }}
        >
          <FiPlus size={14} />
          Add {values.length === 0 ? "First" : "Another"}
        </button>
      )}

      {helperText && (
        <p style={{ ...text.muted, fontSize: "11px", marginTop: "4px" }}>
          <FiInfo size={12} style={{ marginRight: "4px" }} />
          {helperText}
        </p>
      )}
    </Section>
  );
};

// ─── Standing Agendas Panel ──────────────────────────────────
const STANDING_AGENDAS_AM = [
  "በተቋሙ መልካም አስተዳደር ማስፈን በተመለከተ",
  "በተቋሙ ብልሹ አሰራር ከመታገል አንጻር",
  "መደበኛ አገልግሎት አሰጣጥን ከማሳለጥ አንጻር",
  "QMS ስታንዳርድ በመስራት",
  "ሳምንታዊ አብነታዊ ስራዎች",
  "ያጋጠሙ ችግሮች",
  "የተፈታበት አግባብ",
];

const StandingAgendasPanel = ({ t }) => {
  const safeT = t || {};
  const agendas = safeT.agendas || STANDING_AGENDAS_AM;
  const tf = safeT.forum || {};
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${C.primary}`,
        borderRadius: radius.lg,
        marginBottom: SPACING.lg,
        overflow: "hidden",
        boxShadow: shadows.sm,
      }}
    >
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(26,58,173,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FiBookOpen size={18} color={C.primary} />
          <span
            style={{
              fontWeight: 700,
              fontSize: FONT_SIZES.h3,
              color: C.dark,
              fontFamily: F.sans,
            }}
          >
            {tf.standingAgendas || "ቋሚ የአቻ ፎረም አጀንዳዎች"}
          </span>
          <span
            style={{
              background: C.primary,
              color: "#fff",
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: radius.pill,
            }}
          >
            {agendas.length}
          </span>
        </div>
        <span style={{ color: C.primary, fontSize: "14px" }}>
          {collapsed ? (
            <FiChevronRight size={16} />
          ) : (
            <FiChevronDown size={16} />
          )}
        </span>
      </div>
      {!collapsed && (
        <div style={{ padding: "4px 18px 14px" }}>
          {agendas.map((agenda, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "6px 0",
                borderBottom:
                  i < agendas.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <span
                style={{
                  minWidth: "24px",
                  height: "24px",
                  background: C.primary,
                  color: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: FONT_SIZES.body,
                  color: C.dark,
                  fontFamily: F.sans,
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {agenda}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── AI Insight Badge ─────────────────────────────────────────
const AIInsightBadge = ({ type = "info", children }) => {
  const styles = {
    info: {
      background: "#EFF6FF",
      border: "1px solid #BFDBFE",
      color: "#1D4ED8",
      icon: <FiInfo size={14} />,
    },
    success: {
      background: "#F0FDF4",
      border: "1px solid #86EFAC",
      color: "#15803D",
      icon: <FiCheckCircle size={14} />,
    },
    warning: {
      background: "#FFFBEB",
      border: "1px solid #FDE68A",
      color: "#92400E",
      icon: <FiAlertCircle size={14} />,
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "10px 14px",
        borderRadius: radius.md,
        background: style.background,
        border: style.border,
        color: style.color,
        fontSize: FONT_SIZES.body,
        marginBottom: SPACING.md,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: "2px" }}>{style.icon}</span>
      <div>{children}</div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
export default function ForumReport({
  t,
  lang,
  selectedTeam,
  setSelectedTeam,
  onReportSaved,
}) {
  const safeT = t || {};
  const tf = safeT.forum || {};
  const common = safeT.common || {};
  const safeYear = safeT.year || "2018 E.C.";

  const { showToast } = useToast();
  const formRef = useRef(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    timeStart: "",
    timeEnd: "",
    present: [""],
    absent: [{ name: "", reason: "" }],
    prevResults: [""],
    topics: [""],
    explanation: "",
    gaps: [""],
    agreements: [""],
    signatures: [""],
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formProgress, setFormProgress] = useState(0);
  const [aiGeneratedContent, setAiGeneratedContent] = useState(null);

  // ✅ State for team selector on page
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // ─── Load teams when no team is selected ──────────────────
  useEffect(() => {
    if (!selectedTeam) {
      const loadTeams = async () => {
        try {
          setLoadingTeams(true);
          const response = await teamAPI.getAll();
          if (response.data && Array.isArray(response.data)) {
            const formattedTeams = response.data.map((team) => ({
              id: team._id,
              name: team.name,
              description: team.department || "",
              leader: team.leader?.name || "Not assigned",
              members: team.members || [],
              department: team.department,
            }));
            setTeams(formattedTeams);
          }
        } catch (error) {
          console.error("Failed to load teams:", error);
        } finally {
          setLoadingTeams(false);
        }
      };
      loadTeams();
    }
  }, [selectedTeam]);

  // ─── Calculate form progress ───────────────────────────────
  useEffect(() => {
    const totalFields = 9;
    let filled = 0;
    if (form.date) filled++;
    if (form.present.some((p) => p.trim())) filled++;
    if (form.topics.some((t) => t.trim())) filled++;
    if (form.explanation.trim()) filled++;
    if (form.gaps.some((g) => g.trim())) filled++;
    if (form.agreements.some((a) => a.trim())) filled++;
    if (form.prevResults.some((p) => p.trim())) filled++;
    if (form.signatures.some((s) => s.trim())) filled++;
    if (form.timeStart || form.timeEnd) filled++;
    setFormProgress(Math.round((filled / totalFields) * 100));
  }, [form]);

  const upd = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const addItem = (field, defaultValue = "") => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], defaultValue] }));
  };

  const removeItem = (field, index) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const addAbsent = () => {
    setForm((prev) => ({
      ...prev,
      absent: [...prev.absent, { name: "", reason: "" }],
    }));
  };

  const removeAbsent = (index) => {
    setForm((prev) => ({
      ...prev,
      absent: prev.absent.filter((_, i) => i !== index),
    }));
  };

  const updateAbsent = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.absent];
      updated[index][field] = value;
      return { ...prev, absent: updated };
    });
  };

  // ─── Enhanced AI Apply Handler ─────────────────────────────
  const handleApplySuggestion = (text) => {
    if (!text || text.trim() === "") {
      showToast("⚠️ No content to apply", "warning");
      return;
    }

    setForm((prev) => ({
      ...prev,
      explanation: prev.explanation
        ? `${prev.explanation}\n\n---\n🤖 AI Generated:\n${text}`
        : `🤖 AI Generated:\n${text}`,
    }));

    setAiGeneratedContent(text);
    showToast("✅ AI suggestion applied to explanation!", "success");
  };

  // ─── Handle AI Summary Generation ──────────────────────────
  const handleGenerateSummary = async () => {
    try {
      const context = {
        title: `${tf.title || "Peer Forum Report"} - ${selectedTeam?.name || ""}`,
        date: form.date,
        attendees: form.present.filter((p) => p.trim() !== ""),
        topics: form.topics.filter((t) => t.trim()),
        explanation: form.explanation || "",
        gaps: form.gaps.filter((g) => g.trim()),
        agreements: form.agreements.filter((a) => a.trim()),
      };

      const response = await aiAPI.getMeetingMinutes({
        title: context.title,
        date: context.date,
        attendees: context.attendees,
        agenda: context.topics.join("; "),
        notes: [
          `Topics: ${context.topics.join("; ")}`,
          `Explanation: ${context.explanation}`,
          `Gaps: ${context.gaps.join("; ")}`,
          `Agreements: ${context.agreements.join("; ")}`,
        ].join("\n"),
      });

      const content = response.data?.minutes || response.data?.insight || "";
      if (content) {
        handleApplySuggestion(content);
        showToast("✅ AI summary generated and applied!", "success");
      } else {
        showToast("⚠️ No content generated. Please try again.", "warning");
      }
    } catch (error) {
      console.error("Failed to generate summary:", error);
      showToast("❌ Failed to generate AI summary", "error");
    }
  };

  // ─── Handle Full Report Generation ──────────────────────────
  const handleGenerateFullReport = async () => {
    try {
      const context = {
        title: `${tf.title || "Peer Forum Report"} - ${selectedTeam?.name || ""}`,
        date: form.date,
        attendees: form.present.filter((p) => p.trim() !== ""),
        topics: form.topics.filter((t) => t.trim()),
        explanation: form.explanation || "",
        gaps: form.gaps.filter((g) => g.trim()),
        agreements: form.agreements.filter((a) => a.trim()),
      };

      const response = await aiAPI.getMeetingMinutes({
        title: context.title,
        date: context.date,
        attendees: context.attendees,
        agenda: context.topics.join("; "),
        notes: [
          `Topics: ${context.topics.join("; ")}`,
          `Explanation: ${context.explanation}`,
          `Gaps: ${context.gaps.join("; ")}`,
          `Agreements: ${context.agreements.join("; ")}`,
        ].join("\n"),
      });

      let content = response.data?.minutes || response.data?.insight || "";

      const fullReport = `
📋 PEER FORUM MEETING REPORT
${"=".repeat(50)}

📅 Date: ${form.date}
👥 Attendees: ${context.attendees.join(", ") || "Not specified"}

📌 TOPICS DISCUSSED:
${context.topics.map((t, i) => `${i + 1}. ${t}`).join("\n") || "No topics listed"}

💬 DISCUSSION SUMMARY:
${content || "No summary available"}

⚠️ GAPS IDENTIFIED:
${context.gaps.map((g, i) => `${i + 1}. ${g}`).join("\n") || "No gaps identified"}

✅ AGREEMENTS REACHED:
${context.agreements.map((a, i) => `${i + 1}. ${a}`).join("\n") || "No agreements"}

📝 FULL MINUTES:
${content || "No content"}

${"=".repeat(50)}
Generated by AI Assistant • ${new Date().toLocaleString()}
      `;

      handleApplySuggestion(fullReport);
      showToast("✅ Full report generated and applied!", "success");
    } catch (error) {
      console.error("Failed to generate full report:", error);
      showToast("❌ Failed to generate full report", "error");
    }
  };

  // ─── Handle Export ──────────────────────────────────────────
  const handleExport = () => {
    try {
      exportForumReportToPDF(form, t, lang, selectedTeam?.name);
      showToast("✅ Report exported successfully!", "success");
    } catch (error) {
      console.error("Failed to export report:", error);
      showToast("❌ Failed to export report", "error");
    }
  };

  const handleSaveReport = async () => {
    try {
      setSaving(true);

      if (!form.date) {
        showToast(common.selectDate || "Please select a date", "warning");
        setSaving(false);
        return;
      }

      const reportData = {
        date: form.date,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        present: form.present.filter((p) => p.trim() !== ""),
        absent: form.absent.filter((a) => a.name.trim() !== ""),
        prevResults: form.prevResults.filter((p) => p.trim() !== ""),
        topics: form.topics.filter((t) => t.trim() !== ""),
        explanation: form.explanation || "",
        gaps: form.gaps.filter((g) => g.trim() !== ""),
        agreements: form.agreements.filter((a) => a.trim() !== ""),
        signatures: form.signatures.filter((s) => s.trim() !== ""),
        teamId: selectedTeam?.id || selectedTeam?._id,
        teamName: selectedTeam?.name || "Unknown Team",
        aiGeneratedContent: aiGeneratedContent,
      };

      await meetingAPI.create(reportData);

      if (onReportSaved) {
        onReportSaved(selectedTeam.id, form);
      }
      setSubmitted(true);
      showToast("✅ Report saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save report:", error);
      showToast(
        error.response?.data?.message ||
          common.failedSave ||
          "Failed to save report. Please try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const g3Responsive = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: "clamp(12px, 3vw, 16px)",
  };

  // ─── Submitted State ──────────────────────────────────────
  if (submitted) {
    return (
      <div
        style={{ maxWidth: "600px", margin: "60px auto", padding: "0 20px" }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)",
            background: C.white,
            borderRadius: radius.xl,
            boxShadow: shadows.xl,
            border: `1px solid ${C.border}`,
            animation: "fadeInUp 0.5s ease",
          }}
        >
          <div
            style={{
              width: "clamp(60px, 15vw, 80px)",
              height: "clamp(60px, 15vw, 80px)",
              background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "clamp(32px, 8vw, 40px)",
              color: "#fff",
              margin: "0 auto 18px",
              boxShadow: shadows.glow,
            }}
          >
            <FiCheck size={40} />
          </div>
          <h2
            style={{
              fontSize: FONT_SIZES.h1,
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.serif,
              marginBottom: 8,
            }}
          >
            {tf.saved || "Report Saved!"}
          </h2>
          <p
            style={{
              color: C.muted,
              marginBottom: 24,
              fontFamily: F.sans,
              fontSize: FONT_SIZES.body,
            }}
          >
            {tf.savedSub || "Peer Forum report completed successfully."}
          </p>

          {aiGeneratedContent && (
            <div
              style={{
                background: "#EFF6FF",
                borderRadius: radius.md,
                padding: "12px 16px",
                marginBottom: "16px",
                textAlign: "left",
                border: "1px solid #BFDBFE",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <FiZap size={16} color="#1D4ED8" />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1D4ED8",
                  }}
                >
                  AI Generated Content Applied
                </span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#1E293B",
                  margin: 0,
                  maxHeight: "100px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {aiGeneratedContent.substring(0, 200)}...
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button style={btn.primary} onClick={() => setSubmitted(false)}>
              <FiPlus size={18} />
              {tf.newReport || "New Report"}
            </button>
          </div>

          <div style={{ marginTop: "24px", textAlign: "left" }}>
            <AISummary
              fetchFn={() =>
                aiAPI.getMeetingMinutes({
                  title: `${tf.title || "Peer Forum Report"} - ${selectedTeam?.name || ""}`,
                  date: form.date,
                  attendees: form.present.filter((p) => p.trim() !== ""),
                  agenda: STANDING_AGENDAS_AM.join("; "),
                  notes: [
                    `Topics: ${form.topics.filter((x) => x.trim()).join("; ")}`,
                    `Explanation: ${form.explanation}`,
                    `Gaps: ${form.gaps.filter((x) => x.trim()).join("; ")}`,
                    `Agreements: ${form.agreements.filter((x) => x.trim()).join("; ")}`,
                  ].join("\n"),
                })
              }
              args={[]}
              label="AI Meeting Minutes"
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── No Team Selected ──────────────────────────────────────
  if (!selectedTeam) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <TeamSelector
          teams={teams}
          selectedTeam={selectedTeam}
          setSelectedTeam={setSelectedTeam}
          t={safeT}
          loading={loadingTeams}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ─── Main Form ─────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
        animation: "fadeInUp 0.5s ease",
      }}
      ref={formRef}
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
          marginBottom: "clamp(20px, 4vw, 28px)",
          paddingBottom: "clamp(12px, 3vw, 16px)",
          borderBottom: `2px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
              borderRadius: radius.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "22px",
              boxShadow: shadows.glow,
            }}
          >
            <FiMessageSquare size={24} />
          </div>
          <div>
            <h1
              style={{
                fontSize: FONT_SIZES.h1,
                fontWeight: 800,
                color: C.dark,
                fontFamily: F.serif,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {tf.title || "Peer Forum Report"}
              <span style={{ color: C.primary, fontSize: FONT_SIZES.h2 }}>
                {" "}
                — {selectedTeam.name}
              </span>
            </h1>
            <p
              style={{
                fontSize: FONT_SIZES.body,
                color: C.muted,
                margin: "2px 0 0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiCalendar size={14} />
              {tf.subtitle ||
                "Addis Ababa City Admin · Addis Messob · Addis Ketema Center"}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setSelectedTeam(null)}
            style={{
              ...btn.secondary,
              padding: "6px 14px",
              fontSize: "12px",
            }}
          >
            <FiChevronLeft size={14} />
            {tf.changeTeam || "Change Team"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: C.bg,
              padding: "4px 12px",
              borderRadius: radius.pill,
            }}
          >
            <span style={{ fontSize: "11px", color: C.muted, fontWeight: 600 }}>
              {formProgress}%
            </span>
            <div
              style={{
                width: "80px",
                height: "4px",
                background: C.border,
                borderRadius: radius.pill,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${formProgress}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`,
                  borderRadius: radius.pill,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
          <div
            style={{
              background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
              color: "#fff",
              padding: "6px 16px",
              borderRadius: radius.pill,
              fontSize: FONT_SIZES.small,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: shadows.glow,
            }}
          >
            <FiCalendar size={14} />
            {safeYear}
          </div>
        </div>
      </div>

      <AIInsightBadge type="info">
        <strong>Progress: {formProgress}% complete</strong>
        <span style={{ marginLeft: "8px", fontSize: "12px" }}>
          {formProgress < 30 && "Start filling in the report details below"}
          {formProgress >= 30 &&
            formProgress < 70 &&
            "You're making good progress! Keep going."}
          {formProgress >= 70 && "Almost there! Review and save your report."}
        </span>
      </AIInsightBadge>

      <StandingAgendasPanel t={safeT} />

      {/* Main Form Card */}
      <div
        style={{
          ...card,
          padding: "clamp(20px, 4vw, 32px)",
          background: C.white,
          borderRadius: radius.xl,
          boxShadow: shadows.md,
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Meeting Time */}
        <Section
          title={tf.meetingTime || "Meeting Time"}
          icon={<FiCalendar size={18} />}
        >
          <div style={g3Responsive}>
            <Field
              label={tf.date || "Date"}
              value={form.date}
              onChange={(v) => upd("date", v)}
              type="date"
            />
            <Field
              label={tf.startTime || "Start Time"}
              value={form.timeStart}
              onChange={(v) => upd("timeStart", v)}
              type="time"
            />
            <Field
              label={tf.endTime || "End Time"}
              value={form.timeEnd}
              onChange={(v) => upd("timeEnd", v)}
              type="time"
            />
          </div>
        </Section>

        {/* Present Members */}
        <DynamicFieldGroup
          title={tf.presentMembers || "Present Members"}
          icon={<FiUserCheckIcon size={18} />}
          values={form.present}
          onAdd={() => addItem("present", "")}
          onRemove={(idx) => removeItem("present", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.present];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, present: updated }));
          }}
          renderField={(value, idx) => (
            <Field
              label={`${idx + 1}${tf.memberN || " Member"}`}
              value={value}
              onChange={(v) => {
                const updated = [...form.present];
                updated[idx] = v;
                setForm((prev) => ({ ...prev, present: updated }));
              }}
              placeholder={`${tf.memberPlaceholder || "Member"} ${idx + 1}`}
            />
          )}
          helperText={
            tf.presentHelper ||
            "Add all team members who attended the forum meeting"
          }
        />

        {/* Absent Members */}
        <Section
          title={tf.absentMembers || "Absent Members & Reasons"}
          icon={<FiUserX size={18} />}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {form.absent.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: "14px 16px",
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: radius.lg,
                  transition: "all 0.2s ease",
                  animation: `fadeInUp ${0.2 + idx * 0.05}s ease`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.primary;
                  e.currentTarget.style.background = "#f0f3ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.cardBg;
                }}
              >
                <div
                  style={{
                    fontSize: FONT_SIZES.small,
                    fontWeight: 600,
                    color: C.muted,
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FiUserX size={14} />
                  {tf.absentMemberLabel || "Absent Member"} #{idx + 1}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <Field
                    label={tf.name || "Name"}
                    value={item.name}
                    onChange={(v) => updateAbsent(idx, "name", v)}
                    placeholder={tf.namePlaceholder || "Member name"}
                  />
                  <Field
                    label={tf.reason || "Reason"}
                    value={item.reason}
                    onChange={(v) => updateAbsent(idx, "reason", v)}
                    placeholder={tf.reasonPlaceholder || "Reason for absence"}
                  />
                </div>
                {form.absent.length > 1 && (
                  <button
                    onClick={() => removeAbsent(idx)}
                    style={{
                      ...btn.icon,
                      marginTop: "8px",
                      color: "#dc2626",
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: radius.md,
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <FiX size={14} />
                    {common.remove || "Remove"}
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addAbsent}
            style={{
              ...btn.secondary,
              padding: "6px 14px",
              fontSize: "12px",
              marginTop: "8px",
            }}
          >
            <FiPlus size={14} />
            {tf.addAbsent || "Add Absent Member"}
          </button>
        </Section>

        {/* Previous Results */}
        <DynamicFieldGroup
          title={tf.prevResults || "Results from Previous Meeting"}
          icon={<FiFileText size={18} />}
          values={form.prevResults}
          onAdd={() => addItem("prevResults", "")}
          onRemove={(idx) => removeItem("prevResults", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.prevResults];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, prevResults: updated }));
          }}
          labelPrefix={tf.resultLabel || "Result"}
          placeholderPrefix={tf.prevResultPlaceholder || "Previous result"}
          helperText={
            tf.prevResultHelper ||
            "List outcomes and action items from the previous meeting"
          }
        />

        {/* Today's Topics */}
        <DynamicFieldGroup
          title={tf.todayTopics || "Today's Discussion Topics"}
          icon={<FiMessageSquare size={18} />}
          values={form.topics}
          onAdd={() => addItem("topics", "")}
          onRemove={(idx) => removeItem("topics", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.topics];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, topics: updated }));
          }}
          labelPrefix={tf.topic || "Topic"}
          placeholderPrefix={tf.topicPlaceholder || "Discussion topic"}
          helperText={
            tf.topicHelper || "Enter each discussion topic separately"
          }
        />

        {/* Explanation - Enhanced with AI Actions */}
        <Section
          title={tf.explanation || "Explanation Given (Brief)"}
          icon={<FiEdit3 size={18} />}
        >
          <textarea
            style={{
              ...inp,
              resize: "vertical",
              minHeight: "clamp(100px, 20vw, 120px)",
              fontSize: FONT_SIZES.body,
              padding: "12px 14px",
              borderRadius: radius.md,
              border: `1.5px solid ${focusedField === "explanation" ? C.primary : C.border}`,
              boxShadow:
                focusedField === "explanation"
                  ? `0 0 0 3px ${C.primary}22`
                  : "none",
              transition: "all 0.2s ease",
              width: "100%",
              fontFamily: F.sans,
              lineHeight: 1.6,
            }}
            rows={4}
            value={form.explanation}
            onChange={(e) => upd("explanation", e.target.value)}
            onFocus={() => setFocusedField("explanation")}
            onBlur={() => setFocusedField(null)}
            placeholder={tf.explanationPlaceholder || "Write explanation..."}
          />

          {/* ✅ AI Actions Toolbar - Full width buttons */}
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "center",
              padding: "12px 14px",
              background: "#F8FAFC",
              borderRadius: radius.md,
              border: `1px solid ${C.border}`,
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: C.muted,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginRight: "8px",
                flexShrink: 0,
              }}
            >
              <FiZap size={14} color={C.primary} />
              AI Actions:
            </span>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                flex: 1,
                alignItems: "center",
              }}
            >
              <button
                onClick={handleGenerateSummary}
                style={{
                  ...btn.secondary,
                  padding: "6px 12px",
                  fontSize: "11px",
                  background: "#EFF6FF",
                  borderColor: "#BFDBFE",
                  color: "#1D4ED8",
                  flex: "1 1 auto",
                  minWidth: "80px",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <FiZap size={12} />
                {tf.aiWritingAssistant || "AI Writing Assistant"}
              </button>

              <button
                onClick={handleGenerateSummary}
                style={{
                  ...btn.secondary,
                  padding: "6px 12px",
                  fontSize: "11px",
                  background: "#F0FDF4",
                  borderColor: "#86EFAC",
                  color: "#15803D",
                  flex: "1 1 auto",
                  minWidth: "60px",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <FiTrendingUp size={12} />
                {tf.summarize || "Summarize"}
              </button>

              <button
                onClick={handleGenerateFullReport}
                style={{
                  ...btn.secondary,
                  padding: "6px 12px",
                  fontSize: "11px",
                  background: "#FEF3C7",
                  borderColor: "#FDE68A",
                  color: "#92400E",
                  flex: "1 1 auto",
                  minWidth: "60px",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <FiBookOpen size={12} />
                {tf.fullReport || "Full Report"}
              </button>

              <button
                onClick={handleExport}
                style={{
                  ...btn.secondary,
                  padding: "6px 12px",
                  fontSize: "11px",
                  background: "#F3E8FF",
                  borderColor: "#D8B4FE",
                  color: "#6D28D9",
                  flex: "1 1 auto",
                  minWidth: "60px",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <FiDownload size={12} />
                {common.export || "Export"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: "12px" }}>
            <AIReportAssistant
              type="forum"
              reportContext={{
                title: `${tf.title || "Peer Forum Report"} - ${selectedTeam?.name || ""}`,
                date: form.date,
                attendees: form.present.filter((p) => p.trim() !== ""),
                topics: form.topics.filter((t) => t.trim()),
                explanation: form.explanation || "",
                gaps: form.gaps.filter((g) => g.trim()),
                agreements: form.agreements.filter((a) => a.trim()),
              }}
              onApply={handleApplySuggestion}
              onGenerateFullReport={handleGenerateFullReport}
              buttonText={tf.aiWritingAssistant || "AI Writing Assistant"}
            />
          </div>
        </Section>

        {/* Gaps */}
        <DynamicFieldGroup
          title={tf.gaps || "Identified Gaps"}
          icon={<FiAlertCircle size={18} />}
          values={form.gaps}
          onAdd={() => addItem("gaps", "")}
          onRemove={(idx) => removeItem("gaps", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.gaps];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, gaps: updated }));
          }}
          labelPrefix={tf.gapLabel || "Gap"}
          placeholderPrefix={tf.gapPlaceholder || "Identified gap"}
          helperText={
            tf.gapHelper || "Identify gaps or challenges discussed in the forum"
          }
        />

        {/* Agreements */}
        <DynamicFieldGroup
          title={tf.agreements || "Agreed Points"}
          icon={<FiCheckCircle size={18} />}
          values={form.agreements}
          onAdd={() => addItem("agreements", "")}
          onRemove={(idx) => removeItem("agreements", idx)}
          onUpdate={(idx, val) => {
            const updated = [...form.agreements];
            updated[idx] = val;
            setForm((prev) => ({ ...prev, agreements: updated }));
          }}
          labelPrefix={tf.agreementLabel || "Agreement"}
          placeholderPrefix={tf.agreementPlaceholder || "Agreed point"}
          helperText={
            tf.agreementHelper || "Document all points of agreement reached"
          }
        />

        {/* Signatures */}
        <Section
          title={tf.signatures || "Signatures"}
          icon={<FiPenTool size={18} />}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {form.signatures.map((sig, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  background: C.cardBg,
                  borderRadius: radius.md,
                  border: `1px solid ${C.border}`,
                  transition: "all 0.2s ease",
                  animation: `fadeInUp ${0.2 + idx * 0.05}s ease`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{ flex: 1 }}>
                  <Field
                    label={`${idx + 1}${tf.signatureN || " Signature"}`}
                    value={sig}
                    onChange={(v) => {
                      const updated = [...form.signatures];
                      updated[idx] = v;
                      setForm((prev) => ({ ...prev, signatures: updated }));
                    }}
                    placeholder={tf.signaturePlaceholder || "Signature line"}
                  />
                </div>
                {form.signatures.length > 1 && (
                  <button
                    onClick={() => removeItem("signatures", idx)}
                    style={{
                      ...btn.icon,
                      color: "#dc2626",
                      background: "#fee2e2",
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fecaca";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fee2e2";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => addItem("signatures", "")}
            style={{
              ...btn.secondary,
              padding: "6px 14px",
              fontSize: "12px",
              marginTop: "8px",
            }}
          >
            <FiPlus size={14} />
            {tf.addSignature || "Add Signature"}
          </button>
        </Section>

        {/* ✅ Action Buttons - SIDE BY SIDE ON ONE LINE */}
        <div
          style={{
            display: "flex",
            flexDirection: "row", // ✅ Horizontal layout
            gap: "clamp(12px, 3vw, 16px)",
            justifyContent: "center",
            marginTop: "clamp(24px, 5vw, 32px)",
            paddingTop: "clamp(16px, 4vw, 20px)",
            borderTop: `2px solid ${C.border}`,
          }}
        >
          <button
            style={{
              ...btn.danger,
              flex: 1, // ✅ Equal width
              justifyContent: "center",
              padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
              fontSize: FONT_SIZES.body,
              minWidth: 0,
            }}
            onClick={handleExport}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(220,38,38,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FiDownload size={16} />
            {common.exportPDF || "Export PDF"}
          </button>

          <button
            style={{
              ...btn.primary,
              flex: 1, // ✅ Equal width
              justifyContent: "center",
              padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
              fontSize: FONT_SIZES.body,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
            onClick={handleSaveReport}
            disabled={saving}
          >
            {saving ? (
              <>
                <FiLoader
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                {common.saving || "Saving..."}
              </>
            ) : (
              <>
                <FiSave size={16} />
                {tf.save || "Save Report"}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
