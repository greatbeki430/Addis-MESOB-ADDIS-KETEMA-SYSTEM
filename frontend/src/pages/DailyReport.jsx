import { useState, useEffect, useRef } from "react";
import { btn, card, C, F } from "../styles/theme";
import Field from "../components/ui/Field";
import { dailyReportAPI } from "../services/api";
import { exportDailyReportToPDF } from "../utils/pdfExport";

export default function DailyReport({ t, lang }) {
  const td = t.dailyReport;
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [animatedTotals, setAnimatedTotals] = useState({
    total: 0,
    male: 0,
    female: 0,
  });

  // Use ref to track if totals need updating
  const prevRowsRef = useRef(rows);

  // Load daily report data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await dailyReportAPI.getByDate(date);
        if (response.data && response.data.length > 0) {
          setRows(response.data);
        } else {
          // Start with one empty row if no data
          setRows([{ dept: "", service: "", male: 0, female: 0, total: 0 }]);
        }
      } catch (error) {
        console.error("Failed to load daily report:", error);
        setRows([{ dept: "", service: "", male: 0, female: 0, total: 0 }]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [date]);

  // Update totals without causing cascading renders
  // Use useMemo or calculate directly in render
  const calculateTotals = (rowsData) => {
    const total = rowsData.reduce((a, r) => a + (r.total || 0), 0);
    const male = rowsData.reduce((a, r) => a + (r.male || 0), 0);
    const female = rowsData.reduce((a, r) => a + (r.female || 0), 0);
    return { total, male, female };
  };

  // Update totals when rows change - but only if they actually changed
  useEffect(() => {
    // Check if rows actually changed to avoid unnecessary updates
    if (prevRowsRef.current !== rows) {
      const newTotals = calculateTotals(rows);
      setAnimatedTotals(newTotals);
      prevRowsRef.current = rows;
    }
  }, [rows]);

  const upd = (i, f, v) => {
    const u = [...rows];
    u[i] = { ...u[i], [f]: v };
    if (f === "male" || f === "female") {
      u[i].total =
        (Number(f === "male" ? v : u[i].male) || 0) +
        (Number(f === "female" ? v : u[i].female) || 0);
    }
    setRows(u);
  };

  const addRow = () => {
    setRows([...rows, { dept: "", service: "", male: 0, female: 0, total: 0 }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const saveReport = async () => {
    try {
      setSaving(true);
      const data = rows.filter((r) => r.dept || r.service);
      await dailyReportAPI.create({ date, data });
      // Show success toast
    } catch (error) {
      console.error("Failed to save report:", error);
    } finally {
      setSaving(false);
    }
  };

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
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
        animation: "fadeInUp 0.5s ease",
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "clamp(28px, 7vw, 36px)" }}>📋</span>
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
              {td.title}
            </h1>
            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                margin: "2px 0 0",
              }}
            >
              {new Date(date).toLocaleDateString(
                lang === "en" ? "en-US" : lang === "am" ? "am-ET" : "om-ET",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
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
          {t.year}
        </span>
      </div>

      {/* Date Picker */}
      <div
        style={{
          ...card,
          marginBottom: "clamp(16px, 4vw, 20px)",
          transition: "all 0.3s ease",
        }}
      >
        <Field
          label={td.reportDate}
          value={date}
          onChange={setDate}
          type="date"
        />
      </div>

      {/* Service Table */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "clamp(12px, 3vw, 16px)",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h3
            style={{
              fontSize: "clamp(14px, 4vw, 16px)",
              fontWeight: 800,
              color: C.dark,
              fontFamily: F.sans,
              margin: 0,
            }}
          >
            {td.serviceList}
            <span
              style={{
                fontSize: "clamp(11px, 3vw, 12px)",
                color: C.muted,
                fontWeight: 400,
                marginLeft: 8,
              }}
            >
              ({rows.length} {t.common?.records || "records"})
            </span>
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={addRow}
              style={{
                ...btn.secondary,
                padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 18px)",
                fontSize: "clamp(12px, 3vw, 13px)",
              }}
            >
              ➕ {td.addRow}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
            ⏳ {t.common?.loading || "Loading..."}
          </div>
        ) : (
          <>
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
                    <th style={th}>#</th>
                    <th style={th}>{td.colDept}</th>
                    <th style={th}>{td.colService}</th>
                    <th style={{ ...th, textAlign: "center" }}>{td.colMale}</th>
                    <th style={{ ...th, textAlign: "center" }}>
                      {td.colFemale}
                    </th>
                    <th style={{ ...th, textAlign: "center" }}>
                      {td.colTotal}
                    </th>
                    <th style={{ ...th, textAlign: "center", width: 40 }}>✕</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        ...(i % 2 === 0 ? { background: C.cardBg } : {}),
                        transition: "background 0.3s ease",
                      }}
                      onMouseEnter={() => setHoveredRow(i)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td
                        style={{
                          ...td2,
                          textAlign: "center",
                          color: "#aaa",
                          fontWeight: 600,
                        }}
                      >
                        {i + 1}
                      </td>
                      <td style={td2}>
                        <input
                          style={{
                            ...ti,
                            width: "clamp(70px, 15vw, 90px)",
                            borderColor:
                              hoveredRow === i ? C.primary : C.border,
                          }}
                          value={r.dept}
                          onChange={(e) => upd(i, "dept", e.target.value)}
                          placeholder="Dept"
                        />
                      </td>
                      <td style={td2}>
                        <input
                          style={{
                            ...ti,
                            width: "clamp(100px, 20vw, 130px)",
                            borderColor:
                              hoveredRow === i ? C.primary : C.border,
                          }}
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
                            width: "clamp(50px, 10vw, 60px)",
                            textAlign: "center",
                            minHeight: "32px",
                            borderColor:
                              hoveredRow === i ? C.primary : C.border,
                          }}
                          value={r.male}
                          onChange={(e) =>
                            upd(i, "male", Number(e.target.value))
                          }
                          inputMode="numeric"
                          min="0"
                        />
                      </td>
                      <td style={td2}>
                        <input
                          type="number"
                          style={{
                            ...ti,
                            width: "clamp(50px, 10vw, 60px)",
                            textAlign: "center",
                            minHeight: "32px",
                            borderColor:
                              hoveredRow === i ? C.primary : C.border,
                          }}
                          value={r.female}
                          onChange={(e) =>
                            upd(i, "female", Number(e.target.value))
                          }
                          inputMode="numeric"
                          min="0"
                        />
                      </td>
                      <td
                        style={{
                          ...td2,
                          textAlign: "center",
                          fontWeight: 700,
                          color: C.primary,
                          fontSize: "clamp(13px, 3.5vw, 15px)",
                        }}
                      >
                        {r.total || 0}
                      </td>
                      <td style={{ ...td2, textAlign: "center" }}>
                        {rows.length > 1 && (
                          <button
                            onClick={() => removeRow(i)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 16,
                              color: "#999",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#dc2626";
                              e.currentTarget.style.transform = "scale(1.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#999";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Grand Total Row */}
                  <tr
                    style={{
                      background: `linear-gradient(90deg, ${C.primary}15, ${C.primary}08)`,
                      borderTop: `2px solid ${C.primary}`,
                    }}
                  >
                    <td
                      colSpan={3}
                      style={{
                        ...td2,
                        fontWeight: 800,
                        textAlign: "right",
                        fontSize: "clamp(13px, 3.5vw, 15px)",
                        color: C.dark,
                      }}
                    >
                      {td.grandTotal}
                    </td>
                    <td
                      style={{
                        ...td2,
                        fontWeight: 700,
                        textAlign: "center",
                        fontSize: "clamp(14px, 3.5vw, 16px)",
                        color: C.primary,
                      }}
                    >
                      {animatedTotals.male}
                    </td>
                    <td
                      style={{
                        ...td2,
                        fontWeight: 700,
                        textAlign: "center",
                        fontSize: "clamp(14px, 3.5vw, 16px)",
                        color: C.primary,
                      }}
                    >
                      {animatedTotals.female}
                    </td>
                    <td
                      style={{
                        ...td2,
                        fontWeight: 900,
                        textAlign: "center",
                        fontSize: "clamp(18px, 4.5vw, 22px)",
                        color: C.primary,
                      }}
                    >
                      {animatedTotals.total}
                    </td>
                    <td style={td2}></td>
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
                  padding: "clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 32px)",
                  borderRadius: 10,
                  fontSize: "clamp(13px, 3.5vw, 15px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                }}
                onClick={() => exportDailyReportToPDF(rows, date, t)}
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
                📄 Export PDF
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
                onClick={saveReport}
                disabled={saving}
              >
                {saving ? "⏳ Saving..." : "💾 " + td.save}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
