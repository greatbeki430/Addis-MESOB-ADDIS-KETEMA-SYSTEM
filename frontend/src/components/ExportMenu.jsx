import { useState } from "react";
import {
  exportForumReportToPDF,
  exportEvaluationReportToPDF,
  exportDailyReportToPDF,
  exportRecognitionCertificateToPDF,
  exportBiWeeklyAggregateReportToPDF,
} from "../utils/pdfExport";
import { FiDownload, FiChevronDown, FiFileText } from "react-icons/fi";

const ExportMenu = ({
  type, // 'forum', 'evaluation', 'daily', 'certificate', 'biweekly'
  data,
  t,
  teamName,
  period,
  meetingNumber,
  reportDate,
  employeeName,
  month,
  score,
  weeklyData,
  startDate,
  endDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const handleExport = (format) => {
    switch (type) {
      case "forum":
        exportForumReportToPDF(data, t, meetingNumber);
        break;
      case "evaluation":
        exportEvaluationReportToPDF(data, teamName, period, t);
        break;
      case "daily":
        exportDailyReportToPDF(data, reportDate, t);
        break;
      case "certificate":
        exportRecognitionCertificateToPDF(employeeName, month, teamName, score);
        break;
      case "biweekly":
        exportBiWeeklyAggregateReportToPDF(
          weeklyData,
          startDate,
          endDate,
          teamName,
        );
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const buttonStyle = {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  const menuStyle = {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 4,
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    overflow: "hidden",
    zIndex: 50,
    minWidth: 150,
  };

  const menuItemStyle = {
    padding: "10px 16px",
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderBottom: "1px solid #eee",
    transition: "background 0.15s",
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        style={buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
      >
        <FiDownload size={14} />
        Export Report
        <FiChevronDown size={12} />
      </button>
      {isOpen && (
        <div style={menuStyle} onMouseLeave={() => setIsOpen(false)}>
          <div
            style={menuItemStyle}
            onClick={() => handleExport("pdf")}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <FiFileText size={14} />
            PDF Format
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
