// components/golden-monday/ReportExport.jsx
// Export reports for Golden Monday (attendance, sessions, gallery) - PDF, Excel, Word

import { useState } from "react";
import { C, F } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
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
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState("attendance");
  const [exportFormat, setExportFormat] = useState("pdf");

  // Translation helper for Golden Monday keys
  const gt = (key, fallback = key) => {
    const value = t(`goldenMonday.${key}`);
    return value === `goldenMonday.${key}` ? fallback : value;
  };

  // Translation helper for common keys
  const ct = (key, fallback = key) => {
    const value = t(`common.${key}`);
    return value === `common.${key}` ? fallback : value;
  };

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
      label: gt("attendanceReport", "Attendance Report"),
      icon: <FiUsers size={14} />,
    },
    {
      value: "sessions",
      label: gt("sessionsReport", "Sessions Report"),
      icon: <FiFileText size={14} />,
    },
    {
      value: "gallery",
      label: gt("galleryReport", "Gallery Report"),
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
        // Ensure signature data is properly passed through
        const attendanceData = attendanceRes.data.attendance || [];
        // Log for debugging
        console.log(
          "📊 Attendance data with signatures:",
          attendanceData.map((a) => ({
            name: a.name,
            hasSignature: !!a.signature,
            signatureLength: a.signature ? a.signature.length : 0,
            signaturePreview: a.signature
              ? a.signature.substring(0, 50) + "..."
              : "null",
          })),
        );
        return {
          title: gt("attendanceReport", "Attendance Report"),
          date: new Date().toISOString(),
          sessionId: sessionId,
          attendance: attendanceData,
          stats: attendanceRes.data,
        };
      }
      case "sessions": {
        const sessionsRes = await goldenMondayAPI.getSessions();
        return {
          title: gt("sessionsReport", "Sessions Report"),
          date: new Date().toISOString(),
          total: sessionsRes.data.length,
          sessions: sessionsRes.data,
        };
      }
      case "gallery": {
        const galleryRes = await goldenMondayAPI.getGallery({ limit: 1000 });
        return {
          title: gt("galleryReport", "Gallery Report"),
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

      // Use LANDSCAPE orientation for more width
      const doc = new jsPDF("l", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(26, 58, 173);
      doc.text(data.title || gt("reportTitle", "Report"), pageWidth / 2, 20, {
        align: "center",
      });

      // Subtitle / Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${ct("generated", "Generated")}: ${new Date(data.date).toLocaleString()}`,
        pageWidth / 2,
        28,
        { align: "center" },
      );

      let yPos = 35;

      // Attendance Report
      if (data.attendance) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(gt("attendanceReport", "Attendance Report"), 14, yPos);
        yPos += 6;

        const total = data.attendance.length;
        const present = data.attendance.filter((a) => a.attended).length;
        const absentCount = total - present;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        // Summary table with proper data
        const summaryData = [
          [ct("metric", "Metric"), ct("value", "Value")],
          [ct("total", "Total"), total],
          [gt("present", "Present"), present],
          [gt("absent", "Absent"), absentCount],
          [gt("attendanceRate", "Attendance Rate"), `${rate}%`],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [summaryData[0]],
          body: summaryData.slice(1),
          theme: "striped",
          headStyles: { fillColor: [26, 58, 173] },
        });

        yPos = doc.lastAutoTable.finalY + 8;

        // Detailed Attendance Table with Signature Images
        doc.setFontSize(12);
        doc.text(gt("detailedAttendance", "Detailed Attendance"), 14, yPos);
        yPos += 6;

        // Filter attendance
        const presentWithSignatures = data.attendance.filter(
          (a) => a.attended && a.signature && a.signature.length > 100,
        );
        const presentWithoutSignature = data.attendance.filter(
          (a) => a.attended && (!a.signature || a.signature.length <= 100),
        );
        const absentEmployees = data.attendance.filter((a) => !a.attended);

        // Combine: present with signatures first, then present without, then absent
        const sortedAttendance = [
          ...presentWithSignatures,
          ...presentWithoutSignature,
          ...absentEmployees,
        ];

        // Check if any attendance has signatures
        const hasSignatures = presentWithSignatures.length > 0;

        // Table headers - shorter names to save space
        const headers = [
          ct("name", "Name"),
          ct("dept", "Dept"),
          ct("email", "Email"),
          ct("status", "Status"),
          gt("sig", "Sig"),
        ];

        // Column widths - proportioned to fill the full landscape page width
        // (297mm page - 14mm margin each side = 269mm usable)
        const colWidths = [45, 35, 90, 40, 25];

        // Row height for signatures
        const signatureRowHeight = hasSignatures ? 9 : 7;

        // Build table data
        const tableData = sortedAttendance.map((a) => {
          const status = a.attended
            ? `✅ ${gt("present", "Present")}`
            : `❌ ${gt("absent", "Absent")}`;

          // For present with signature, we'll add a placeholder that will be replaced with image
          if (a.attended && a.signature && a.signature.length > 100) {
            return [
              a.name || ct("unknown", "Unknown"),
              a.department || ct("na", "N/A"),
              a.email || ct("na", "N/A"),
              status,
              { content: "signature", signature: a.signature },
            ];
          } else {
            return [
              a.name || ct("unknown", "Unknown"),
              a.department || ct("na", "N/A"),
              a.email || ct("na", "N/A"),
              status,
              a.attended ? "✗" : "—",
            ];
          }
        });

        // Generate the table with autoTable
        autoTable(doc, {
          startY: yPos,
          head: [headers],
          body: tableData.map((row) =>
            row.map((cell) =>
              typeof cell === "object" && cell.content === "signature"
                ? {
                    content: " ",
                    signature: cell.signature,
                    styles: { cellWidth: colWidths[4] },
                  }
                : cell,
            ),
          ),
          theme: "striped",
          headStyles: { fillColor: [26, 58, 173] },
          styles: { fontSize: 9, cellPadding: 3 },
          tableWidth: pageWidth - 28,
          margin: { left: 14, right: 14 },
          // columnStyles: {
          //   0: { cellWidth: colWidths[0] },
          //   1: { cellWidth: colWidths[1] },
          //   2: { cellWidth: colWidths[2] },
          //   3: { cellWidth: colWidths[3] },
          //   4: { cellWidth: colWidths[4] },
          // },
          columnStyles: {
            // Columns 0-3 left as 'auto' (the default) so they scale up and
            // fill the remaining table width, same as the summary table above —
            // that's what was making this table stop short of the page edge.
            4: { cellWidth: colWidths[4] }, // signature column stays fixed —
            // didParseCell/didDrawCell size the signature image off this exact
            // value, so it can't be left to auto-size.
          },
          rowHeight: signatureRowHeight,
          didParseCell: function (data) {
            const rowData = data.row.raw;
            if (rowData && Array.isArray(rowData) && data.column.index === 4) {
              const cellData = rowData[4];
              if (typeof cellData === "object" && cellData.signature) {
                data.cell.styles = {
                  cellWidth: colWidths[4],
                  minCellHeight: 7,
                };
              }
            }
          },
          didDrawCell: function (data) {
            // Draw signature image in the signature column
            if (data.column.index === 4) {
              const rowData = data.row.raw;
              if (rowData && Array.isArray(rowData)) {
                const cellData = rowData[4];
                if (
                  typeof cellData === "object" &&
                  cellData.signature &&
                  cellData.signature.length > 100
                ) {
                  try {
                    const width = Math.min(data.cell.width - 2, 12);
                    const height = Math.min(data.cell.height - 2, 5);
                    const offsetX = (data.cell.width - width) / 2;
                    const offsetY = (data.cell.height - height) / 2;
                    doc.addImage(
                      cellData.signature,
                      "PNG",
                      data.cell.x + offsetX,
                      data.cell.y + offsetY,
                      width,
                      height,
                    );
                  } catch (imgError) {
                    console.warn("Could not add signature image:", imgError);
                    doc.setFontSize(6);
                    doc.setTextColor(26, 58, 173);
                    doc.text("✓", data.cell.x + 4, data.cell.y + 5);
                  }
                }
              }
            }
          },
        });

        yPos = doc.lastAutoTable.finalY + 8;
      }

      // Sessions Report
      if (data.sessions) {
        yPos = doc.lastAutoTable?.finalY + 8 || 35;
        doc.setFontSize(12);
        doc.text(gt("sessionsReport", "Sessions Report"), 14, yPos);
        yPos += 6;

        const sessionData = data.sessions.map((s) => [
          s.presentationTitle || s.title || gt("untitled", "Untitled"),
          new Date(s.date).toLocaleDateString(),
          s.presenterName || ct("na", "N/A"),
          s.averageRating ? `${s.averageRating.toFixed(1)} ★` : ct("na", "N/A"),
          s.status || ct("unknown", "Unknown"),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [
            [
              ct("title", "Title"),
              ct("date", "Date"),
              gt("presenter", "Presenter"),
              ct("rating", "Rating"),
              ct("status", "Status"),
            ],
          ],
          body: sessionData,
          theme: "striped",
          headStyles: { fillColor: [26, 58, 173] },
          styles: { fontSize: 6 },
        });
      }

      // Gallery Report
      if (data.photos) {
        yPos = doc.lastAutoTable?.finalY + 8 || 35;
        doc.setFontSize(12);
        doc.text(gt("galleryReport", "Gallery Report"), 14, yPos);
        yPos += 6;

        const galleryData = data.photos.map((p) => [
          p.title || gt("untitled", "Untitled"),
          p.category || gt("other", "Other"),
          new Date(p.createdAt).toLocaleDateString(),
          p.uploadedByName || ct("unknown", "Unknown"),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [
            [
              ct("title", "Title"),
              gt("category", "Category"),
              ct("date", "Date"),
              gt("uploadedBy", "Uploaded By"),
            ],
          ],
          body: galleryData,
          theme: "striped",
          headStyles: { fillColor: [26, 58, 173] },
          styles: { fontSize: 6 },
        });
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `${ct("page", "Page")} ${i} ${ct("of", "of")} ${pageCount}`,
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

      // Attendance data
      if (data.attendance) {
        const attendanceRows = [
          [
            ct("name", "Name"),
            ct("department", "Department"),
            ct("email", "Email"),
            gt("attended", "Attended"),
            gt("signatureStatus", "Signature Status"),
            gt("checkedInAt", "Checked In At"),
            ct("feedback", "Feedback"),
            ct("rating", "Rating"),
          ],
        ];
        data.attendance.forEach((a) => {
          attendanceRows.push([
            a.name || ct("unknown", "Unknown"),
            a.department || ct("na", "N/A"),
            a.email || ct("na", "N/A"),
            a.attended ? gt("present", "Present") : gt("absent", "Absent"),
            a.signature && a.signature.length > 100
              ? gt("signed", "Signed")
              : gt("notSigned", "Not Signed"),
            a.checkedInAt
              ? new Date(a.checkedInAt).toLocaleString()
              : ct("na", "N/A"),
            a.feedback || "",
            a.rating || ct("na", "N/A"),
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(attendanceRows);
        XLSX.utils.book_append_sheet(
          wb,
          ws,
          gt("attendanceReport", "Attendance"),
        );

        // Stats sheet
        const total = data.attendance.length;
        const present = data.attendance.filter((a) => a.attended).length;
        const absentCount = total - present;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        const statsRows = [
          [ct("metric", "Metric"), ct("value", "Value")],
          [ct("total", "Total"), total],
          [gt("present", "Present"), present],
          [gt("absent", "Absent"), absentCount],
          [gt("attendanceRate", "Attendance Rate"), `${rate}%`],
        ];
        const statsWs = XLSX.utils.aoa_to_sheet(statsRows);
        XLSX.utils.book_append_sheet(wb, statsWs, "Stats");
      }

      // Sessions data
      if (data.sessions) {
        const sessionRows = [
          [
            ct("title", "Title"),
            ct("date", "Date"),
            gt("presenter", "Presenter"),
            ct("rating", "Rating"),
            ct("status", "Status"),
            gt("attendees", "Attendees"),
          ],
        ];
        data.sessions.forEach((s) => {
          sessionRows.push([
            s.presentationTitle || s.title || gt("untitled", "Untitled"),
            new Date(s.date).toLocaleDateString(),
            s.presenterName || ct("na", "N/A"),
            s.averageRating
              ? `${s.averageRating.toFixed(1)} ★`
              : ct("na", "N/A"),
            s.status || ct("unknown", "Unknown"),
            s.attendees?.length || 0,
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sessionRows);
        XLSX.utils.book_append_sheet(wb, ws, gt("sessionsReport", "Sessions"));
      }

      // Gallery data
      if (data.photos) {
        const galleryRows = [
          [
            ct("title", "Title"),
            gt("category", "Category"),
            ct("date", "Date"),
            gt("uploadedBy", "Uploaded By"),
            gt("url", "URL"),
          ],
        ];
        data.photos.forEach((p) => {
          galleryRows.push([
            p.title || gt("untitled", "Untitled"),
            p.category || gt("other", "Other"),
            new Date(p.createdAt).toLocaleDateString(),
            p.uploadedByName || ct("unknown", "Unknown"),
            p.url || "",
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(galleryRows);
        XLSX.utils.book_append_sheet(wb, ws, gt("galleryReport", "Gallery"));
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
          <title>${data.title || gt("reportTitle", "Report")}</title>
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
            .signature-img { max-width: 80px; max-height: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.title || gt("reportTitle", "Report")}</h1>
            <p><strong>${ct("generated", "Generated")}:</strong> ${new Date(data.date).toLocaleString()}</p>
            <p><strong>${gt("reportType", "Report Type")}:</strong> ${reportType}</p>
          </div>
      `;

      // Attendance section
      if (data.attendance) {
        const total = data.attendance.length;
        const present = data.attendance.filter((a) => a.attended).length;
        const absentCount = total - present;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        htmlContent += `
          <h2>📊 ${gt("attendanceReport", "Attendance Report")}</h2>
          <div class="summary-box">
            <table>
              <tr><td><strong>${ct("total", "Total")}:</strong></td><td>${total}</td></tr>
              <tr><td><strong>${gt("present", "Present")}:</strong></td><td>${present}</td></tr>
              <tr><td><strong>${gt("absent", "Absent")}:</strong></td><td>${absentCount}</td></tr>
              <tr><td><strong>${gt("attendanceRate", "Attendance Rate")}:</strong></td><td>${rate}%</td></tr>
            </table>
          </div>

          <h2>📋 ${gt("detailedAttendance", "Detailed Attendance")}</h2>
          <table>
            <tr>
              <th>${ct("name", "Name")}</th>
              <th>${ct("department", "Department")}</th>
              <th>${ct("email", "Email")}</th>
              <th>${ct("status", "Status")}</th>
              <th>${gt("signature", "Signature")}</th>
              <th>${gt("checkedIn", "Checked In")}</th>
            </tr>
        `;

        data.attendance.forEach((a) => {
          const statusClass = a.attended ? "badge-present" : "badge-absent";
          const statusText = a.attended
            ? `✅ ${gt("present", "Present")}`
            : `❌ ${gt("absent", "Absent")}`;

          // Signature column: show image if exists, otherwise text
          const signatureHtml =
            a.attended && a.signature && a.signature.length > 100
              ? `<img src="${a.signature}" class="signature-img" alt="Signature" />`
              : a.attended && !a.signature
                ? "✗ Not signed"
                : "—";

          htmlContent += `
            <tr>
              <td>${a.name || ct("unknown", "Unknown")}</td>
              <td>${a.department || ct("na", "N/A")}</td>
              <td>${a.email || ct("na", "N/A")}</td>
              <td class="${statusClass}">${statusText}</td>
              <td>${signatureHtml}</td>
              <td>${a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : ct("na", "N/A")}</td>
            </tr>
          `;
        });

        htmlContent += `</table>`;
      }

      // Sessions section
      if (data.sessions) {
        htmlContent += `
          <h2>📅 ${gt("sessionsReport", "Sessions Report")}</h2>
          <table>
            <tr>
              <th>${ct("title", "Title")}</th>
              <th>${ct("date", "Date")}</th>
              <th>${gt("presenter", "Presenter")}</th>
              <th>${ct("rating", "Rating")}</th>
              <th>${ct("status", "Status")}</th>
            </tr>
        `;

        data.sessions.forEach((s) => {
          htmlContent += `
            <tr>
              <td>${s.presentationTitle || s.title || gt("untitled", "Untitled")}</td>
              <td>${new Date(s.date).toLocaleDateString()}</td>
              <td>${s.presenterName || ct("na", "N/A")}</td>
              <td>${s.averageRating ? `${s.averageRating.toFixed(1)} ★` : ct("na", "N/A")}</td>
              <td>${s.status || ct("unknown", "Unknown")}</td>
            </tr>
          `;
        });

        htmlContent += `</table>`;
      }

      // Gallery section
      if (data.photos) {
        htmlContent += `
          <h2>🖼️ ${gt("galleryReport", "Gallery Report")}</h2>
          <table>
            <tr>
              <th>${ct("title", "Title")}</th>
              <th>${gt("category", "Category")}</th>
              <th>${ct("date", "Date")}</th>
              <th>${gt("uploadedBy", "Uploaded By")}</th>
            </tr>
        `;

        data.photos.forEach((p) => {
          htmlContent += `
            <tr>
              <td>${p.title || gt("untitled", "Untitled")}</td>
              <td>${p.category || gt("other", "Other")}</td>
              <td>${new Date(p.createdAt).toLocaleDateString()}</td>
              <td>${p.uploadedByName || ct("unknown", "Unknown")}</td>
            </tr>
          `;
        });

        htmlContent += `</table>`;
      }

      htmlContent += `
          <div class="footer">
            <p>${gt("footerText", "Generated by Addis MESOB Golden Monday System")} • ${new Date().toLocaleString()}</p>
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
          `${gt("exportSuccess", "Report exported successfully!")} (${exportFormat.toUpperCase()})`,
          "success",
        );
      }
    } catch (error) {
      console.error("Export failed:", error);
      showToast(
        `${gt("exportError", "Failed to export report")} (${exportFormat.toUpperCase()})`,
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
            aria-label={gt("startDate", "Start date")}
          />
          <span style={{ color: C.muted }}>{ct("to", "to")}</span>
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
            aria-label={gt("endDate", "End date")}
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
          aria-label={gt("exportReport", "Export Report")}
        >
          {exporting ? (
            <>
              <FiLoader
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
              {gt("exporting", "Exporting...")}
            </>
          ) : (
            <>
              <FiDownload size={16} />
              {gt("exportReport", "Export Report")}
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
