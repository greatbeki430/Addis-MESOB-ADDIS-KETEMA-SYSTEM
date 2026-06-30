// frontend/src/pages/documents/DocumentUpload.jsx
// Upload form for CRRSA Document Vault with drag-and-drop and AI metadata extraction

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
// import { uploadDocument } from "../../services/aiApi";
import { documentAPI } from "../../services/api";
const uploadDocument = (data) => documentAPI.upload(data);

const DOCUMENT_TYPES = [
  { value: "birth_certificate", label: "Birth Certificate / የልደት ምስክር ወረቀት" },
  { value: "death_certificate", label: "Death Certificate / የሞት ምስክር ወረቀት" },
  {
    value: "marriage_certificate",
    label: "Marriage Certificate / የጋብቻ ምስክር ወረቀት",
  },
  {
    value: "divorce_certificate",
    label: "Divorce Certificate / የፍቺ ምስክር ወረቀት",
  },
  { value: "residence_id", label: "Residence ID / የኑሮ መታወቂያ" },
  { value: "name_change", label: "Name Change / የስም ለውጥ" },
  { value: "registration_book", label: "Registration Book / የምዝገባ መዝገብ" },
  { value: "circular", label: "Circular / ክብ ደብዳቤ" },
  { value: "directive", label: "Directive / መመሪያ" },
  { value: "correspondence", label: "Correspondence / ደብዳቤ" },
  { value: "application_form", label: "Application Form / ማመልከቻ ቅጽ" },
  { value: "other", label: "Other / ሌሎች" },
];

const inputStyle = {
  width: "100%",
  border: "1px solid #CBD5E1",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "4px",
};

export default function DocumentUpload({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    documentType: "",
    title: "",
    citizenName: "",
    citizenNameAmharic: "",
    issueDate: "",
    issuingOfficer: "",
    issuingDepartment: "Civil Registry",
    nationalId: "",
    tags: "",
    notes: "",
    accessLevel: "admin",
    retentionPolicy: "lifetime",
  });
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = () => setFileBase64(reader.result);
    reader.readAsDataURL(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/tiff": [".tiff"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!fileBase64) return setError("Please select a file to upload.");
    if (!form.documentType) return setError("Please select a document type.");
    if (!form.title.trim()) return setError("Please enter a document title.");

    setIsUploading(true);
    setError("");

    try {
      const res = await uploadDocument({ file: fileBase64, ...form });
      setSuccess(res.data);
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          width: "440px",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
        <h3 style={{ fontWeight: 700, color: "#0F172A" }}>
          Document Uploaded!
        </h3>
        <p style={{ color: "#64748B", fontSize: "13px" }}>
          Reference: <strong>{success.document?.referenceNumber}</strong>
        </p>
        {success.document?.aiExtractedData?.summary && (
          <div
            style={{
              background: "#EFF6FF",
              borderRadius: "8px",
              padding: "12px",
              marginTop: "12px",
              fontSize: "13px",
              color: "#1D4ED8",
              textAlign: "left",
            }}
          >
            <strong>✨ AI Extracted:</strong>
            <br />
            {success.document.aiExtractedData.summary}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "28px",
        width: "500px",
        maxWidth: "95vw",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
          📤 Upload CRRSA Document
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#64748B",
          }}
        >
          ✕
        </button>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "#2563EB" : file ? "#22C55E" : "#CBD5E1"}`,
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          cursor: "pointer",
          background: isDragActive ? "#EFF6FF" : file ? "#F0FDF4" : "#F8FAFC",
          marginBottom: "20px",
          transition: "all 0.2s",
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>
          {file ? "✅" : isDragActive ? "📂" : "📁"}
        </div>
        <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
          {file
            ? `${file.name} (${(file.size / 1024).toFixed(0)}KB)`
            : isDragActive
              ? "Drop the file here..."
              : "Drag and drop PDF, JPG, PNG, or TIFF — or click to browse"}
        </p>
        <p style={{ fontSize: "11px", color: "#94A3B8", margin: "4px 0 0" }}>
          Max 20MB
        </p>
      </div>

      {/* Form fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={labelStyle}>Document Type *</label>
          <select
            value={form.documentType}
            onChange={handleChange("documentType")}
            style={inputStyle}
          >
            <option value="">Select type...</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Title *</label>
          <input
            value={form.title}
            onChange={handleChange("title")}
            placeholder="e.g. Birth Certificate – Abebe Kebede"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Citizen Name (English)</label>
            <input
              value={form.citizenName}
              onChange={handleChange("citizenName")}
              placeholder="Full name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>ስም (አማርኛ)</label>
            <input
              value={form.citizenNameAmharic}
              onChange={handleChange("citizenNameAmharic")}
              placeholder="ሙሉ ስም"
              style={inputStyle}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Issue Date</label>
            <input
              type="date"
              value={form.issueDate}
              onChange={handleChange("issueDate")}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Issuing Officer</label>
            <input
              value={form.issuingOfficer}
              onChange={handleChange("issuingOfficer")}
              placeholder="Officer name"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>National ID (optional)</label>
          <input
            value={form.nationalId}
            onChange={handleChange("nationalId")}
            placeholder="Citizen ID number"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={handleChange("tags")}
            placeholder="e.g. 2016, Arada, urgent"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={form.notes}
            onChange={handleChange("notes")}
            placeholder="Internal notes..."
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={labelStyle}>Access Level</label>
            <select
              value={form.accessLevel}
              onChange={handleChange("accessLevel")}
              style={inputStyle}
            >
              <option value="employee">Employee</option>
              <option value="leader">Leader & above</option>
              <option value="admin">Admin only</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Retention Policy</label>
            <select
              value={form.retentionPolicy}
              onChange={handleChange("retentionPolicy")}
              style={inputStyle}
            >
              <option value="lifetime">Lifetime ♾</option>
              <option value="10_years">10 Years</option>
              <option value="5_years">5 Years</option>
            </select>
          </div>
        </div>

        {error && (
          <p style={{ color: "#DC2626", fontSize: "13px", margin: 0 }}>
            ⚠ {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isUploading}
          style={{
            background: isUploading ? "#93C5FD" : "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isUploading ? "default" : "pointer",
            marginTop: "4px",
          }}
        >
          {isUploading ? "Uploading… Please wait" : "📤 Upload Document"}
        </button>
      </div>
    </div>
  );
}
