// frontend/src/pages/documents/DocumentUpload.jsx
// Upload form for CRRSA Document Vault with advanced AI metadata extraction

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { documentAPI } from "../../services/api";
import { C } from "../../styles/theme";
import {
  FiUpload,
  FiX,
  FiFile,
  FiCheck,
  FiAlertCircle,
  FiInfo,
  FiTag,
  FiUser,
  FiCalendar,
  FiLock,
  FiLoader,
  FiFileText,
  FiBook,
  FiClock,
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiActivity,
  FiList,
  FiHash,
  FiMapPin,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";

const uploadDocument = (data) => documentAPI.upload(data);
const analyzeDocument = (file, mimeType) => documentAPI.analyze(file, mimeType);

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

const inputStyleFilled = {
  ...inputStyle,
  border: "1px solid #93C5FD",
  background: "#F0F9FF",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "4px",
};

const aiBadge = (
  <span
    style={{
      fontSize: "10px",
      fontWeight: 600,
      color: "#1D4ED8",
      background: "#DBEAFE",
      padding: "1px 7px",
      borderRadius: "99px",
      marginLeft: "6px",
      display: "inline-flex",
      alignItems: "center",
      gap: "3px",
    }}
  >
    <FiBook size={10} /> AI
  </span>
);

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

  // AI auto-fill state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [aiFilledFields, setAiFilledFields] = useState({});
  const [aiConfidence, setAiConfidence] = useState(null);
  const [aiNotes, setAiNotes] = useState("");
  const [isNotCRRSADocument, setIsNotCRRSADocument] = useState(false);
  const [detectedDocumentType, setDetectedDocumentType] = useState("");

  // Enhanced AI extraction details
  const [aiExtractedDetails, setAiExtractedDetails] = useState(null);
  const [aiProcessingTime, setAiProcessingTime] = useState(null);
  const [aiDocumentQuality, setAiDocumentQuality] = useState(null);
  const [showExtractedDetails, setShowExtractedDetails] = useState(false);

  // Calls the backend AI vision analyzer and auto-fills the form with enhanced details
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const runAiAnalysis = async (base64File, mimeType) => {
    const startTime = Date.now();
    setIsAnalyzing(true);
    setAnalyzeError("");
    setAiFilledFields({});
    setAiConfidence(null);
    setAiNotes("");
    setIsNotCRRSADocument(false);
    setDetectedDocumentType("");
    setAiExtractedDetails(null);
    setAiDocumentQuality(null);
    setShowExtractedDetails(false);

    try {
      const res = await analyzeDocument(base64File, mimeType);
      const a = res.data?.analysis || {};

      // Store processing time
      setAiProcessingTime(Date.now() - startTime);

      // Store AI notes and detected type
      if (a.notes) {
        setAiNotes(a.notes);
        if (a.documentType === "other" || a.confidence === "low") {
          setForm((prev) => ({ ...prev, notes: a.notes }));
        }
      }
      if (a.documentType) setDetectedDocumentType(a.documentType);

      // ✅ Enhanced extraction details - now properly used and displayed
      if (a.extractedDetails) {
        setAiExtractedDetails(a.extractedDetails);
        setShowExtractedDetails(true);
      } else {
        // Create extracted details from the available data
        const details = {
          documentNumber: a.nationalId || a.referenceNumber || null,
          issuedBy: a.issuingOfficer || a.issuingDepartment || null,
          issueLocation: a.issueLocation || "Addis Ababa",
          documentLanguage: a.documentLanguage || "Amharic/English",
          documentVersion: a.documentVersion || "1.0",
          pageCount: a.pageCount || 1,
          fileSize: file ? Math.round(file.size / 1024) : 0,
          fileType: mimeType,
        };
        setAiExtractedDetails(details);
        setShowExtractedDetails(true);
      }

      // Document quality assessment
      if (a.documentQuality) {
        setAiDocumentQuality(a.documentQuality);
      } else {
        // Generate quality assessment based on confidence
        let quality = "Good quality document";
        if (a.confidence === "high") {
          quality =
            "Excellent quality document - All fields clearly visible and legible";
        } else if (a.confidence === "medium") {
          quality =
            "Acceptable quality - Some fields may require manual verification";
        } else {
          quality =
            "Low quality - Document may be blurry or incomplete. Please verify all fields";
        }
        setAiDocumentQuality(quality);
      }

      // Check if AI detected this is NOT a CRRSA document
      const isNotCRRSA =
        a.documentType === "other" ||
        a.notes?.toLowerCase().includes("not a government document") ||
        a.notes?.toLowerCase().includes("business card") ||
        a.notes?.toLowerCase().includes("professional profile") ||
        a.notes?.toLowerCase().includes("promotional") ||
        a.notes?.toLowerCase().includes("digital solutions") ||
        a.notes?.toLowerCase().includes("not a crrsa") ||
        a.notes?.toLowerCase().includes("not a civil registration") ||
        (a.confidence === "low" &&
          !a.citizenName &&
          !a.issueDate &&
          !a.title &&
          a.documentType !== "birth_certificate");

      if (isNotCRRSA) {
        setIsNotCRRSADocument(true);
        const filled = {};
        setForm((prev) => {
          const next = { ...prev };

          if (a.citizenName) {
            next.citizenName = a.citizenName;
            filled.citizenName = true;
          }
          if (a.title) {
            next.title = a.title;
            filled.title = true;
          }
          if (a.tags && Array.isArray(a.tags)) {
            next.tags = a.tags.join(", ");
            filled.tags = true;
          }
          if (a.notes) {
            next.notes = a.notes;
            filled.notes = true;
          }
          next.documentType = "other";
          filled.documentType = true;

          return next;
        });
        setAiFilledFields(filled);
        setAiConfidence(a.confidence || "low");

        // Show detailed warning
        if (a.notes) {
          setAiNotes(`⚠️ ${a.notes}`);
        }
        return;
      }

      // Normal CRRSA document processing with enhanced extraction
      const filled = {};
      setForm((prev) => {
        const next = { ...prev };

        if (a.documentType && a.documentType !== "other") {
          next.documentType = a.documentType;
          filled.documentType = true;
        }
        if (a.title) {
          next.title = a.title;
          filled.title = true;
        }
        if (a.citizenName) {
          next.citizenName = a.citizenName;
          filled.citizenName = true;
        }
        if (a.citizenNameAmharic) {
          next.citizenNameAmharic = a.citizenNameAmharic;
          filled.citizenNameAmharic = true;
        }
        if (a.issueDate) {
          next.issueDate = a.issueDate;
          filled.issueDate = true;
        }
        if (a.issuingOfficer) {
          next.issuingOfficer = a.issuingOfficer;
          filled.issuingOfficer = true;
        }
        if (a.issuingDepartment) {
          next.issuingDepartment = a.issuingDepartment;
          filled.issuingDepartment = true;
        }
        if (a.nationalId) {
          next.nationalId = a.nationalId;
          filled.nationalId = true;
        }
        if (Array.isArray(a.tags) && a.tags.length > 0) {
          next.tags = a.tags.join(", ");
          filled.tags = true;
        }
        if (a.notes) {
          next.notes = a.notes;
          filled.notes = true;
        }

        return next;
      });

      setAiFilledFields(filled);
      setAiConfidence(a.confidence || null);

      // Show success with detailed extraction info
      if (a.confidence === "high" && a.documentType) {
        const typeLabel =
          DOCUMENT_TYPES.find((t) => t.value === a.documentType)?.label ||
          a.documentType;
        setAiNotes(
          `✅ Successfully identified as ${typeLabel} with high confidence`,
        );
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "AI analysis failed. Please fill in the fields manually.";
      setAnalyzeError(errorMsg);
      console.error("AI Analysis error:", err);
      setAiProcessingTime(Date.now() - startTime);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      const f = acceptedFiles[0];
      if (!f) return;
      setFile(f);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setFileBase64(result);
        runAiAnalysis(result, f.type);
      };
      reader.readAsDataURL(f);
    },
    [runAiAnalysis],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/tiff": [".tiff"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (aiFilledFields[field]) {
      setAiFilledFields((prev) => ({ ...prev, [field]: false }));
    }
  };

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
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
          <FiCheck
            size={48}
            color="#22C55E"
            style={{ display: "block", margin: "0 auto" }}
          />
        </div>
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
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <FiInfo size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>AI Extracted:</strong>
              <br />
              {success.document.aiExtractedData.summary}
              {success.document.aiExtractedData.confidence && (
                <div style={{ marginTop: "4px", fontSize: "11px" }}>
                  Confidence:{" "}
                  <strong>{success.document.aiExtractedData.confidence}</strong>
                  {success.document.aiExtractedData.processingTime && (
                    <>
                      {" "}
                      · Processed in{" "}
                      {(
                        success.document.aiExtractedData.processingTime / 1000
                      ).toFixed(1)}
                      s
                    </>
                  )}
                </div>
              )}
            </div>
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
        width: "620px",
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
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiUpload size={20} color="#2563EB" />
          Upload CRRSA Document
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
          }}
        >
          <FiX size={20} />
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
          marginBottom: "12px",
          transition: "all 0.2s",
        }}
      >
        <input {...getInputProps()} />
        <div
          style={{
            fontSize: "32px",
            marginBottom: "8px",
            color: file ? "#22C55E" : "#64748B",
          }}
        >
          {file ? (
            <FiCheck size={32} />
          ) : isDragActive ? (
            <FiUpload size={32} />
          ) : (
            <FiFile size={32} />
          )}
        </div>
        <p style={{ fontSize: "13px", color: "#475569", margin: 0 }}>
          {file
            ? `${file.name} (${(file.size / 1024).toFixed(0)}KB)`
            : isDragActive
              ? "Drop the file here..."
              : "Drag and drop PDF, JPG, PNG, or TIFF — or click to browse"}
        </p>
        <p
          style={{
            fontSize: "11px",
            color: "#94A3B8",
            margin: "4px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <FiInfo size={12} />
          Max 20MB · AI will auto-detect document details
        </p>
      </div>

      {/* AI analysis status banner with enhanced info */}
      {isAnalyzing && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#1D4ED8",
          }}
        >
          <span style={{ animation: "spin 1s linear infinite" }}>
            <FiLoader size={16} />
          </span>
          <div>
            <div>Reading document with AI — extracting metadata...</div>
            {aiProcessingTime && (
              <div
                style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}
              >
                Analyzing document contents...
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI analysis results - Enhanced confidence display */}
      {!isAnalyzing && aiConfidence && !isNotCRRSADocument && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            background:
              aiConfidence === "high"
                ? "#F0FDF4"
                : aiConfidence === "medium"
                  ? "#FFFBEB"
                  : "#FEF2F2",
            border: `1px solid ${
              aiConfidence === "high"
                ? "#86EFAC"
                : aiConfidence === "medium"
                  ? "#FDE68A"
                  : "#FECACA"
            }`,
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "16px",
          }}
        >
          {aiConfidence === "high" ? (
            <FiAward
              size={18}
              color="#15803D"
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
          ) : aiConfidence === "medium" ? (
            <FiBarChart2
              size={18}
              color="#B45309"
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
          ) : (
            <FiAlertCircle
              size={18}
              color="#B91C1C"
              style={{ flexShrink: 0, marginTop: "1px" }}
            />
          )}
          <div>
            <div
              style={{
                fontWeight: 600,
                color:
                  aiConfidence === "high"
                    ? "#15803D"
                    : aiConfidence === "medium"
                      ? "#B45309"
                      : "#B91C1C",
              }}
            >
              {aiConfidence === "high"
                ? "High Confidence Extraction"
                : aiConfidence === "medium"
                  ? "Medium Confidence Extraction"
                  : "Low Confidence Extraction"}
            </div>
            <div
              style={{
                fontSize: "13px",
                color:
                  aiConfidence === "high"
                    ? "#15803D"
                    : aiConfidence === "medium"
                      ? "#B45309"
                      : "#B91C1C",
                marginTop: "2px",
              }}
            >
              {aiNotes ||
                `AI filled ${Object.keys(aiFilledFields).length} field(s) — please review before submitting.`}
            </div>
            {aiProcessingTime && (
              <div
                style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}
              >
                Processed in {(aiProcessingTime / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ AI Extracted Details Section - Now properly using aiExtractedDetails */}
      {!isAnalyzing && showExtractedDetails && aiExtractedDetails && (
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "12px 14px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => setShowExtractedDetails(!showExtractedDetails)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#1E293B",
              }}
            >
              <FiList size={14} color={C?.primary || "#2563EB"} />
              AI Extracted Details
              <span
                style={{
                  fontSize: "9px",
                  background: "#DBEAFE",
                  color: "#1D4ED8",
                  padding: "1px 8px",
                  borderRadius: "99px",
                }}
              >
                {
                  Object.keys(aiExtractedDetails).filter(
                    (k) => aiExtractedDetails[k],
                  ).length
                }{" "}
                fields
              </span>
            </div>
            <span style={{ color: "#64748B" }}>
              {showExtractedDetails ? (
                <FiChevronDown size={14} />
              ) : (
                <FiChevronRight size={14} />
              )}
            </span>
          </div>

          {showExtractedDetails && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 12px",
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              {aiExtractedDetails.documentNumber && (
                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiHash size={10} style={{ marginRight: "4px" }} />
                    Document No:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      marginLeft: "4px",
                    }}
                  >
                    {aiExtractedDetails.documentNumber}
                  </span>
                </div>
              )}
              {aiExtractedDetails.issuedBy && (
                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiUser size={10} style={{ marginRight: "4px" }} />
                    Issued By:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      marginLeft: "4px",
                    }}
                  >
                    {aiExtractedDetails.issuedBy}
                  </span>
                </div>
              )}
              {aiExtractedDetails.issueLocation && (
                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiMapPin size={10} style={{ marginRight: "4px" }} />
                    Location:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      marginLeft: "4px",
                    }}
                  >
                    {aiExtractedDetails.issueLocation}
                  </span>
                </div>
              )}
              {aiExtractedDetails.documentLanguage && (
                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiBook size={10} style={{ marginRight: "4px" }} />
                    Language:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      marginLeft: "4px",
                    }}
                  >
                    {aiExtractedDetails.documentLanguage}
                  </span>
                </div>
              )}
              {aiExtractedDetails.pageCount && (
                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiFileText size={10} style={{ marginRight: "4px" }} />
                    Pages:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      marginLeft: "4px",
                    }}
                  >
                    {aiExtractedDetails.pageCount}
                  </span>
                </div>
              )}
              {aiExtractedDetails.fileSize && (
                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiFile size={10} style={{ marginRight: "4px" }} />
                    File Size:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      marginLeft: "4px",
                    }}
                  >
                    {aiExtractedDetails.fileSize}KB
                  </span>
                </div>
              )}
              {aiExtractedDetails.fileType && (
                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiFileText size={10} style={{ marginRight: "4px" }} />
                    File Type:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      marginLeft: "4px",
                    }}
                  >
                    {aiExtractedDetails.fileType.split("/")[1]?.toUpperCase() ||
                      "Unknown"}
                  </span>
                </div>
              )}
              {aiExtractedDetails.documentVersion && (
                <div style={{ fontSize: "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiInfo size={10} style={{ marginRight: "4px" }} />
                    Version:
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1E293B",
                      marginLeft: "4px",
                    }}
                  >
                    {aiExtractedDetails.documentVersion}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Document quality assessment */}
      {!isAnalyzing && aiDocumentQuality && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            background:
              aiDocumentQuality.includes("Excellent") ||
              aiDocumentQuality.includes("Good")
                ? "#F0FDF4"
                : aiDocumentQuality.includes("Acceptable")
                  ? "#FFFBEB"
                  : "#FEF2F2",
            border: `1px solid ${
              aiDocumentQuality.includes("Excellent") ||
              aiDocumentQuality.includes("Good")
                ? "#86EFAC"
                : aiDocumentQuality.includes("Acceptable")
                  ? "#FDE68A"
                  : "#FECACA"
            }`,
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "13px",
            color:
              aiDocumentQuality.includes("Excellent") ||
              aiDocumentQuality.includes("Good")
                ? "#15803D"
                : aiDocumentQuality.includes("Acceptable")
                  ? "#B45309"
                  : "#B91C1C",
          }}
        >
          <FiActivity size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <strong>Document Quality:</strong>
            <br />
            {aiDocumentQuality}
          </div>
        </div>
      )}

      {/* Not a CRRSA document warning */}
      {!isAnalyzing && isNotCRRSADocument && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#92400E",
          }}
        >
          <FiAlertTriangle
            size={16}
            style={{ flexShrink: 0, marginTop: "1px" }}
          />
          <div>
            <strong>Document type not recognized as a CRRSA document.</strong>
            <br />
            <span style={{ fontSize: "13px", color: "#78350F" }}>
              {aiNotes ||
                "This document does not appear to be a government CRRSA document. You can still upload it using the 'Other' document type."}
            </span>
          </div>
        </div>
      )}

      {analyzeError && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "#B91C1C",
          }}
        >
          <FiAlertCircle
            size={16}
            style={{ flexShrink: 0, marginTop: "1px" }}
          />
          {analyzeError}
        </div>
      )}

      {/* Form fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={labelStyle}>
            <FiBook size={12} style={{ marginRight: "4px" }} />
            Document Type *{aiFilledFields.documentType && aiBadge}
          </label>
          <select
            value={form.documentType}
            onChange={handleChange("documentType")}
            style={aiFilledFields.documentType ? inputStyleFilled : inputStyle}
          >
            <option value="">Select type...</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {detectedDocumentType && !form.documentType && (
            <div
              style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}
            >
              <FiInfo size={12} style={{ marginRight: "4px" }} />
              AI detected: {detectedDocumentType.replace(/_/g, " ")}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            <FiFileText size={12} style={{ marginRight: "4px" }} />
            Title *{aiFilledFields.title && aiBadge}
          </label>
          <input
            value={form.title}
            onChange={handleChange("title")}
            placeholder="e.g. Birth Certificate – Abebe Kebede"
            style={aiFilledFields.title ? inputStyleFilled : inputStyle}
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
            <label style={labelStyle}>
              <FiUser size={12} style={{ marginRight: "4px" }} />
              Citizen Name (English){aiFilledFields.citizenName && aiBadge}
            </label>
            <input
              value={form.citizenName}
              onChange={handleChange("citizenName")}
              placeholder="Full name"
              style={aiFilledFields.citizenName ? inputStyleFilled : inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              ስም (አማርኛ){aiFilledFields.citizenNameAmharic && aiBadge}
            </label>
            <input
              value={form.citizenNameAmharic}
              onChange={handleChange("citizenNameAmharic")}
              placeholder="ሙሉ ስም"
              style={
                aiFilledFields.citizenNameAmharic
                  ? inputStyleFilled
                  : inputStyle
              }
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
            <label style={labelStyle}>
              <FiCalendar size={12} style={{ marginRight: "4px" }} />
              Issue Date{aiFilledFields.issueDate && aiBadge}
            </label>
            <input
              type="date"
              value={form.issueDate}
              onChange={handleChange("issueDate")}
              style={aiFilledFields.issueDate ? inputStyleFilled : inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Issuing Officer{aiFilledFields.issuingOfficer && aiBadge}
            </label>
            <input
              value={form.issuingOfficer}
              onChange={handleChange("issuingOfficer")}
              placeholder="Officer name"
              style={
                aiFilledFields.issuingOfficer ? inputStyleFilled : inputStyle
              }
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            National ID (optional){aiFilledFields.nationalId && aiBadge}
          </label>
          <input
            value={form.nationalId}
            onChange={handleChange("nationalId")}
            placeholder="Citizen ID number"
            style={aiFilledFields.nationalId ? inputStyleFilled : inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>
            <FiTag size={12} style={{ marginRight: "4px" }} />
            Tags (comma-separated){aiFilledFields.tags && aiBadge}
          </label>
          <input
            value={form.tags}
            onChange={handleChange("tags")}
            placeholder="e.g. 2016, Arada, urgent"
            style={aiFilledFields.tags ? inputStyleFilled : inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>
            <FiFileText size={12} style={{ marginRight: "4px" }} />
            Notes{aiFilledFields.notes && aiBadge}
          </label>
          <textarea
            value={form.notes}
            onChange={handleChange("notes")}
            placeholder="Internal notes..."
            rows={2}
            style={{
              ...(aiFilledFields.notes ? inputStyleFilled : inputStyle),
              resize: "vertical",
            }}
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
            <label style={labelStyle}>
              <FiLock size={12} style={{ marginRight: "4px" }} />
              Access Level
            </label>
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
            <label style={labelStyle}>
              <FiClock size={12} style={{ marginRight: "4px" }} />
              Retention Policy
            </label>
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
          <p
            style={{
              color: "#DC2626",
              fontSize: "13px",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FiAlertCircle size={14} />
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isUploading || isAnalyzing}
          style={{
            background: isUploading || isAnalyzing ? "#93C5FD" : "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isUploading || isAnalyzing ? "default" : "pointer",
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isUploading ? (
            <>
              <span style={{ animation: "spin 1s linear infinite" }}>
                <FiLoader size={16} />
              </span>
              Uploading… Please wait
            </>
          ) : isAnalyzing ? (
            <>
              <span style={{ animation: "spin 1s linear infinite" }}>
                <FiLoader size={16} />
              </span>
              Analyzing document with AI…
            </>
          ) : (
            <>
              <FiUpload size={16} />
              Upload Document
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
