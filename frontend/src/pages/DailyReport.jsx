// frontend/src/pages/DailyReport.jsx
import { useState, useEffect, useRef } from "react";
import { btn, card, C, F } from "../styles/theme";
import Field from "../components/ui/Field";
import { dailyReportAPI, serviceAPI } from "../services/api";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { generateDailyReportPDF } from "../utils/pdf/reports/dailyReport";
import { AISummary, AIReportAssistant } from "../components/ai";
import { aiAPI } from "../services/api";
import {
  FiCalendar,
  FiList,
  FiPlus,
  FiX,
  FiSave,
  FiLoader,
  FiFileText,
  FiBarChart2,
  FiFile,
  FiZap,
} from "react-icons/fi";

export default function DailyReport({ t, lang }) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const td = (key, fb = "") => t?.(`dailyReport.${key}`) || fb;
  const tcm = (key, fb = "") => t?.(`common.${key}`) || fb;

  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [animatedTotals, setAnimatedTotals] = useState({
    total: 0,
    male: 0,
    female: 0,
  });
  const [savedReportId, setSavedReportId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const prevRowsRef = useRef(rows);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Fetch departments and services ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await serviceAPI.getAll();

        const services = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response?.data?.services)
              ? response.data.services
              : [];

        if (cancelled) return;

        setAllServices(services);

        const deptMap = new Map();

        services.forEach((s) => {
          if (!s?.dept) return;
          deptMap.set(s.dept, lang === "en" ? s.deptEn || s.dept : s.dept);
        });

        const deptEntries = [...deptMap.entries()];
        setDepartments(deptEntries);
      } catch (err) {
        console.error("Failed to fetch services:", err);
        if (!cancelled) {
          setAllServices([]);
          setDepartments([]);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  // ─── Load daily report for selected date ────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await dailyReportAPI.getByDate(date);
        if (response.data && response.data.length > 0) {
          setRows(response.data);
          setSavedReportId(response.data[0]?._id || response.data?._id || null);
        } else {
          setRows([{ dept: "", service: "", male: 0, female: 0, total: 0 }]);
          setSavedReportId(null);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setRows([{ dept: "", service: "", male: 0, female: 0, total: 0 }]);
          setSavedReportId(null);
        } else {
          console.error("Failed to load daily report:", error);
          showToast(td("saveError", "Failed to load daily report"), "error");
          setRows([{ dept: "", service: "", male: 0, female: 0, total: 0 }]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const calculateTotals = (rowsData) => {
    const total = rowsData.reduce((a, r) => a + (r.total || 0), 0);
    const male = rowsData.reduce((a, r) => a + (r.male || 0), 0);
    const female = rowsData.reduce((a, r) => a + (r.female || 0), 0);
    return { total, male, female };
  };

  useEffect(() => {
    if (prevRowsRef.current !== rows) {
      setAnimatedTotals(calculateTotals(rows));
      prevRowsRef.current = rows;
    }
  }, [rows]);

  const upd = (index, field, value) => {
    setRows((prevRows) => {
      const next = [...prevRows];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      if (field === "male" || field === "female") {
        next[index].total =
          (Number(field === "male" ? value : next[index].male) || 0) +
          (Number(field === "female" ? value : next[index].female) || 0);
      }
      return next;
    });
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        dept: "",
        service: "",
        male: 0,
        female: 0,
        total: 0,
      },
    ]);

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const getServicesByDept = (deptKey) => {
    if (!deptKey) return [];
    return allServices.filter((s) => s.dept === deptKey);
  };

  const saveReport = async () => {
    try {
      setSaving(true);
      const entries = rows.filter((r) => r.dept || r.service);
      if (entries.length === 0) {
        showToast(
          td("addServiceEntry", "Please add at least one service entry"),
          "warning",
        );
        return;
      }
      const invalidRows = entries.filter((r) => !r.dept || !r.service);
      if (invalidRows.length > 0) {
        showToast(
          td(
            "fillDeptService",
            "Please fill in both Department and Service for all rows",
          ),
          "warning",
        );
        return;
      }
      const grandTotal = entries.reduce((sum, e) => sum + (e.total || 0), 0);
      const response = await dailyReportAPI.create({
        date,
        entries,
        grandTotal,
        team: user?.team || null,
      });
      setSavedReportId(response?.data?._id || null);
      showToast(td("savedSuccess", "✅ Report saved successfully!"), "success");
    } catch (error) {
      console.error("Failed to save report:", error);
      showToast(
        error.response?.data?.message ||
          td("saveError", "Failed to save report"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    try {
      setExporting(true);

      const exportData = rows.filter((r) => r.dept || r.service);

      if (exportData.length === 0) {
        showToast(td("noDataToExport", "No data to export"), "warning");
        return;
      }

      await generateDailyReportPDF(exportData, date, t);
      showToast(
        td("exportSuccess", "✅ PDF exported successfully!"),
        "success",
      );
    } catch (error) {
      console.error("Failed to export PDF:", error);
      showToast(
        td("exportError", "Failed to export PDF: ") + error.message,
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  // ─── Style helpers ───────────────────────────────────────────────────────────
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

  const tdCell = {
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
          <FiFileText size={36} color={C.primary} />
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
              {td("title", "Daily Report")}
            </h1>
            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                margin: "2px 0 0",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FiCalendar size={14} />
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
          {t?.("year") || "2018 E.C."}
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
          label={
            <>
              <FiCalendar size={14} style={{ marginRight: 6 }} />
              {td("reportDate", "Report Date")}
            </>
          }
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
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiList size={18} color={C.primary} />
            {td("serviceList", "Service List")}
            <span
              style={{
                fontSize: "clamp(11px, 3vw, 12px)",
                color: C.muted,
                fontWeight: 400,
                marginLeft: 8,
              }}
            >
              ({rows.length} {tcm("records", "records")})
            </span>
          </h3>
          <button
            onClick={addRow}
            style={{
              ...btn.secondary,
              padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 18px)",
              fontSize: "clamp(12px, 3vw, 13px)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiPlus size={14} />
            {td("addRow", "Add Row")}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
            <FiLoader
              size={24}
              style={{
                animation: "spin 1s linear infinite",
                display: "block",
                margin: "0 auto 12px",
              }}
            />
            {tcm("loading", "Loading...")}
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
                    <th style={th}>{td("colDept", "Department")}</th>
                    <th style={th}>{td("colService", "Service")}</th>
                    <th style={{ ...th, textAlign: "center" }}>
                      {td("colMale", "M")}
                    </th>
                    <th style={{ ...th, textAlign: "center" }}>
                      {td("colFemale", "F")}
                    </th>
                    <th style={{ ...th, textAlign: "center" }}>
                      {td("colTotal", "Total")}
                    </th>
                    <th style={{ ...th, textAlign: "center", width: 40 }}>
                      <FiX size={14} color={C.light} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const availableServices = getServicesByDept(r.dept);
                    return (
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
                            ...tdCell,
                            textAlign: "center",
                            color: "#aaa",
                            fontWeight: 600,
                          }}
                        >
                          {i + 1}
                        </td>

                        <td style={tdCell}>
                          <select
                            style={{
                              ...ti,
                              width: "clamp(120px, 15vw, 150px)",
                              borderColor:
                                hoveredRow === i ? C.primary : C.border,
                              cursor: "pointer",
                            }}
                            value={r.dept || ""}
                            onChange={(e) => {
                              setRows((prev) => {
                                const next = [...prev];
                                next[i] = {
                                  ...next[i],
                                  dept: e.target.value,
                                  service: "",
                                };
                                return next;
                              });
                            }}
                          >
                            <option value="">
                              {td("selectDept", "Select Dept")}
                            </option>
                            {departments.map(([rawKey, label]) => (
                              <option key={rawKey} value={rawKey}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={tdCell}>
                          <select
                            style={{
                              ...ti,
                              width: "clamp(130px, 20vw, 180px)",
                              borderColor:
                                hoveredRow === i ? C.primary : C.border,
                              cursor: "pointer",
                            }}
                            value={r.service || ""}
                            onChange={(e) => upd(i, "service", e.target.value)}
                          >
                            <option value="">
                              {td("selectService", "Select Service")}
                            </option>
                            {availableServices.length > 0 ? (
                              availableServices.map((s) => (
                                <option key={s._id} value={s.name}>
                                  {lang === "en" ? s.nameEn || s.name : s.name}
                                </option>
                              ))
                            ) : r.dept ? (
                              <option value="" disabled>
                                {td("noServices", "No services for this dept")}
                              </option>
                            ) : (
                              <option value="" disabled>
                                {td(
                                  "selectDeptFirst",
                                  "Select a department first",
                                )}
                              </option>
                            )}
                          </select>
                        </td>

                        <td style={tdCell}>
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
                            value={r.male || 0}
                            onChange={(e) =>
                              upd(i, "male", Number(e.target.value) || 0)
                            }
                            inputMode="numeric"
                            min="0"
                          />
                        </td>

                        <td style={tdCell}>
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
                            value={r.female || 0}
                            onChange={(e) =>
                              upd(i, "female", Number(e.target.value) || 0)
                            }
                            inputMode="numeric"
                            min="0"
                          />
                        </td>

                        <td
                          style={{
                            ...tdCell,
                            textAlign: "center",
                            fontWeight: 700,
                            color: C.primary,
                            fontSize: "clamp(13px, 3.5vw, 15px)",
                          }}
                        >
                          {r.total || 0}
                        </td>

                        <td style={{ ...tdCell, textAlign: "center" }}>
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
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
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
                              <FiX size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

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
                        ...tdCell,
                        fontWeight: 800,
                        textAlign: "right",
                        fontSize: "clamp(13px, 3.5vw, 15px)",
                        color: C.dark,
                      }}
                    >
                      <FiBarChart2 size={14} style={{ marginRight: 6 }} />
                      {td("grandTotal", "Grand Total")}
                    </td>
                    <td
                      style={{
                        ...tdCell,
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
                        ...tdCell,
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
                        ...tdCell,
                        fontWeight: 900,
                        textAlign: "center",
                        fontSize: "clamp(18px, 4.5vw, 22px)",
                        color: C.primary,
                      }}
                    >
                      {animatedTotals.total}
                    </td>
                    <td style={tdCell}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ✅ AI Report Assistant */}
            {rows.length > 0 && rows.some((r) => r.dept || r.service) && (
              <div style={{ marginTop: "clamp(12px, 3vw, 16px)" }}>
                <AIReportAssistant
                  reportContext={{
                    date: date,
                    entries: rows.filter((r) => r.dept || r.service),
                    grandTotal: rows.reduce(
                      (sum, e) => sum + (e.total || 0),
                      0,
                    ),
                    teamName: user?.team || tcm("myTeam", "My Team"),
                  }}
                  onApply={(text) => {
                    showToast(
                      td("aiInsight", "AI suggestion applied to report!"),
                      "success",
                    );
                    console.log("Applied suggestion:", text);
                  }}
                />
              </div>
            )}

            {/* ✅ IMPROVED: Action Buttons - Horizontal layout with better styling */}
            <div
              style={{
                marginTop: "clamp(20px, 4vw, 28px)",
                display: "flex",
                gap: "clamp(8px, 2vw, 14px)",
                justifyContent: isMobile ? "center" : "flex-start",
                flexWrap: "wrap",
                padding: isMobile ? "0" : "0",
              }}
            >
              {/* Export PDF Button - Primary Action */}
              <button
                style={{
                  background: exporting ? "#94A3B8" : "#DC2626",
                  color: "#fff",
                  border: "none",
                  padding: isMobile
                    ? "clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 18px)"
                    : "clamp(10px, 2vw, 13px) clamp(20px, 4vw, 28px)",
                  borderRadius: 10,
                  fontSize: isMobile
                    ? "clamp(12px, 3vw, 13px)"
                    : "clamp(13px, 2.5vw, 14px)",
                  fontWeight: 700,
                  cursor: exporting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                  opacity: exporting ? 0.7 : 1,
                  boxShadow: exporting
                    ? "none"
                    : "0 4px 15px rgba(220,38,38,0.3)",
                  flex: isMobile ? "1 1 auto" : "0 1 auto",
                  minWidth: isMobile ? "auto" : "140px",
                }}
                onClick={exportPDF}
                disabled={exporting}
                onMouseEnter={(e) => {
                  if (!exporting) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(220,38,38,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = exporting
                    ? "none"
                    : "0 4px 15px rgba(220,38,38,0.3)";
                }}
              >
                {exporting ? (
                  <>
                    <FiLoader
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    {!isMobile && td("exporting", "Exporting...")}
                  </>
                ) : (
                  <>
                    <FiFile size={16} />
                    {!isMobile && td("exportPdf", "Export PDF")}
                  </>
                )}
              </button>

              {/* Save Report Button - Primary */}
              <button
                style={{
                  background: saving ? "#94A3B8" : C.primary,
                  color: "#fff",
                  border: "none",
                  padding: isMobile
                    ? "clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 18px)"
                    : "clamp(10px, 2vw, 13px) clamp(20px, 4vw, 28px)",
                  borderRadius: 10,
                  fontSize: isMobile
                    ? "clamp(12px, 3vw, 13px)"
                    : "clamp(13px, 2.5vw, 14px)",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                  opacity: saving ? 0.7 : 1,
                  boxShadow: saving ? "none" : `0 4px 15px ${C.primary}44`,
                  flex: isMobile ? "1 1 auto" : "0 1 auto",
                  minWidth: isMobile ? "auto" : "140px",
                }}
                onClick={saveReport}
                disabled={saving}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 6px 20px ${C.primary}66`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = saving
                    ? "none"
                    : `0 4px 15px ${C.primary}44`;
                }}
              >
                {saving ? (
                  <>
                    <FiLoader
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    {!isMobile && tcm("saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <FiSave size={16} />
                    {!isMobile && td("save", "Save Report")}
                  </>
                )}
              </button>

              {/* AI Writing Assistant - Secondary Action */}
              <button
                style={{
                  background: "#8B5CF6",
                  color: "#fff",
                  border: "none",
                  padding: isMobile
                    ? "clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 18px)"
                    : "clamp(10px, 2vw, 13px) clamp(20px, 4vw, 28px)",
                  borderRadius: 10,
                  fontSize: isMobile
                    ? "clamp(12px, 3vw, 13px)"
                    : "clamp(13px, 2.5vw, 14px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(139,92,246,0.3)",
                  flex: isMobile ? "1 1 auto" : "0 1 auto",
                  minWidth: isMobile ? "auto" : "140px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(139,92,246,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(139,92,246,0.3)";
                }}
              >
                <FiZap size={16} />
                {!isMobile && td("aiAssistant", "AI Writing Assistant")}
              </button>

              {/* Summarize Button - Secondary */}
              <button
                style={{
                  background: "#F59E0B",
                  color: "#fff",
                  border: "none",
                  padding: isMobile
                    ? "clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 18px)"
                    : "clamp(10px, 2vw, 13px) clamp(20px, 4vw, 28px)",
                  borderRadius: 10,
                  fontSize: isMobile
                    ? "clamp(12px, 3vw, 13px)"
                    : "clamp(13px, 2.5vw, 14px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(245,158,11,0.3)",
                  flex: isMobile ? "1 1 auto" : "0 1 auto",
                  minWidth: isMobile ? "auto" : "140px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(245,158,11,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(245,158,11,0.3)";
                }}
              >
                <FiBarChart2 size={16} />
                {!isMobile && td("summarize", "Summarize")}
              </button>

              {/* Full Report Button - Secondary */}
              <button
                style={{
                  background: "#3B82F6",
                  color: "#fff",
                  border: "none",
                  padding: isMobile
                    ? "clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 18px)"
                    : "clamp(10px, 2vw, 13px) clamp(20px, 4vw, 28px)",
                  borderRadius: 10,
                  fontSize: isMobile
                    ? "clamp(12px, 3vw, 13px)"
                    : "clamp(13px, 2.5vw, 14px)",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(59,130,246,0.3)",
                  flex: isMobile ? "1 1 auto" : "0 1 auto",
                  minWidth: isMobile ? "auto" : "140px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(59,130,246,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 15px rgba(59,130,246,0.3)";
                }}
              >
                <FiFileText size={16} />
                {!isMobile && td("fullReport", "Full Report")}
              </button>
            </div>

            {/* ✅ AI Insight panel - Added margin-top for spacing */}
            {savedReportId && (
              <div style={{ marginTop: "clamp(20px, 4vw, 30px)" }}>
                <AISummary
                  fetchFn={(id) => aiAPI.getDailyInsight(id, null)}
                  args={[savedReportId]}
                  label={td("aiInsight", "AI Daily Insight")}
                />
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
