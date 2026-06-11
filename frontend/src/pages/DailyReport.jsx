// ════════════════════════════════════════════════════════════
// pages/DailyReport - Mobile Responsive
// ════════════════════════════════════════════════════════════
import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { btn, card, C, F, inp } from "../styles/theme";
import Field from "../components/ui/Field";
import { SAMPLE_DATA } from "../constants/sampleData";
import { exportDailyReportToPDF } from "../utils/pdfExport";

export default function DailyReport({ t }) {
  const td = t.dailyReport;
  const [rows, setRows] = useState(SAMPLE_DATA.map((r) => ({ ...r })));
  const [date, setDate] = useState("");

  const upd = (i, f, v) => {
    const u = [...rows];
    u[i] = { ...u[i], [f]: v };
    if (f === "male" || f === "female")
      u[i].total =
        (Number(f === "male" ? v : u[i].male) || 0) +
        (Number(f === "female" ? v : u[i].female) || 0);
    setRows(u);
  };

  const gT = rows.reduce((a, r) => a + (r.total || 0), 0);
  const gM = rows.reduce((a, r) => a + (r.male || 0), 0);
  const gF = rows.reduce((a, r) => a + (r.female || 0), 0);

  // Responsive table styles
  const th = {
    background: C.dark,
    color: C.light,
    padding: "clamp(6px, 2vw, 10px) clamp(4px, 1.5vw, 10px)",
    textAlign: "left",
    fontFamily: F.sans,
    fontWeight: 700,
    fontSize: "clamp(10px, 3vw, 12px)",
    whiteSpace: "nowrap",
  };

  const td2 = {
    padding: "clamp(6px, 2vw, 10px) clamp(4px, 1.5vw, 10px)",
    borderBottom: "1px solid #eef2ee",
    fontFamily: F.sans,
    verticalAlign: "middle",
    fontSize: "clamp(11px, 3vw, 13px)",
  };

  const ti = {
    border: `1.5px solid ${C.border}`,
    borderRadius: 6,
    padding: "clamp(3px, 1.5vw, 6px) clamp(4px, 2vw, 8px)",
    fontFamily: F.sans,
    background: "#fafffe",
    fontSize: "clamp(11px, 3vw, 13px)",
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
          marginBottom: "clamp(16px, 4vw, 24px)",
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
          {td.title}
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
          Daily Report
        </span>
      </div>

      {/* Date Picker */}
      <div style={{ ...card, marginBottom: "clamp(16px, 4vw, 20px)" }}>
        <Field
          label={td.reportDate}
          value={date}
          onChange={setDate}
          type="date"
        />
      </div>

      {/* Service Table */}
      <div style={card}>
        <h3
          style={{
            margin: "0 0 " + (window.innerWidth < 768 ? "12px" : "14px"),
            fontSize: "clamp(13px, 4vw, 15px)",
            fontWeight: 800,
            color: C.dark,
            fontFamily: F.sans,
          }}
        >
          {td.serviceList}
        </h3>

        {/* Responsive table with horizontal scroll */}
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            margin: "0 -4px",
            padding: "0 4px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "clamp(11px, 3vw, 13px)",
              minWidth: "500px",
            }}
          >
            <thead>
              <tr>
                <th style={th}>{td.colNo}</th>
                <th style={th}>{td.colDept}</th>
                <th style={th}>{td.colService}</th>
                <th style={th}>{td.colMale}</th>
                <th style={th}>{td.colFemale}</th>
                <th style={th}>{td.colTotal}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={i % 2 === 0 ? { background: C.cardBg } : {}}>
                  <td
                    style={{
                      ...td2,
                      textAlign: "center",
                      color: "#aaa",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td style={td2}>
                    <input
                      style={{ ...ti, width: "clamp(70px, 15vw, 90px)" }}
                      value={r.dept}
                      onChange={(e) => upd(i, "dept", e.target.value)}
                      placeholder="Dept"
                    />
                  </td>
                  <td style={td2}>
                    <input
                      style={{ ...ti, width: "clamp(100px, 20vw, 130px)" }}
                      value={r.service}
                      onChange={(e) => upd(i, "service", e.target.value)}
                      placeholder="Service"
                    />
                  </td>
                  <td style={td2}>
                    <input
                      type="number"
                      style={{
                        ...ti,
                        width: "clamp(45px, 10vw, 55px)",
                        textAlign: "center",
                        minHeight: "32px", // Easier to tap on mobile
                      }}
                      value={r.male}
                      onChange={(e) => upd(i, "male", Number(e.target.value))}
                      inputMode="numeric" // Shows number keyboard on mobile
                    />
                  </td>
                  <td style={td2}>
                    <input
                      type="number"
                      style={{
                        ...ti,
                        width: "clamp(45px, 10vw, 55px)",
                        textAlign: "center",
                        minHeight: "32px", // Easier to tap on mobile
                      }}
                      value={r.female}
                      onChange={(e) => upd(i, "female", Number(e.target.value))}
                      inputMode="numeric" // Shows number keyboard on mobile
                    />
                  </td>
                  <td
                    style={{
                      ...td2,
                      textAlign: "center",
                      fontWeight: 700,
                      color: C.primary,
                    }}
                  >
                    {r.total}
                  </td>
                </tr>
              ))}

              {/* Grand Total Row */}
              <tr style={{ background: "#f0f7f4" }}>
                <td
                  colSpan={3}
                  style={{
                    ...td2,
                    fontWeight: 700,
                    textAlign: "right",
                  }}
                >
                  {td.grandTotal}
                </td>
                <td style={{ ...td2, fontWeight: 700, textAlign: "center" }}>
                  {gM}
                </td>
                <td style={{ ...td2, fontWeight: 700, textAlign: "center" }}>
                  {gF}
                </td>
                <td
                  style={{
                    ...td2,
                    fontWeight: 700,
                    textAlign: "center",
                    color: C.primary,
                    fontSize: "clamp(14px, 4vw, 16px)",
                  }}
                >
                  {gT}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            marginTop: "clamp(16px, 4vw, 20px)",
            display: "flex",
            gap: "clamp(8px, 3vw, 12px)",
            justifyContent: "center",
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
            onClick={() => exportDailyReportToPDF(rows, date, t)}
          >
            Export PDF
          </button>
          <button
            style={btn.secondary}
            onClick={() =>
              setRows([
                ...rows,
                { dept: "", service: "", male: 0, female: 0, total: 0 },
              ])
            }
          >
            {td.addRow}
          </button>
          <button style={btn.primary}>{td.save}</button>
        </div>
      </div>
    </div>
  );
}
