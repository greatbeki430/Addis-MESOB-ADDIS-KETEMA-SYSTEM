import { useState } from "react";
import { btn, C, F, inp } from "../styles/theme";
import Field from "../components/ui/Field";
import Section from "../components/ui/Section";
import { exportForumReportToPDF } from "../utils/pdfExport";
import { meetingAPI } from "../services/api";
import { aiAPI } from "../services/api"; // ✅ NEW
import AISummary from "../components/ai/AISummary"; // ✅ NEW
import {
  FiPlus,
  FiX,
  FiUsers,
  // FiUser,
  FiUserX,
  FiCalendar,
  // FiClock,
  FiFileText,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiBookOpen,
  // FiList,
  FiEdit3,
  FiPenTool,
  FiDownload,
  FiSave,
  FiLoader,
  FiChevronDown,
  FiChevronRight,
  FiCheck,
  // FiCircle,
  // FiStar,
  // FiAward,
  // FiInfo,
  // FiHelpCircle,
  // FiSettings,
  // FiTool,
  // FiBarChart2,
  // FiPieChart,
  // FiTrendingUp,
  // FiTrendingDown,
  // FiActivity,
  // FiClipboard,
  // FiFile,
  // FiFolder,
  // FiGrid,
  // FiLayout,
  // FiMenu,
  // FiMoreHorizontal,
  // FiPaperclip,
  // FiPrinter,
  // FiRefreshCw,
  // FiSearch,
  // FiSend,
  // FiShare2,
  // FiSliders,
  // FiTarget,
  // FiThumbsUp,
  FiUserCheck,
  // FiUserMinus,
  // FiUserPlus,
  // FiUsers as FiUsersIcon,
} from "react-icons/fi";

