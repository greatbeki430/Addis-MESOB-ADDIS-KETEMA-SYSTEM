// components/golden-monday/ReportExport.jsx
// Export reports for Golden Monday (attendance, sessions, gallery) - PDF, Excel, Word

import { useState } from "react";
import { C, F } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiDownload,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiCamera,
  FiLoader,
  FiCheck,
  FiFile,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ReportExport({ sessionId }) {
  const { language } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState("attendance");
  const [exportFormat, setExportFormat] = useState("pdf");

  // Get translations based on language
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    return {
      start: thirtyDaysAgo.toISOString().split("T")[0],
      end: now.toISOString().split("T")[0],
    };
  });

  const reportTypes = [
    {
      value: "attendance",
      label: t.attendanceReport || "Attendance Report",
      icon: <FiUsers size={14} />,
    },
    {
      value: "sessions",
      label: t.sessionsReport || "Sessions Report",
      icon: <FiFileText size={14} />,
    },
    {
      value: "gallery",
      label: t.galleryReport || "Gallery Report",
      icon: <FiCamera size={14} />,
    },
  ];

  const formatOptions = [
    { value: "pdf", label: "PDF", icon: <FiFile size={14} /> },
    { value: "excel", label: "Excel", icon: <FiFileText size={14} /> },
    { value: "word", label: "Word", icon: <FiFileText size={14} /> },
  ];

  // Helper function to get report data based on type
  const getReportData = async (type) => {
    switch (type) {
      case "attendance": {
        const attendanceRes = await goldenMondayAPI.getAttendance(sessionId);
        return {
          title: "Golden Monday Attendance Report",
          date: new Date().toISOString(),
          sessionId: sessionId,
          attendance: attendanceRes.data.attendance || [],
          stats: attendanceRes.data,
        };
      }
      case "sessions": {
        const sessionsRes = await goldenMondayAPI.getSessions();
        return {
          title: "Golden Monday Sessions Report",
          date: new Date().toISOString(),
          total: sessionsRes.data.length,
          sessions: sessionsRes.data,
        };
      }
      case "gallery": {
        const galleryRes = await goldenMondayAPI.getGallery({ limit: 1000 });
        return {
          title: "Golden Monday Gallery Report",
          date: new Date().toISOString(),
          total: galleryRes.data.photos.length,
          photos: galleryRes.data.photos,
        };
      }
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  };

  // Helper function to get filename based on type and format
  const getFilename = (type, format) => {
    const date = new Date().toISOString().split("T")[0];
    return `golden-monday-${type}-${date}.${format}`;
  };

  // ─── Export as PDF ──────────────────────────────────────────
  const exportAsPDF = async (data, filename) => {
    try {
      // Dynamic import for PDF libraries
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(26, 58, 173);
      doc.text(data.title || "Golden Monday Report", pageWidth / 2, 20, {
        align: "center",
      });

      // Subtitle / Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated: ${new Date(data.date).toLocaleString()}`,
        pageWidth / 2,
        28,
        { align: "center" },
      );

      let yPos = 35;

      // Attendance Report
      if (data.attendance) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Attendance Summary", 14, yPos);
        yPos += 6;

        const summaryData = [
          ["Metric", "Value"],
          [
            "Total Employees",
            data.stats?.totalEmployees || data.attendance.length,
          ],
          ["Present", data.stats?.attendedCount || 0],
          [
            "Absent",
            (data.stats?.totalEmployees || data.attendance.length) -
              (data.stats?.attendedCount || 0),
          ],
          [
            "Attendance Rate",
            data.stats?.totalEmployees > 0
              ? `${Math.round((data.stats?.attendedCount / data.stats?.totalEmployees) * 100)}%`
              : "0%",
          ],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [summaryData[0]],
          body: summaryData.slice(1),
          theme: "striped",
          headStyles: { fillColor: [26, 58, 173] },
        });

        yPos = doc.lastAutoTable.finalY + 8;

        // Detailed Attendance Table
        doc.setFontSize(12);
        doc.text("Detailed Attendance", 14, yPos);
        yPos += 6;

        const tableData = data.attendance.map((a) => [
          a.name || "Unknown",
          a.department || "N/A",
          a.email || "N/A",
          a.attended ? "✅ Present" : "❌ Absent",
          a.signature ? "✓ Signed" : "✗ Not Signed",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Name", "Department", "Email", "Status", "Signature"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [26, 58, 173] },
          styles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 30 },
            2: { cellWidth: 45 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
          },
        });
      }

      // Sessions Report
      if (data.sessions) {
        yPos = doc.lastAutoTable?.finalY + 8 || 35;
        doc.setFontSize(12);
        doc.text("Sessions Summary", 14, yPos);
        yPos += 6;

        const sessionData = data.sessions.map((s) => [
          s.presentationTitle || s.title || "Untitled",
          new Date(s.date).toLocaleDateString(),
          s.presenterName || "N/A",
          s.averageRating ? `${s.averageRating.toFixed(1)} ★` : "N/A",
          s.status || "Unknown",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Title", "Date", "Presenter", "Rating", "Status"]],
          body: sessionData,
          theme: "striped",
          headStyles: { fillColor: [26, 58, 173] },
          styles: { fontSize: 8 },
        });
      }

      // Gallery Report
      if (data.photos) {
        yPos = doc.lastAutoTable?.finalY + 8 || 35;
        doc.setFontSize(12);
        doc.text("Gallery Summary", 14, yPos);
        yPos += 6;

        const galleryData = data.photos.map((p) => [
          p.title || "Untitled",
          p.category || "Other",
          new Date(p.createdAt).toLocaleDateString(),
          p.uploadedByName || "Unknown",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Title", "Category", "Date", "Uploaded By"]],
          body: galleryData,
          theme: "striped",
          headStyles: { fillColor: [26, 58, 173] },
          styles: { fontSize: 8 },
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
      }

      doc.save(filename);
      return true;
    } catch (error) {
      console.error("PDF export error:", error);
      throw error;
    }
  };

  // ─── Export as Excel ────────────────────────────────────────
  const exportAsExcel = (data, filename) => {
    try {
      const wb = XLSX.utils.book_new();

      // Main sheet with report info

      // Attendance data
      if (data.attendance) {
        const attendanceRows = [
          [
            "Name",
            "Department",
            "Email",
            "Attended",
            "Signature",
            "Checked In At",
            "Feedback",
            "Rating",
          ],
        ];
        data.attendance.forEach((a) => {
          attendanceRows.push([
            a.name || "Unknown",
            a.department || "N/A",
            a.email || "N/A",
            a.attended ? "Present" : "Absent",
            a.signature ? "Signed" : "Not Signed",
            a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : "N/A",
            a.feedback || "",
            a.rating || "N/A",
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(attendanceRows);
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");

        // Stats sheet
        if (data.stats) {
          const statsRows = [
            ["Metric", "Value"],
            ["Total Employees", data.stats.totalEmployees || 0],
            ["Present", data.stats.attendedCount || 0],
            [
              "Absent",
              (data.stats.totalEmployees || 0) -
                (data.stats.attendedCount || 0),
            ],
            [
              "Attendance Rate",
              data.stats.totalEmployees > 0
                ? `${Math.round((data.stats.attendedCount / data.stats.totalEmployees) * 100)}%`
                : "0%",
            ],
          ];
          const statsWs = XLSX.utils.aoa_to_sheet(statsRows);
          XLSX.utils.book_append_sheet(wb, statsWs, "Stats");
        }
      }

      // Sessions data
      if (data.sessions) {
        const sessionRows = [
          ["Title", "Date", "Presenter", "Rating", "Status", "Attendees"],
        ];
        data.sessions.forEach((s) => {
          sessionRows.push([
            s.presentationTitle || s.title || "Untitled",
            new Date(s.date).toLocaleDateString(),
            s.presenterName || "N/A",
            s.averageRating ? `${s.averageRating.toFixed(1)} ★` : "N/A",
            s.status || "Unknown",
            s.attendees?.length || 0,
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sessionRows);
        XLSX.utils.book_append_sheet(wb, ws, "Sessions");
      }

      // Gallery data
      if (data.photos) {
        const galleryRows = [
          ["Title", "Category", "Date", "Uploaded By", "URL"],
        ];
        data.photos.forEach((p) => {
          galleryRows.push([
            p.title || "Untitled",
            p.category || "Other",
            new Date(p.createdAt).toLocaleDateString(),
            p.uploadedByName || "Unknown",
            p.url || "",
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(galleryRows);
        XLSX.utils.book_append_sheet(wb, ws, "Gallery");
      }

      // Write file
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, filename);

      return true;
    } catch (error) {
      console.error("Excel export error:", error);
      throw error;
    }
  };

  // ─── Export as Word ──────────────────────────────────────────
  const exportAsWord = (data, filename) => {
    try {
      let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${data.title || "Golden Monday Report"}</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
            h1 { color: #1a3aad; border-bottom: 2px solid #1a3aad; padding-bottom: 10px; }
            h2 { color: #333; margin-top: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 10px 0; }
            th { background-color: #1a3aad; color: white; padding: 8px 12px; text-align: left; }
            td { padding: 6px 12px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { text-align: center; font-size: 10px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
            .summary-box { background: #f0f4f8; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .badge-present { color: green; font-weight: bold; }
            .badge-absent { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.title || "Golden Monday Report"}</h1>
            <p><strong>Generated:</strong> ${new Date(data.date).toLocaleString()}</p>
            <p><strong>Report Type:</strong> ${reportType}</p>
          </div>
      `;

      // Attendance section
      if (data.attendance) {
        const total = data.attendance.length;
        const present = data.attendance.filter((a) => a.attended).length;
        const absent = total - present;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        htmlContent += `
          <h2>📊 Attendance Summary</h2>
          <div class="summary-box">
            <table>
              <tr><td><strong>Total Employees:</strong></td><td>${total}</td></tr>
              <tr><td><strong>Present:</strong></td><td>${present}</td></tr>
              <tr><td><strong>Absent:</strong></td><td>${absent}</td></tr>
              <tr><td><strong>Attendance Rate:</strong></td><td>${rate}%</td></tr>
            </table>
          </div>

          <h2>📋 Detailed Attendance</h2>
          <table>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Email</th>
              <th>Status</th>
              <th>Signature</th>
              <th>Checked In</th>
            </tr>
        `;

        data.attendance.forEach((a) => {
          htmlContent += `
            <tr>
              <td>${a.name || "Unknown"}</td>
              <td>${a.department || "N/A"}</td>
              <td>${a.email || "N/A"}</td>
              <td class="${a.attended ? "badge-present" : "badge-absent"}">${a.attended ? "✅ Present" : "❌ Absent"}</td>
              <td>${a.signature ? "✓ Signed" : "✗ Not Signed"}</td>
              <td>${a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : "N/A"}</td>
            </tr>
          `;
        });

        htmlContent += `</table>`;
      }

      // Sessions section
      if (data.sessions) {
        htmlContent += `
          <h2>📅 Sessions Report</h2>
          <table>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Presenter</th>
              <th>Rating</th>
              <th>Status</th>
            </tr>
        `;

        data.sessions.forEach((s) => {
          htmlContent += `
            <tr>
              <td>${s.presentationTitle || s.title || "Untitled"}</td>
              <td>${new Date(s.date).toLocaleDateString()}</td>
              <td>${s.presenterName || "N/A"}</td>
              <td>${s.averageRating ? `${s.averageRating.toFixed(1)} ★` : "N/A"}</td>
              <td>${s.status || "Unknown"}</td>
            </tr>
          `;
        });

        htmlContent += `</table>`;
      }

      // Gallery section
      if (data.photos) {
        htmlContent += `
          <h2>🖼️ Gallery Report</h2>
          <table>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Uploaded By</th>
            </tr>
        `;

        data.photos.forEach((p) => {
          htmlContent += `
            <tr>
              <td>${p.title || "Untitled"}</td>
              <td>${p.category || "Other"}</td>
              <td>${new Date(p.createdAt).toLocaleDateString()}</td>
              <td>${p.uploadedByName || "Unknown"}</td>
            </tr>
          `;
        });

        htmlContent += `</table>`;
      }

      htmlContent += `
          <div class="footer">
            <p>Generated by Addis MESOB Golden Monday System • ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], {
        type: "application/msword;charset=utf-8",
      });
      saveAs(blob, filename);
      return true;
    } catch (error) {
      console.error("Word export error:", error);
      throw error;
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Get report data
      const data = await getReportData(reportType);
      const filename = getFilename(reportType, exportFormat);

      let success = false;
      switch (exportFormat) {
        case "pdf":
          success = await exportAsPDF(data, filename);
          break;
        case "excel":
          success = exportAsExcel(data, filename);
          break;
        case "word":
          success = exportAsWord(data, filename);
          break;
        default:
          throw new Error(`Unknown format: ${exportFormat}`);
      }

      if (success) {
        showToast(
          `${t.exportSuccess || "Report exported successfully!"} (${exportFormat.toUpperCase()})`,
          "success",
        );
      }
    } catch (error) {
      console.error("Export failed:", error);
      showToast(
        `${t.exportError || "Failed to export report"} (${exportFormat.toUpperCase()})`,
        "error",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ fontFamily: F.sans }}>
      {/* Report Type Selection */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {reportTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setReportType(type.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              border: `2px solid ${reportType === type.value ? C.primary : C.border}`,
              background:
                reportType === type.value ? C.primary + "11" : C.white,
              color: reportType === type.value ? C.primary : C.muted,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: reportType === type.value ? 600 : 400,
              transition: "all 0.2s ease",
              fontFamily: F.sans,
            }}
            aria-label={type.label}
          >
            {type.icon}
            {type.label}
            {reportType === type.value && (
              <FiCheck
                size={14}
                color={C.primary}
                style={{ marginLeft: "auto" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Export Format & Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiCalendar size={14} color={C.muted} />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            style={{
              padding: "6px 10px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              fontFamily: F.sans,
            }}
            aria-label={t.startDate || "Start date"}
          />
          <span style={{ color: C.muted }}>{t.to || "to"}</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            style={{
              padding: "6px 10px",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              fontFamily: F.sans,
            }}
            aria-label={t.endDate || "End date"}
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {formatOptions.map((format) => (
            <button
              key={format.value}
              onClick={() => setExportFormat(format.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 6,
                border: `2px solid ${exportFormat === format.value ? C.primary : C.border}`,
                background:
                  exportFormat === format.value ? C.primary : "transparent",
                color: exportFormat === format.value ? "#fff" : C.muted,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: exportFormat === format.value ? 600 : 400,
                fontFamily: F.sans,
                transition: "all 0.2s ease",
              }}
            >
              {format.icon}
              {format.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: exporting ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            fontFamily: F.sans,
            opacity: exporting ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
          aria-label={t.exportReport || "Export Report"}
        >
          {exporting ? (
            <>
              <FiLoader
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
              {t.exporting || "Exporting..."}
            </>
          ) : (
            <>
              <FiDownload size={16} />
              {t.exportReport || `Export (${exportFormat.toUpperCase()})`}
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
