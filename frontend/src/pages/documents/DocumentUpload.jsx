// frontend/src/pages/documents/DocumentUpload.jsx
// Upload form for CRRSA Document Vault with advanced AI metadata extraction

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { documentAPI } from "../../services/api";
import { C } from "../../styles/theme";
import { useLanguage } from "../../hooks/useLanguage";
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

export default function DocumentUpload({ onSuccess, onClose }) {
  const { t } = useLanguage();

  // ✅ FIX: Wrap td in useCallback to prevent it from changing on every render
  const td = useCallback(
    (key, fallback) => t?.(`documentVault.${key}`) || fallback,
    [t],
  );

  // ✅ FIX: Wrap tc in useCallback to prevent it from changing on every render
  const tc = useCallback(
    (key, fallback) => t?.(`common.${key}`) || fallback,
    [t],
  );

  // ✅ FIX: Wrap DOCUMENT_TYPES in useMemo to prevent it from being recreated on every render
  const DOCUMENT_TYPES = useMemo(
    () => [
      {
        value: "birth_certificate",
        label: td("typeBirthCertificate", "Birth Certificate"),
      },
      {
        value: "death_certificate",
        label: td("typeDeathCertificate", "Death Certificate"),
      },
      {
        value: "marriage_certificate",
        label: td("typeMarriageCertificate", "Marriage Certificate"),
      },
      {
        value: "divorce_certificate",
        label: td("typeDivorceCertificate", "Divorce Certificate"),
      },
      { value: "residence_id", label: td("typeResidenceId", "Residence ID") },
      { value: "name_change", label: td("typeNameChange", "Name Change") },
      {
        value: "registration_book",
        label: td("typeRegistrationBook", "Registration Book"),
      },
      { value: "circular", label: td("typeCircular", "Circular") },
      { value: "directive", label: td("typeDirective", "Directive") },
      {
        value: "correspondence",
        label: td("typeCorrespondence", "Correspondence"),
      },
      {
        value: "application_form",
        label: td("typeApplicationForm", "Application Form"),
      },
      { value: "other", label: td("typeOther", "Other") },
    ],
    [td],
  );

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 480);

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

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ FIX: runAiAnalysis with stable dependencies
  const runAiAnalysis = useCallback(
    async (base64File, mimeType) => {
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

        setAiProcessingTime(Date.now() - startTime);

        if (a.notes) {
          setAiNotes(a.notes);
          if (a.documentType === "other" || a.confidence === "low") {
            setForm((prev) => ({ ...prev, notes: a.notes }));
          }
        }
        if (a.documentType) setDetectedDocumentType(a.documentType);

        if (a.extractedDetails) {
          setAiExtractedDetails(a.extractedDetails);
          setShowExtractedDetails(true);
        } else {
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

        if (a.documentQuality) {
          setAiDocumentQuality(a.documentQuality);
        } else {
          let quality = td("goodQuality", "Good quality document");
          if (a.confidence === "high") {
            quality = td(
              "excellentQuality",
              "Excellent quality document - All fields clearly visible and legible",
            );
          } else if (a.confidence === "medium") {
            quality = td(
              "acceptableQuality",
              "Acceptable quality - Some fields may require manual verification",
            );
          } else {
            quality = td(
              "lowQuality",
              "Low quality - Document may be blurry or incomplete. Please verify all fields",
            );
          }
          setAiDocumentQuality(quality);
        }

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
          if (a.notes) setAiNotes(`⚠️ ${a.notes}`);
          return;
        }

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
          td(
            "aiAnalysisFailed",
            "AI analysis failed. Please fill in the fields manually.",
          );
        setAnalyzeError(errorMsg);
        console.error("AI Analysis error:", err);
        setAiProcessingTime(Date.now() - startTime);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [td, file, DOCUMENT_TYPES],
  );

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
    if (!fileBase64)
      return setError(td("selectFile", "Please select a file to upload."));
    if (!form.documentType)
      return setError(td("selectType", "Please select a document type."));
    if (!form.title.trim())
      return setError(td("enterTitle", "Please enter a document title."));

    setIsUploading(true);
    setError("");

    try {
      const res = await uploadDocument({ file: fileBase64, ...form });
      setSuccess(res.data);
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          td("uploadError", "Upload failed. Please try again."),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid #CBD5E1",
    borderRadius: "8px",
    padding: isMobile ? "8px 10px" : "9px 12px",
    fontSize: isMobile ? "14px" : "13px",
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
    fontSize: isMobile ? "13px" : "12px",
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

  if (success) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: isMobile ? "24px 16px" : "40px",
          textAlign: "center",
          width: isMobile ? "100%" : "440px",
          maxWidth: "100%",
        }}
      >
        <div
          style={{ fontSize: isMobile ? "36px" : "48px", marginBottom: "16px" }}
        >
          <FiCheck
            size={isMobile ? 36 : 48}
            color="#22C55E"
            style={{ display: "block", margin: "0 auto" }}
          />
        </div>
        <h3
          style={{
            fontWeight: 700,
            color: "#0F172A",
            fontSize: isMobile ? "16px" : "18px",
          }}
        >
          {td("uploadSuccess", "Document Uploaded!")}
        </h3>
        <p style={{ color: "#64748B", fontSize: isMobile ? "12px" : "13px" }}>
          {tc("reference", "Reference")}:{" "}
          <strong>{success.document?.referenceNumber}</strong>
        </p>
        {success.document?.aiExtractedData?.summary && (
          <div
            style={{
              background: "#EFF6FF",
              borderRadius: "8px",
              padding: isMobile ? "10px" : "12px",
              marginTop: "12px",
              fontSize: isMobile ? "12px" : "13px",
              color: "#1D4ED8",
              textAlign: "left",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <FiInfo size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>{td("aiExtracted", "AI Extracted")}:</strong>
              <br />
              {success.document.aiExtractedData.summary}
              {success.document.aiExtractedData.confidence && (
                <div style={{ marginTop: "4px", fontSize: "11px" }}>
                  {td("confidence", "Confidence")}:{" "}
                  <strong>{success.document.aiExtractedData.confidence}</strong>
                  {success.document.aiExtractedData.processingTime && (
                    <>
                      {" "}
                      · {td("processedIn", "Processed in")}{" "}
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
        borderRadius: isMobile ? "12px" : "16px",
        padding: isMobile ? "16px" : "28px",
        width: isMobile ? "100%" : "620px",
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
          marginBottom: isMobile ? "12px" : "20px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? "16px" : "18px",
            fontWeight: 700,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiUpload size={isMobile ? 16 : 20} color="#2563EB" />
          {td("uploadDocument", "Upload CRRSA Document")}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: isMobile ? "16px" : "20px",
            cursor: "pointer",
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
          }}
        >
          <FiX size={isMobile ? 16 : 20} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "#2563EB" : file ? "#22C55E" : "#CBD5E1"}`,
          borderRadius: isMobile ? "10px" : "12px",
          padding: isMobile ? "16px" : "24px",
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
            fontSize: isMobile ? "28px" : "32px",
            marginBottom: "8px",
            color: file ? "#22C55E" : "#64748B",
          }}
        >
          {file ? (
            <FiCheck size={isMobile ? 28 : 32} />
          ) : isDragActive ? (
            <FiUpload size={isMobile ? 28 : 32} />
          ) : (
            <FiFile size={isMobile ? 28 : 32} />
          )}
        </div>
        <p
          style={{
            fontSize: isMobile ? "12px" : "13px",
            color: "#475569",
            margin: 0,
          }}
        >
          {file
            ? `${file.name} (${(file.size / 1024).toFixed(0)}KB)`
            : isDragActive
              ? td("dropHere", "Drop the file here...")
              : td(
                  "dragDrop",
                  "Drag and drop PDF, JPG, PNG, or TIFF — or click to browse",
                )}
        </p>
        <p
          style={{
            fontSize: isMobile ? "10px" : "11px",
            color: "#94A3B8",
            margin: "4px 0 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            flexWrap: "wrap",
          }}
        >
          <FiInfo size={12} />
          {td("maxFileSize", "Max 20MB · AI will auto-detect document details")}
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
            padding: isMobile ? "8px 12px" : "10px 14px",
            marginBottom: "16px",
            fontSize: isMobile ? "12px" : "13px",
            color: "#1D4ED8",
            flexWrap: "wrap",
          }}
        >
          <span style={{ animation: "spin 1s linear infinite" }}>
            <FiLoader size={16} />
          </span>
          <div>
            <div>
              {td(
                "analyzing",
                "Reading document with AI — extracting metadata...",
              )}
            </div>
            {aiProcessingTime && (
              <div
                style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}
              >
                {td("analyzingContent", "Analyzing document contents...")}
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
            padding: isMobile ? "10px 12px" : "12px 14px",
            marginBottom: "16px",
            flexWrap: "wrap",
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
                fontSize: isMobile ? "12px" : "13px",
              }}
            >
              {aiConfidence === "high"
                ? td("highConfidence", "High Confidence Extraction")
                : aiConfidence === "medium"
                  ? td("mediumConfidence", "Medium Confidence Extraction")
                  : td("lowConfidence", "Low Confidence Extraction")}
            </div>
            <div
              style={{
                fontSize: isMobile ? "12px" : "13px",
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
                `${td("aiFilled", "AI filled")} ${Object.keys(aiFilledFields).length} ${td("fields", "field(s)")} — ${td("reviewBeforeSubmit", "please review before submitting.")}`}
            </div>
            {aiProcessingTime && (
              <div
                style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}
              >
                {td("processedIn", "Processed in")}{" "}
                {(aiProcessingTime / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Extracted Details Section */}
      {!isAnalyzing && showExtractedDetails && aiExtractedDetails && (
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: isMobile ? "10px 12px" : "12px 14px",
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
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: 600,
                color: "#1E293B",
              }}
            >
              <FiList size={14} color={C?.primary || "#2563EB"} />
              {td("aiExtractedDetails", "AI Extracted Details")}
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
                {td("fields", "fields")}
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
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "4px 8px" : "6px 12px",
                marginTop: "10px",
                paddingTop: "10px",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              {aiExtractedDetails.documentNumber && (
                <div style={{ fontSize: isMobile ? "10px" : "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiHash size={10} style={{ marginRight: "4px" }} />
                    {td("documentNumber", "Document No")}:
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
                <div style={{ fontSize: isMobile ? "10px" : "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiUser size={10} style={{ marginRight: "4px" }} />
                    {td("issuedBy", "Issued By")}:
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
                <div style={{ fontSize: isMobile ? "10px" : "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiMapPin size={10} style={{ marginRight: "4px" }} />
                    {td("location", "Location")}:
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
                <div style={{ fontSize: isMobile ? "10px" : "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiBook size={10} style={{ marginRight: "4px" }} />
                    {td("language", "Language")}:
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
                <div style={{ fontSize: isMobile ? "10px" : "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiFileText size={10} style={{ marginRight: "4px" }} />
                    {td("pages", "Pages")}:
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
                <div style={{ fontSize: isMobile ? "10px" : "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiFile size={10} style={{ marginRight: "4px" }} />
                    {td("fileSize", "File Size")}:
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
                <div style={{ fontSize: isMobile ? "10px" : "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiFileText size={10} style={{ marginRight: "4px" }} />
                    {td("fileType", "File Type")}:
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
                <div style={{ fontSize: isMobile ? "10px" : "11px" }}>
                  <span style={{ color: "#64748B" }}>
                    <FiInfo size={10} style={{ marginRight: "4px" }} />
                    {td("version", "Version")}:
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
            padding: isMobile ? "8px 12px" : "10px 14px",
            marginBottom: "16px",
            fontSize: isMobile ? "12px" : "13px",
            color:
              aiDocumentQuality.includes("Excellent") ||
              aiDocumentQuality.includes("Good")
                ? "#15803D"
                : aiDocumentQuality.includes("Acceptable")
                  ? "#B45309"
                  : "#B91C1C",
            flexWrap: "wrap",
          }}
        >
          <FiActivity size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <strong>{td("documentQuality", "Document Quality")}:</strong>
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
            padding: isMobile ? "8px 12px" : "10px 14px",
            marginBottom: "16px",
            fontSize: isMobile ? "12px" : "13px",
            color: "#92400E",
            flexWrap: "wrap",
          }}
        >
          <FiAlertTriangle
            size={16}
            style={{ flexShrink: 0, marginTop: "1px" }}
          />
          <div>
            <strong>
              {td(
                "notRecognized",
                "Document type not recognized as a CRRSA document.",
              )}
            </strong>
            <br />
            <span
              style={{ fontSize: isMobile ? "12px" : "13px", color: "#78350F" }}
            >
              {aiNotes ||
                td(
                  "notCRRSA",
                  "This document does not appear to be a government CRRSA document. You can still upload it using the 'Other' document type.",
                )}
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
            padding: isMobile ? "8px 12px" : "10px 14px",
            marginBottom: "16px",
            fontSize: isMobile ? "12px" : "13px",
            color: "#B91C1C",
            flexWrap: "wrap",
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? "10px" : "14px",
        }}
      >
        <div>
          <label style={labelStyle}>
            <FiBook size={12} style={{ marginRight: "4px" }} />
            {td("documentType", "Document Type")} *
            {aiFilledFields.documentType && aiBadge}
          </label>
          <select
            value={form.documentType}
            onChange={handleChange("documentType")}
            style={aiFilledFields.documentType ? inputStyleFilled : inputStyle}
          >
            <option value="">{td("selectType", "Select type...")}</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {detectedDocumentType && !form.documentType && (
            <div
              style={{
                fontSize: isMobile ? "10px" : "11px",
                color: "#64748B",
                marginTop: "4px",
              }}
            >
              <FiInfo size={12} style={{ marginRight: "4px" }} />
              {td("aiDetected", "AI detected")}:{" "}
              {detectedDocumentType.replace(/_/g, " ")}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            <FiFileText size={12} style={{ marginRight: "4px" }} />
            {td("title", "Title")} *{aiFilledFields.title && aiBadge}
          </label>
          <input
            value={form.title}
            onChange={handleChange("title")}
            placeholder={td(
              "titlePlaceholder",
              "e.g. Birth Certificate – Abebe Kebede",
            )}
            style={aiFilledFields.title ? inputStyleFilled : inputStyle}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "8px" : "12px",
          }}
        >
          <div>
            <label style={labelStyle}>
              <FiUser size={12} style={{ marginRight: "4px" }} />
              {td("citizenName", "Citizen Name (English)")}
              {aiFilledFields.citizenName && aiBadge}
            </label>
            <input
              value={form.citizenName}
              onChange={handleChange("citizenName")}
              placeholder={td("fullName", "Full name")}
              style={aiFilledFields.citizenName ? inputStyleFilled : inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              {td("citizenNameAmharic", "ስም (አማርኛ)")}
              {aiFilledFields.citizenNameAmharic && aiBadge}
            </label>
            <input
              value={form.citizenNameAmharic}
              onChange={handleChange("citizenNameAmharic")}
              placeholder={td("fullNameAmharic", "ሙሉ ስም")}
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
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "8px" : "12px",
          }}
        >
          <div>
            <label style={labelStyle}>
              <FiCalendar size={12} style={{ marginRight: "4px" }} />
              {td("issueDate", "Issue Date")}
              {aiFilledFields.issueDate && aiBadge}
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
              {td("issuingOfficer", "Issuing Officer")}
              {aiFilledFields.issuingOfficer && aiBadge}
            </label>
            <input
              value={form.issuingOfficer}
              onChange={handleChange("issuingOfficer")}
              placeholder={td("officerName", "Officer name")}
              style={
                aiFilledFields.issuingOfficer ? inputStyleFilled : inputStyle
              }
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            {td("nationalId", "National ID (optional)")}
            {aiFilledFields.nationalId && aiBadge}
          </label>
          <input
            value={form.nationalId}
            onChange={handleChange("nationalId")}
            placeholder={td("citizenId", "Citizen ID number")}
            style={aiFilledFields.nationalId ? inputStyleFilled : inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>
            <FiTag size={12} style={{ marginRight: "4px" }} />
            {td("tags", "Tags (comma-separated)")}
            {aiFilledFields.tags && aiBadge}
          </label>
          <input
            value={form.tags}
            onChange={handleChange("tags")}
            placeholder={td("tagsPlaceholder", "e.g. 2016, Arada, urgent")}
            style={aiFilledFields.tags ? inputStyleFilled : inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>
            <FiFileText size={12} style={{ marginRight: "4px" }} />
            {td("notes", "Notes")}
            {aiFilledFields.notes && aiBadge}
          </label>
          <textarea
            value={form.notes}
            onChange={handleChange("notes")}
            placeholder={td("notesPlaceholder", "Internal notes...")}
            rows={isMobile ? 2 : 2}
            style={{
              ...(aiFilledFields.notes ? inputStyleFilled : inputStyle),
              resize: "vertical",
              fontSize: isMobile ? "14px" : "13px",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "8px" : "12px",
          }}
        >
          <div>
            <label style={labelStyle}>
              <FiLock size={12} style={{ marginRight: "4px" }} />
              {td("accessLevel", "Access Level")}
            </label>
            <select
              value={form.accessLevel}
              onChange={handleChange("accessLevel")}
              style={inputStyle}
            >
              <option value="employee">{td("employee", "Employee")}</option>
              <option value="leader">
                {td("leaderAndAbove", "Leader & above")}
              </option>
              <option value="admin">{td("adminOnly", "Admin only")}</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>
              <FiClock size={12} style={{ marginRight: "4px" }} />
              {td("retentionPolicy", "Retention Policy")}
            </label>
            <select
              value={form.retentionPolicy}
              onChange={handleChange("retentionPolicy")}
              style={inputStyle}
            >
              <option value="lifetime">{td("lifetime", "Lifetime ♾")}</option>
              <option value="10_years">{td("tenYears", "10 Years")}</option>
              <option value="5_years">{td("fiveYears", "5 Years")}</option>
            </select>
          </div>
        </div>

        {error && (
          <p
            style={{
              color: "#DC2626",
              fontSize: isMobile ? "12px" : "13px",
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
            padding: isMobile ? "10px" : "12px",
            fontSize: isMobile ? "13px" : "14px",
            fontWeight: 600,
            cursor: isUploading || isAnalyzing ? "default" : "pointer",
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          {isUploading ? (
            <>
              <span style={{ animation: "spin 1s linear infinite" }}>
                <FiLoader size={16} />
              </span>
              {td("uploading", "Uploading… Please wait")}
            </>
          ) : isAnalyzing ? (
            <>
              <span style={{ animation: "spin 1s linear infinite" }}>
                <FiLoader size={16} />
              </span>
              {td("analyzingDocument", "Analyzing document with AI…")}
            </>
          ) : (
            <>
              <FiUpload size={16} />
              {td("uploadDocument", "Upload Document")}
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
