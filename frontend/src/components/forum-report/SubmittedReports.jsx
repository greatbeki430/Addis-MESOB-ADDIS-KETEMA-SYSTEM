// frontend/src/components/forum-report/SubmittedReports.jsx
//
// "Submitted Reports" section shown on the first Peer Forum page
// (below the team list).
//   • Admin  → every completed report from every Team Leader
//              (with team filter + search).
//   • Leader → every report they submitted, from their first one
//              up to now, newest first.
// The backend enforces the same visibility rules; this component
// only chooses which query to send.

import { useState, useEffect, useMemo, useCallback } from "react";
import { meetingAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { isAdminOrAbove } from "../../utils/roles";
import { exportForumReportToPDF } from "../../utils/pdfExport";
import { C, F, shadows, radius } from "../../styles/theme";
import {
  FiSearch,
  FiX,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiRefreshCw,
  FiLoader,
  FiInbox,
  FiEye,
  FiDownload,
  FiCheckCircle,
} from "react-icons/fi";

const fmt = (d) => {
  const x = new Date(d);
  return isNaN(x)
    ? "—"
    : x.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const Block = ({ title, items }) => {
  const list = (Array.isArray(items) ? items : [items]).filter(
    (x) => typeof x === "string" && x.trim(),
  );
  if (!list.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 12,
          color: C.primary,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {list.map((x, i) => (
        <div
          key={i}
          style={{
            fontSize: 13,
            color: C.dark,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {list.length > 1 ? `${i + 1}. ` : ""}
          {x}
        </div>
      ))}
    </div>
  );
};

export default function SubmittedReports({ tf, t, lang }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = isAdminOrAbove(user);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [open, setOpen] = useState(null); // { loading, report }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await meetingAPI.getAll({
        submitted: "true",
        ...(isAdmin ? {} : { mine: "true" }),
      });
      setReports(Array.isArray(res.data) ? res.data : res.data?.meetings || []);
    } catch (e) {
      console.error("Submitted reports load failed:", e);
      showToast(
        tf("submittedLoadError", "Failed to load submitted reports"),
        "error",
      );
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast, tf]);

  // Reload only when the role changes — not whenever `tf` changes identity.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const teamNames = useMemo(
    () => [...new Set(reports.map((r) => r.teamName).filter(Boolean))].sort(),
    [reports],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (teamFilter !== "all" && r.teamName !== teamFilter) return false;
      if (!q) return true;
      return [
        r.teamName,
        r.createdByName,
        r.createdBy?.name,
        r.explanation,
        ...(r.topics || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [reports, search, teamFilter]);

  const openReport = async (r) => {
    setOpen({ loading: true, report: r });
    try {
      const res = await meetingAPI.getById(r._id);
      setOpen({ loading: false, report: res.data || r });
    } catch {
      showToast(tf("submittedOpenError", "Failed to open report"), "error");
      setOpen(null);
    }
  };

  const exportPdf = (rep) => {
    try {
      const sigs = rep.signatureData?.length
        ? rep.signatureData.map((s) => s.image)
        : (rep.signatures || []).filter(
            (s) => typeof s === "string" && s.startsWith("data:image/"),
          );
      exportForumReportToPDF(
        {
          date: new Date(rep.date).toISOString().split("T")[0],
          timeStart: rep.timeStart || "",
          timeEnd: rep.timeEnd || "",
          present: rep.present || [],
          absent: rep.absent || [],
          prevResults: rep.prevResults || [],
          topics: rep.topics || [],
          explanation: rep.explanation || "",
          gaps: rep.gaps || [],
          agreements: rep.agreements || [],
          signatures: sigs,
        },
        t,
        lang,
        rep.teamName,
        { includeAI: true },
      );
    } catch (e) {
      console.error(e);
      showToast(tf("exportError", "❌ Failed to export report"), "error");
    }
  };

  const rep = open?.report;

  return (
    <div style={{ marginTop: 36 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <FiCheckCircle size={20} color={C.primary} />
        <h3
          style={{
            margin: 0,
            fontFamily: F.serif,
            color: C.dark,
            fontSize: 18,
          }}
        >
          {tf("submittedReportsTitle", "Submitted Reports")}
        </h3>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 10px",
            borderRadius: 999,
          }}
        >
          {filtered.length}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={load}
          disabled={loading}
          aria-label="Refresh"
          style={{
            border: `1px solid ${C.border}`,
            background: "#fff",
            borderRadius: 8,
            width: 32,
            height: 32,
            cursor: "pointer",
          }}
        >
          <FiRefreshCw
            size={14}
            style={
              loading ? { animation: "spin 1s linear infinite" } : undefined
            }
          />
        </button>
      </div>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <FiSearch
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.muted,
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tf(
              "submittedSearch",
              "Search by team, leader, or topic…",
            )}
            style={{
              width: "100%",
              padding: "9px 12px 9px 32px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
        </div>
        {isAdmin && (
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 13,
              background: "#fff",
            }}
          >
            <option value="all">{tf("allTeams", "All teams")}</option>
            {teamNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: C.muted }}>
          <FiLoader
            size={22}
            style={{ animation: "spin 1s linear infinite" }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 36,
            border: `2px dashed ${C.border}`,
            borderRadius: 14,
            color: C.muted,
          }}
        >
          <FiInbox size={30} style={{ opacity: 0.4, marginBottom: 8 }} />
          <div style={{ fontSize: 13 }}>
            {tf("submittedEmpty", "No submitted reports yet.")}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((r) => (
            <div
              key={r._id}
              style={{
                background: "#fff",
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "12px 14px",
                boxShadow: shadows.sm,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <FiFileText size={15} color={C.primary} />
                <strong style={{ fontSize: 14, color: C.dark }}>
                  {r.teamName}
                </strong>
                <span style={{ flex: 1 }} />
                <button
                  onClick={() => openReport(r)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    border: "none",
                    background: C.primary,
                    color: "#fff",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <FiEye size={13} /> {tf("viewReport", "View")}
                </button>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: C.muted,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 4,
                }}
              >
                <span>
                  <FiCalendar size={11} /> {fmt(r.date)}
                </span>
                <span>
                  {tf("submittedBy", "by")}{" "}
                  {r.createdByName || r.createdBy?.name || "—"}
                </span>
                <span>
                  <FiUsers size={11} /> {(r.present || []).length}
                </span>
                <span>
                  {(r.topics || []).filter(Boolean).length}{" "}
                  {tf("topic", "Topic")}
                </span>
              </div>
              {(r.topics || [])
                .filter(Boolean)
                .slice(0, 2)
                .map((x, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: C.dark,
                      marginTop: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    • {x}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(13,26,94,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: radius.xl,
              width: "100%",
              maxWidth: 680,
              maxHeight: "88vh",
              overflowY: "auto",
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  flex: 1,
                  fontFamily: F.serif,
                  color: C.dark,
                }}
              >
                {rep?.teamName}
              </h3>
              {!open.loading && (
                <button
                  onClick={() => exportPdf(rep)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    border: `1px solid ${C.border}`,
                    background: "#fff",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <FiDownload size={13} /> PDF
                </button>
              )}
              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <FiX size={18} />
              </button>
            </div>
            {open.loading ? (
              <div style={{ textAlign: "center", padding: 30 }}>
                <FiLoader
                  size={22}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
                  {fmt(rep.date)} · {rep.timeStart || "—"}–{rep.timeEnd || "—"}{" "}
                  · {rep.createdByName || rep.createdBy?.name || "—"}
                </div>
                <Block
                  title={tf("presentMembers", "Present Members")}
                  items={rep.present}
                />
                <Block
                  title={tf("absentMembers", "Absent Members & Reasons")}
                  items={(rep.absent || []).map(
                    (a) => `${a.name}${a.reason ? ` — ${a.reason}` : ""}`,
                  )}
                />
                <Block
                  title={tf("prevResults", "Results from Previous Meeting")}
                  items={rep.prevResults}
                />
                <Block
                  title={tf("todayTopics", "Today's Discussion Topics")}
                  items={rep.topics}
                />
                <Block
                  title={tf("explanation", "Explanation Given (Brief)")}
                  items={rep.explanation}
                />
                <Block title={tf("gaps", "Identified Gaps")} items={rep.gaps} />
                <Block
                  title={tf("agreements", "Agreed Points")}
                  items={rep.agreements}
                />
                {(rep.signatureData || []).length > 0 && (
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: C.primary,
                        marginBottom: 6,
                      }}
                    >
                      {tf("signatures", "Signatures")}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {rep.signatureData.map((s) => (
                        <div
                          key={s.key}
                          style={{
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            padding: 6,
                            textAlign: "center",
                          }}
                        >
                          <img
                            src={s.image}
                            alt={s.name}
                            style={{
                              width: "100%",
                              height: 44,
                              objectFit: "contain",
                            }}
                          />
                          <div style={{ fontSize: 11, fontWeight: 600 }}>
                            {s.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