function DynamicFieldGroup({
  title,
  values,
  onAdd,
  onRemove,
  onUpdate,
  renderField,
  labelPrefix = "",
  placeholderPrefix = "",
  icon,
}) {
  return (
    <Section title={title} icon={icon}>
      {values.map((value, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            flexWrap: "wrap",
            animation: `fadeInUp ${0.2 + idx * 0.05}s ease`,
          }}
        >
          <div style={{ flex: 1 }}>
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
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "6px",
                width: "32px",
                height: "32px",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#b91c1c";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#dc2626";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={onAdd}
        style={{
          background: "#10b981",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "6px 14px",
          fontSize: "13px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "8px",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#059669";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(16,185,129,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#10b981";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <FiPlus size={16} />
        Add
      </button>
    </Section>
  );
}

// ════════════════════════════════════════════════════════════
// Standing Agendas Panel
// Shows the 7 fixed forum agenda items from the physical form
// "ቋሚ የአቻ ፎረም አጀንዳዎች" — present on every meeting report
// ════════════════════════════════════════════════════════════
const STANDING_AGENDAS_AM = [
  "በተቋሙ መልካም አስተዳደር ማስፈን በተመለከተ",
  "በተቋሙ ብልሹ አሰራር ከመታገል አንጻር",
  "መደበኛ አገልግሎት አሰጣጥን ከማሳለጥ አንጻር",
  "QMS ስታንዳርድ በመስራት",
  "ሳምንታዊ አብነታዊ ስራዎች",
  "ያጋጠሙ ችግሮች",
  "የተፈታበት አግባብ",
];

function StandingAgendasPanel({ t }) {
  const safeT = t || {};
  const agendas = safeT.agendas || STANDING_AGENDAS_AM;
  const tf = safeT.forum || {};
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f0f3ff, #e8ecf8)",
        border: "1.5px solid #c8d0ef",
        borderLeft: "5px solid #1a3aad",
        borderRadius: 12,
        marginBottom: 20,
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FiBookOpen size={18} color="#1a3aad" />
          <span
            style={{
              fontWeight: 800,
              fontSize: "clamp(12px, 3.5vw, 14px)",
              color: "#0d1a5e",
              fontFamily: "'Noto Sans Ethiopic', sans-serif",
            }}
          >
            {tf.standingAgendas || "ቋሚ የአቻ ፎረም አጀንዳዎች"}
          </span>
          <span
            style={{
              background: "#1a3aad",
              color: "#f5c518",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {agendas.length}
          </span>
        </div>
        <span style={{ color: "#1a3aad", fontSize: 14, fontWeight: 700 }}>
          {collapsed ? (
            <FiChevronRight size={16} />
          ) : (
            <FiChevronDown size={16} />
          )}
        </span>
      </div>
      {!collapsed && (
        <div style={{ padding: "0 16px 14px" }}>
          {agendas.map((agenda, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "7px 0",
                borderBottom:
                  i < agendas.length - 1 ? "1px solid #dde3f5" : "none",
              }}
            >
              <span
                style={{
                  minWidth: 22,
                  height: 22,
                  background: "#1a3aad",
                  color: "#f5c518",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: "clamp(11px, 3vw, 13px)",
                  color: "#1a3060",
                  fontFamily: "'Noto Sans Ethiopic', sans-serif",
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
}

export default function ForumReport({ t, lang, selectedTeam, onReportSaved }) {
  // ✅ FIX: Safe access to translations with fallback
  const safeT = t || {};
  const tf = safeT.forum || {};
  const safeYear = safeT.year || "2018 E.C.";

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

  const handleSaveReport = async () => {
    try {
      setSaving(true);
      const reportData = {
        ...form,
        teamId: selectedTeam?.id,
        teamName: selectedTeam?.name,
      };
      await meetingAPI.create(reportData);
      if (onReportSaved) {
        onReportSaved(selectedTeam.id, form);
      }
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to save report:", error);
    } finally {
      setSaving(false);
    }
  };

  const g3Responsive = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    gap: "clamp(10px, 3vw, 16px)",
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        <div
          style={{
            textAlign: "center",
            padding: "clamp(40px, 8vw, 60px) clamp(20px, 5vw, 40px)",
            background: C.white,
            borderRadius: 16,
            boxShadow: "0 4px 24px #0002",
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
              animation: "pulseGlow 2s ease-in-out infinite",
            }}
          >
            <FiCheck size={40} />
          </div>
          <h2
            style={{
              fontSize: "clamp(20px, 5vw, 26px)",
              fontWeight: 900,
              color: C.primary,
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
              fontSize: "clamp(13px, 3.5vw, 15px)",
            }}
          >
            {tf.savedSub || "Peer Forum report completed successfully."}
          </p>
          <button
            style={btn.primary}
            onClick={() => setSubmitted(false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(26,107,74,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FiPlus size={16} style={{ marginRight: 6 }} />
            {tf.newReport || "New Report"}
          </button>

          {/* ✅ NEW — AI Meeting Minutes, generated from the just-submitted form data */}
          <div style={{ marginTop: 24, textAlign: "left" }}>
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

  if (!selectedTeam) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          color: C.muted,
          fontFamily: F.sans,
          textAlign: "center",
          padding: "20px",
          animation: "fadeInUp 0.5s ease",
        }}
      >
        <div>
          <div
            style={{ fontSize: "clamp(48px, 12vw, 64px)", marginBottom: 16 }}
          >
            <FiMessageSquare
              size={64}
              color={C.muted}
              style={{ display: "block", margin: "0 auto" }}
            />
          </div>
          <p
            style={{
              fontSize: "clamp(16px, 4vw, 20px)",
              marginBottom: 12,
              color: C.dark,
            }}
          >
            {tf.selectTeamPrompt ||
              "Select a team from the sidebar to start a report"}
          </p>
          <p style={{ fontSize: "clamp(13px, 3vw, 15px)" }}>
            <FiUsers size={16} style={{ marginRight: 8 }} />
            Click on "Peer Forum" in the sidebar, then choose a team
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
        animation: "fadeInUp 0.5s ease",
      }}
    >
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FiMessageSquare size={36} color={C.primary} />
          <div>
            <h1
              style={{
                fontSize: "clamp(18px, 5vw, 24px)",
                fontWeight: 900,
                color: C.dark,
                fontFamily: F.serif,
                margin: 0,
                background: `linear-gradient(90deg, ${C.dark}, ${C.primary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {tf.title || "Peer Forum Report Form"} - {selectedTeam.name}
            </h1>
            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                margin: "2px 0 0",
              }}
            >
              {tf.subtitle ||
                "Addis Ababa City Admin · Addis Messob · Addis Ketema Center"}
            </p>
          </div>
        </div>
        <span
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
            color: "#fff",
            padding: "clamp(4px, 1.5vw, 6px) clamp(12px, 3vw, 18px)",
            borderRadius: 20,
            fontSize: "clamp(11px, 3vw, 13px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: `0 4px 15px ${C.primary}44`,
          }}
        >
          {safeYear}
        </span>
      </div>

      {/* ✅ Standing Agendas — shown on every forum report per official form */}
      <StandingAgendasPanel t={safeT} />

      <div
        style={{
          background: C.white,
          borderRadius: 12,
          padding: "clamp(16px, 4vw, 28px)",
          boxShadow: "0 2px 16px #0003",
        }}
      >
        <Section
          title={tf.meetingTime || "📅 Meeting Time"}
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

        <DynamicFieldGroup
          title={tf.presentMembers || "Present Members"}
          icon={<FiUserCheck size={18} />}
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
              placeholder={`Member ${idx + 1} name`}
            />
          )}
        />

        <Section
          title={tf.absentMembers || "Absent Members & Reasons"}
          icon={<FiUserX size={18} />}
        >
          {form.absent.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "clamp(12px, 4vw, 16px)",
                padding: "clamp(10px, 3vw, 14px)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
                animation: `fadeInUp ${0.2 + idx * 0.05}s ease`,
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(11px, 3.5vw, 12px)",
                  fontWeight: "bold",
                  color: "#6b7280",
                  marginBottom: "clamp(8px, 3vw, 12px)",
                }}
              >
                {tf.absentMemberLabel || "Absent Member"} #{idx + 1}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: "clamp(10px, 3vw, 12px)",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: "2", minWidth: "120px" }}>
                  <Field
                    label={`${idx + 1} ${tf.name || "Name"}`}
                    value={item.name}
                    onChange={(v) => updateAbsent(idx, "name", v)}
                    placeholder="Name"
                  />
                </div>
                <div style={{ flex: "3", minWidth: "120px" }}>
                  <Field
                    label={tf.reason || "Reason"}
                    value={item.reason}
                    onChange={(v) => updateAbsent(idx, "reason", v)}
                    placeholder="Reason for absence"
                  />
                </div>
                {form.absent.length > 1 && (
                  <button
                    onClick={() => removeAbsent(idx)}
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      width: "32px",
                      height: "32px",
                      fontSize: "18px",
                      cursor: "pointer",
                      marginTop: "28px",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#b91c1c";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#dc2626";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <FiX size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={addAbsent}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "clamp(8px, 3vw, 12px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10b981";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FiPlus size={16} />
            Add
          </button>
        </Section>

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
          labelPrefix="Result"
          placeholderPrefix="Result"
        />

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
          placeholderPrefix="Topic"
        />

        <Section
          title={tf.explanation || "Explanation Given (Brief)"}
          icon={<FiEdit3 size={18} />}
        >
          <textarea
            style={{
              ...inp,
              resize: "vertical",
              minHeight: "clamp(80px, 20vw, 100px)",
              fontSize: "clamp(13px, 3.5vw, 14px)",
              transition: "all 0.3s ease",
            }}
            rows={3}
            value={form.explanation}
            onChange={(e) => upd("explanation", e.target.value)}
            placeholder={tf.explanationPlaceholder || "Write explanation..."}
            onFocus={(e) => {
              e.currentTarget.borderColor = C.primary;
              e.currentTarget.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.borderColor = C.border;
              e.currentTarget.boxShadow = "none";
            }}
          />
        </Section>

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
          labelPrefix="Gap"
          placeholderPrefix="Gap"
        />

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
          labelPrefix="Agreement"
          placeholderPrefix="Agreement"
        />

        <Section
          title={tf.signatures || "Signatures"}
          icon={<FiPenTool size={18} />}
        >
          {form.signatures.map((sig, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
                flexWrap: "wrap",
                animation: `fadeInUp ${0.2 + idx * 0.05}s ease`,
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
                  placeholder="Signature Line"
                />
              </div>
              {form.signatures.length > 1 && (
                <button
                  onClick={() => removeItem("signatures", idx)}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                    fontSize: "18px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#b91c1c";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => addItem("signatures", "")}
            style={{
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10b981";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FiPlus size={16} />
            Add
          </button>
        </Section>

        <div
          style={{
            textAlign: "center",
            marginTop: "clamp(20px, 5vw, 28px)",
            display: "flex",
            gap: "clamp(10px, 3vw, 16px)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
              borderRadius: 10,
              fontSize: "clamp(13px, 3.5vw, 15px)",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: F.sans,
              transition: "all 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() =>
              exportForumReportToPDF(form, t, lang, selectedTeam?.name)
            }
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
            Export PDF
          </button>
          <button
            style={{
              ...btn.primary,
              padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
              fontSize: "clamp(13px, 3.5vw, 15px)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
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
                Saving...
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
      `}</style>
    </div>
  );
}
