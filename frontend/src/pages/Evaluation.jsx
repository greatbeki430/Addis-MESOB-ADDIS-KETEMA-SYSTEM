// ════════════════════════════════════════════════════════════
// pages/Evaluation - Dynamic with Collapsible Rankings
// ════════════════════════════════════════════════════════════
import { useState, useRef } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { CRITERIA } from "../constants/criteria";
import { exportEvaluationReportToPDF } from "../utils/pdfExport";
import { useAuth } from "../context/AuthContext";
import { ArrowDown01Icon } from "hugeicons-react";

export default function Evaluation({ t }) {
  const te = t.evaluation;
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [scores, setScores] = useState({});
  const [members, setMembers] = useState(["", "", ""]);
  const [teamName, setTeamName] = useState("");
  const [showRankings, setShowRankings] = useState(false);

  // ✅ Create refs for all input fields for keyboard navigation
  const inputRefs = useRef({});

  // Add new member (max 7)
  const addMember = () => {
    if (members.length < 7) {
      setMembers([...members, ""]);
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
    }
  };

  // Update member name
  const updateMemberName = (index, name) => {
    const newMembers = [...members];
    newMembers[index] = name;
    setMembers(newMembers);
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
    .map((m) => ({ name: m, total: total(m) }));

  const sortedMembers = [...totals].sort((a, b) => b.total - a.total);

  // Calculate summary stats for collapsed view
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

  // ✅ Keyboard navigation: Visual order (top-to-bottom, left-to-right) with wrapping
  const handleKeyDown = (e, cId, itemIdx, member) => {
    const allMembers = members.filter((m) => m.trim() !== "");
    const currentMemberIndex = allMembers.indexOf(member);

    // Next: Enter or ArrowDown
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();

      let nextCriterionId = cId;
      let nextItemIdx = itemIdx;
      let nextMemberIndex = currentMemberIndex + 1;

      // If last member, move to next item (row) in same criterion
      if (nextMemberIndex >= allMembers.length) {
        nextMemberIndex = 0;
        nextItemIdx = itemIdx + 1;

        // If last item, move to first item of next criterion
        if (nextItemIdx >= CRITERIA[cId - 1].items.length) {
          nextItemIdx = 0;
          nextCriterionId = cId + 1;

          // If last criterion, wrap to first criterion
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

    // Previous: ArrowUp
    if (e.key === "ArrowUp") {
      e.preventDefault();

      let prevCriterionId = cId;
      let prevItemIdx = itemIdx;
      let prevMemberIndex = currentMemberIndex - 1;

      // If first member, move to previous item (row) in same criterion
      if (prevMemberIndex < 0) {
        prevMemberIndex = allMembers.length - 1;
        prevItemIdx = itemIdx - 1;

        // If first item, move to last item of previous criterion
        if (prevItemIdx < 0) {
          const prevCriterion = CRITERIA[cId - 2];
          if (prevCriterion) {
            prevItemIdx = prevCriterion.items.length - 1;
            prevCriterionId = cId - 1;
          } else {
            // If first criterion, wrap to last criterion
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

  // Generate input ID for each score field
  const getInputId = (cId, iIdx, m) =>
    `score-${cId}-${iIdx}-${m.replace(/\s/g, "")}`;

  const getRankInfo = (index, total, totalMembers) => {
    const percentage = totalMembers > 0 ? (index + 1) / totalMembers : 0;

    if (index === 0 && total > 0) {
      return {
        rank: "🥇 1st Place",
        level: "🏆 Excellent",
        color: "#fbbf24",
        bg: "#fffbeb",
      };
    } else if (index === 1 && total > 0) {
      return {
        rank: "🥈 2nd Place",
        level: "⭐ Very Good",
        color: "#9ca3af",
        bg: "#f3f4f6",
      };
    } else if (index === 2 && total > 0) {
      return {
        rank: "🥉 3rd Place",
        level: "👍 Good",
        color: "#cd7a32",
        bg: "#fff7ed",
      };
    } else if (percentage <= 0.5) {
      return {
        rank: `#${index + 1}`,
        level: "📈 Above Average",
        color: "#3b82f6",
        bg: "#eff6ff",
      };
    } else if (total >= 50) {
      return {
        rank: `#${index + 1}`,
        level: "📊 Average",
        color: "#8b5cf6",
        bg: "#f5f3ff",
      };
    } else {
      return {
        rank: `#${index + 1}`,
        level: "📉 Needs Improvement",
        color: "#ef4444",
        bg: "#fef2f2",
      };
    }
  };

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
          }}
        >
          {te.title}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 3vw, 12px)",
            borderRadius: 20,
            fontSize: "clamp(10px, 3vw, 11px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {te.outOf}
        </span>
      </div>

      <p
        style={{
          color: "#555",
          marginBottom: "clamp(16px, 4vw, 22px)",
          fontSize: "clamp(12px, 3.5vw, 13px)",
          fontFamily: F.sans,
        }}
      >
        {te.subtitle}
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
            }}
          >
            👥 {te.teamMembers} (Max 7)
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
              + Add Member
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
                  }}
                >
                  ✕
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
            {t.criteria[c.key]}
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
                  <th style={{ ...thS, textAlign: "center" }}>{te.maxPts}</th>
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

      {/* ✅ COLLAPSIBLE RANKINGS SECTION with Hugeicons Icon */}
      <div style={card}>
        {/* Clickable header with Hugeicons Arrow Down */}
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
            {/* ✅ Hugeicons ArrowDown01Icon instead of text arrow */}
            <ArrowDown01Icon
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
              }}
            >
              📊 ጠቅላላ & Rankings
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
                style={{ fontSize: "clamp(11px, 3vw, 13px)", color: C.muted }}
              >
                ⭐ Best: {bestPerformer}
              </span>
              <span
                style={{ fontSize: "clamp(11px, 3vw, 13px)", color: C.muted }}
              >
                📊 Avg: {averageScore}
              </span>
            </div>
          )}
        </div>

        {/* Expanded content - only shown when showRankings is true */}
        {showRankings && (
          <div style={{ marginTop: 20 }}>
            {/* Summary Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: C.bg,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(24px, 5vw, 28px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {totalMembers}
                </div>
                <div style={{ fontSize: "11px", color: C.muted }}>
                  Total Members
                </div>
              </div>
              <div
                style={{
                  background: C.bg,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(24px, 5vw, 28px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {averageScore}
                </div>
                <div style={{ fontSize: "11px", color: C.muted }}>
                  Average Score
                </div>
              </div>
              <div
                style={{
                  background: C.bg,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(24px, 5vw, 28px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {highestScore}
                </div>
                <div style={{ fontSize: "11px", color: C.muted }}>
                  Highest Score
                </div>
              </div>
              <div
                style={{
                  background: C.bg,
                  borderRadius: 10,
                  padding: 12,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(24px, 5vw, 28px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {lowestScore}
                </div>
                <div style={{ fontSize: "11px", color: C.muted }}>
                  Lowest Score
                </div>
              </div>
            </div>

            {/* Detailed Rankings Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
                gap: 14,
              }}
            >
              {sortedMembers.map(({ name, total: memberTotal }, idx) => {
                const rankInfo = getRankInfo(
                  idx,
                  memberTotal,
                  sortedMembers.length,
                );
                return (
                  <div
                    key={name}
                    style={{
                      background: rankInfo.bg,
                      borderRadius: 12,
                      padding: 16,
                      border: `2px solid ${rankInfo.color}20`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "clamp(14px, 4vw, 16px)",
                          fontWeight: 800,
                          color: C.dark,
                        }}
                      >
                        {name}
                      </span>
                      <span
                        style={{
                          background: rankInfo.color,
                          color: "#fff",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: "clamp(10px, 2.5vw, 11px)",
                          fontWeight: 700,
                        }}
                      >
                        {rankInfo.rank}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "clamp(28px, 8vw, 36px)",
                          fontWeight: 900,
                          color: C.primary,
                        }}
                      >
                        {memberTotal}
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(12px, 3vw, 14px)",
                          color: "#999",
                        }}
                      >
                        / 100
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      <span style={{ fontSize: "clamp(12px, 3vw, 14px)" }}>
                        {rankInfo.level}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        background: `${rankInfo.color}20`,
                        borderRadius: 8,
                        height: 6,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${memberTotal}%`,
                          height: "100%",
                          background: rankInfo.color,
                          borderRadius: 8,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
            background: "#dc2626",
            color: "#fff",
            border: "none",
            padding: "clamp(8px, 2.5vw, 11px) clamp(16px, 5vw, 26px)",
            borderRadius: 8,
            fontSize: "clamp(12px, 3.5vw, 14px)",
            fontWeight: 700,
            cursor: "pointer",
          }}
          onClick={() => {
            const bestPerformer =
              sortedMembers.length > 0 ? sortedMembers[0].name : null;
            exportEvaluationReportToPDF(
              scores,
              members.filter((m) => m.trim() !== ""),
              (m) => total(m),
              bestPerformer,
              t,
            );
          }}
        >
          📄 Export PDF
        </button>
        <button style={btn.primary}>💾 {te.save}</button>
        <button
          style={btn.secondary}
          onClick={() => {
            setScores({});
            setMembers(["", "", ""]);
            setTeamName("");
          }}
        >
          ↺ {te.reset}
        </button>
      </div>
    </div>
  );
}
