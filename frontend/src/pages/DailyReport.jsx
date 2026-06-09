// ════════════════════════════════════════════════════════════
// pages/DailyReport
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
  const th = {
    background: C.dark,
    color: C.light,
    padding: "9px 10px",
    textAlign: "left",
    fontFamily: F.sans,
    fontWeight: 700,
    fontSize: 11,
  };
  const td2 = {
    padding: "8px 10px",
    borderBottom: "1px solid #eef2ee",
    fontFamily: F.sans,
    verticalAlign: "middle",
  };
  const ti = {
    border: `1.5px solid ${C.border}`,
    borderRadius: 6,
    padding: "4px 6px",
    fontFamily: F.sans,
    background: "#fafffe",
  };
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
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
          {td.title}
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
          Daily Report
        </span>
      </div>
      <div style={{ ...card, marginBottom: 16 }}>
        <Field
          label={td.reportDate}
          value={date}
          onChange={setDate}
          type="date"
        />
      </div>
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
          {td.serviceList}
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead>
              <tr>
                {[
                  td.colNo,
                  td.colDept,
                  td.colService,
                  td.colMale,
                  td.colFemale,
                  td.colTotal,
                ].map((h) => (
                  <th key={h} style={th}>
                    {h}
                  </th>
                ))}
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
                      fontSize: 11,
                    }}
                  >
                    {i + 1}
                  </td>
                  <td style={td2}>
                    <input
                      style={{ ...ti, width: 90, fontSize: 12 }}
                      value={r.dept}
                      onChange={(e) => upd(i, "dept", e.target.value)}
                    />
                  </td>
                  <td style={td2}>
                    <input
                      style={{ ...ti, width: 130, fontSize: 12 }}
                      value={r.service}
                      onChange={(e) => upd(i, "service", e.target.value)}
                    />
                  </td>
                  <td style={td2}>
                    <input
                      type="number"
                      style={{ ...ti, width: 52, textAlign: "center" }}
                      value={r.male}
                      onChange={(e) => upd(i, "male", Number(e.target.value))}
                    />
                  </td>
                  <td style={td2}>
                    <input
                      type="number"
                      style={{ ...ti, width: 52, textAlign: "center" }}
                      value={r.female}
                      onChange={(e) => upd(i, "female", Number(e.target.value))}
                    />
                  </td>
                  <td
                    style={{
                      ...td2,
                      textAlign: "center",
                      fontWeight: 700,
                      color: C.primary,
                      fontSize: 14,
                    }}
                  >
                    {r.total}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#f0f7f4" }}>
                <td
                  colSpan={3}
                  style={{
                    ...td2,
                    fontWeight: 700,
                    textAlign: "right",
                    fontSize: 12,
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
                    fontSize: 16,
                  }}
                >
                  {gT}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
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
        </div> */}
        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            style={{
              background: "#dc2626",
              color: "#fff",
              border: "none",
              padding: "9px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() => exportDailyReportToPDF(rows, date, t)}
          >
            📄 Export PDF
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
