// ════════════════════════════════════════════════════════════
// pages/Evaluation
// ════════════════════════════════════════════════════════════
import { useState } from "react";
import { btn, card, C, F, inp } from "../styles/theme";
import { CRITERIA } from "../constants/criteria";
import { exportEvaluationReportToPDF } from "../utils/pdfExport";
export default function Evaluation({ t }) {
  const te = t.evaluation;
  const [scores, setScores] = useState({});
  const [members, setMembers] = useState(["አባል 1", "አባል 2", "አባል 3"]);
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

  const thS = {
    background: C.dark,
    color: C.light,
    padding: "9px 10px",
    textAlign: "left",
    fontFamily: F.sans,
    fontWeight: 700,
    fontSize: 11,
  };
  const tdS = {
    padding: "8px 10px",
    borderBottom: "1px solid #eef2ee",
    fontFamily: F.sans,
    fontSize: 11,
  };
  const totalScores = (member) => {
    return CRITERIA.flatMap((c) =>
      c.items.map((_, i) => scores[`${c.id}-${i}-${member}`] || 0),
    ).reduce((a, b) => a + b, 0);
  };
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <h1
          style={{
            fontSize: 24,
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
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {te.outOf}
        </span>
      </div>
      <p
        style={{
          color: "#555",
          marginBottom: 22,
          fontSize: 13,
          fontFamily: F.sans,
        }}
      >
        {te.subtitle}
      </p>

      <div style={card}>
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: 14,
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
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 10,
          }}
        >
          {members.map((m, i) => (
            <input
              key={i}
              style={inp}
              value={m}
              onChange={(e) => {
                const a = [...members];
                a[i] = e.target.value;
                setMembers(a);
              }}
            />
          ))}
        </div>
      </div>

      {CRITERIA.map((c) => (
        <div
          key={c.id}
          style={{
            ...card,
            borderLeft: `5px solid ${c.color}`,
            paddingLeft: 20,
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 800,
              color: c.color,
              fontFamily: F.sans,
            }}
          >
            {t.criteria[c.key]}{" "}
            <span
              style={{
                fontWeight: 400,
                fontSize: 12,
                color: "#888",
                marginLeft: 6,
              }}
            >
              ({c.weight}%)
            </span>
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...thS, width: "42%" }}>መስፈርት / Criterion</th>
                  <th style={{ ...thS, textAlign: "center" }}>{te.maxPts}</th>
                  {members.map((m) => (
                    <th key={m} style={{ ...thS, textAlign: "center" }}>
                      {m}
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
                    {members.map((m) => (
                      <td key={m} style={{ ...tdS, textAlign: "center" }}>
                        <input
                          type="number"
                          min="0"
                          max={item.points}
                          style={{
                            width: 52,
                            border: `1.5px solid ${C.border}`,
                            borderRadius: 6,
                            padding: "4px 6px",
                            textAlign: "center",
                            fontSize: 13,
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

      <div style={card}>
        <h3
          style={{
            margin: "0 0 14px",
            fontSize: 14,
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          📊 {te.total}
        </h3>
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {totals.map(({ name }) => {
            const isBest = total(name) === best && best > 0;
            return (
              <div
                key={name}
                style={{
                  flex: 1,
                  minWidth: 110,
                  background: isBest ? "#f0f9f4" : C.cardBg,
                  borderRadius: 10,
                  padding: 18,
                  textAlign: "center",
                  border: `2px solid ${isBest ? C.primary : "#e0eee8"}`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: F.sans,
                    marginBottom: 6,
                  }}
                >
                  {name}
                </div>
                <div
                  style={{ fontSize: 36, fontWeight: 900, color: C.primary }}
                >
                  {total(name)}
                </div>
                <div style={{ fontSize: 11, color: "#999" }}>/100</div>
                {isBest && (
                  <div
                    style={{
                      marginTop: 6,
                      background: C.primary,
                      color: "#fff",
                      borderRadius: 10,
                      padding: "2px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ★ Best
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button style={btn.primary}>💾 {te.save}</button>
          <button style={btn.secondary} onClick={() => setScores({})}>
            ↺ {te.reset}
          </button>
        </div> */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          <button
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "11px 26px",
              borderRadius: 8,
              fontSize: 14,
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
              );
            }}
          >
            📄 Export PDF
          </button>
          <button style={btn.primary}>💾 {te.save}</button>
          <button style={btn.secondary} onClick={() => setScores({})}>
            ↺ {te.reset}
          </button>
        </div>
      </div>
    </div>
  );
}
