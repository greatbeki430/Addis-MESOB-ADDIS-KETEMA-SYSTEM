import { useState } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { CRITERIA } from "../constants/criteria";
import { exportEvaluationReportToPDF } from "../utils/pdfExport";

export default function Evaluation({ t, lang }) {
  const te = t.evaluation;
  const [scores, setScores] = useState({});
  const [members, setMembers] = useState([
    lang === "en" ? "Member 1" : "አባል 1",
    lang === "en" ? "Member 2" : "አባል 2",
    lang === "en" ? "Member 3" : "አባል 3",
  ]);

  const setScore = (cId, iIdx, m, v) => {
    const key = `${cId}-${iIdx}-${m}`;
    const max = CRITERIA[cId - 1].items[iIdx].points;
    setScores((s) => ({ ...s, [key]: Math.min(Number(v), max) }));
  };

  const total = (m) =>
    CRITERIA.flatMap((c) =>
      c.items.map((_, i) => scores[`${c.id}-${i}-${m}`] || 0),
    ).reduce((a, b) => a + b, 0);

  const totals = members.map((m) => ({ name: m, total: total(m) }));
  const best = totals.reduce((a, b) => (b.total > a ? b.total : a), 0);

  const totalScores = (member) => {
    return CRITERIA.flatMap((c) =>
      c.items.map((_, i) => scores[`${c.id}-${i}-${member}`] || 0),
    ).reduce((a, b) => a + b, 0);
  };

  // Responsive table cell styles
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
            fontSize: "clamp(16px, 5vw, 22px)",
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

      {/* Team Members Section */}
      <div style={card}>
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(13px, 4vw, 15px)",
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          {te.teamMembers}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
            gap: "clamp(8px, 2.5vw, 12px)",
          }}
        >
          {members.map((m, i) => (
            <input
              key={i}
              style={{
                ...inp,
                padding: "clamp(6px, 2vw, 10px) clamp(8px, 2.5vw, 12px)",
                fontSize: "clamp(11px, 3vw, 13px)",
              }}
              value={m}
              onChange={(e) => {
                const a = [...members];
                a[i] = e.target.value;
                setMembers(a);
              }}
              placeholder={`Member ${i + 1}`}
            />
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
            marginBottom: "20px",
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
              gap: "6px",
            }}
          >
            {t.criteria && t.criteria[c.key] ? t.criteria[c.key] : c.key}
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

          {/* Table Container Wrapper */}
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "clamp(10px, 3vw, 12px)",
                minWidth: "500px",
              }}
            />
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {/* <th style={thS}>መስፈርት / Criterion</th> */}
                  <th style={thS}>{lang === "en" ? "Criterion" : "መስፈርት"}</th>
                  <th style={{ ...thS, textAlign: "center" }}>{te.maxPts}</th>
                  {members.map((m) => (
                    <th
                      key={m}
                      style={{ ...thS, textAlign: "center", minWidth: "80px" }}
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
                    <td style={tdS}>
                      <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)" }}>
                        {/* If items array has multi-lang layout, fetch it here, else fallback to baseline item string text context */}
                        {lang === "en" && item.textEn ? item.textEn : item.text}
                      </span>
                    </td>
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
                    {members.map((m) => (
                      <td key={m} style={{ ...tdS, textAlign: "center" }}>
                        <input
                          type="number"
                          min="0"
                          max={item.points}
                          style={{
                            width: "clamp(50px, 12vw, 60px)",
                            border: `1.5px solid ${C.border}`,
                            borderRadius: 6,
                            padding:
                              "clamp(3px, 1.5vw, 6px) clamp(4px, 2vw, 8px)",
                            textAlign: "center",
                            fontSize: "clamp(11px, 3vw, 13px)",
                          }}
                          value={scores[`${c.id}-${idx}-${m}`] || ""}
                          onChange={(e) =>
                            setScore(c.id, idx, m, e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Results Summary */}
      <div style={card}>
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: "clamp(13px, 4vw, 15px)",
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          📊 {te.total}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
            gap: "clamp(10px, 3vw, 14px)",
            marginBottom: "clamp(16px, 4vw, 20px)",
          }}
        >
          {totals.map(({ name }) => {
            const isBest = total(name) === best && best > 0;
            return (
              <div
                key={name}
                style={{
                  background: isBest ? "#f0f9f4" : C.cardBg,
                  borderRadius: 10,
                  padding: "clamp(12px, 4vw, 18px)",
                  textAlign: "center",
                  border: `2px solid ${isBest ? C.primary : "#e0eee8"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(11px, 3vw, 12px)",
                    fontWeight: 700,
                    fontFamily: F.sans,
                    marginBottom: 6,
                    wordBreak: "break-word",
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontSize: "clamp(28px, 8vw, 36px)",
                    fontWeight: 900,
                    color: C.primary,
                  }}
                >
                  {total(name)}
                </div>
                <div
                  style={{
                    fontSize: "clamp(10px, 2.5vw, 11px)",
                    color: "#999",
                  }}
                >
                  /100
                </div>
                {isBest && (
                  <div
                    style={{
                      marginTop: 6,
                      background: C.primary,
                      color: "#fff",
                      borderRadius: 10,
                      padding: "2px 8px",
                      fontSize: "clamp(9px, 2.5vw, 10px)",
                      fontWeight: 700,
                      display: "inline-block",
                    }}
                  >
                    ★ Best
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "clamp(8px, 3vw, 12px)",
            justifyContent: "center",
            marginTop: "clamp(16px, 4vw, 24px)",
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
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() => {
              const bestPerformer =
                members.length > 0
                  ? members.reduce((a, b) => {
                      return totalScores(a) > totalScores(b) ? a : b;
                    }, members[0])
                  : null;
              exportEvaluationReportToPDF(
                scores,
                members,
                totalScores,
                bestPerformer,
                t,
                lang,
              );
            }}
          >
            📄 Export PDF
          </button>
          <button style={btn.primary}> {te.save}</button>
          <button style={btn.secondary} onClick={() => setScores({})}>
            ↺ {te.reset}
          </button>
        </div>
      </div>
    </div>
  );
}
