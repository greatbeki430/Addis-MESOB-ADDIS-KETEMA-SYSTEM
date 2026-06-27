import { exportForumReportToPDF } from "../utils/pdfExport";
import { FiDownload } from "react-icons/fi";

// Simple export button component
const ExportButton = ({ formData, t, meetingNumber }) => {
  return (
    <button
      onClick={() => exportForumReportToPDF(formData, t, meetingNumber)}
      style={{
        background: "#dc2626",
        color: "#fff",
        border: "none",
        padding: "11px 20px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginRight: 12,
      }}
    >
      <FiDownload size={16} />
      {t.forum?.exportPDF || "Export PDF"}
    </button>
  );
};

export default ExportButton;
