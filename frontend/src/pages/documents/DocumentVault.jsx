// frontend/src/pages/documents/DocumentVault.jsx
// Main CRRSA Document Vault page — list, search, and upload documents

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { documentAPI } from "../../services/api";
import DocumentUpload from "./DocumentUpload";
import { useAuth } from "../../hooks/useAuth";
import { AISmartSearch } from "../../components/ai";
import { useLanguage } from "../../hooks/useLanguage";

// ✅ Import react-icons
import {
  FiFolder,
  FiFile,
  FiImage,
  FiFileText,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiLayers,
  FiUser,
  FiHardDrive,
  FiUpload,
  FiDatabase,
  FiBook,
  FiArchive,
  FiCalendar,
  FiHash,
} from "react-icons/fi";

const fetchDocuments = (params) => documentAPI.getAll(params);
const getDocumentDownloadUrl = (id) => documentAPI.getDownloadUrl(id);

// ─── Document Card ────────────────────────────────────────────
const DocumentCard = ({ doc, onDownload, t }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getFileIcon = (fileType) => {
    const icons = {
      pdf: <FiFile size={isMobile ? 28 : 32} />,
      jpg: <FiImage size={isMobile ? 28 : 32} />,
      png: <FiImage size={isMobile ? 28 : 32} />,
      tiff: <FiImage size={isMobile ? 28 : 32} />,
    };
    return icons[fileType] || <FiFileText size={isMobile ? 28 : 32} />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      birth_certificate:
        t?.("documentVault.typeBirthCertificate") || "Birth Certificate",
      death_certificate:
        t?.("documentVault.typeDeathCertificate") || "Death Certificate",
      marriage_certificate:
        t?.("documentVault.typeMarriageCertificate") || "Marriage Certificate",
      divorce_certificate:
        t?.("documentVault.typeDivorceCertificate") || "Divorce Certificate",
      residence_id: t?.("documentVault.typeResidenceId") || "Residence ID",
      name_change: t?.("documentVault.typeNameChange") || "Name Change",
      registration_book:
        t?.("documentVault.typeRegistrationBook") || "Registration Book",
      circular: t?.("documentVault.typeCircular") || "Circular",
      directive: t?.("documentVault.typeDirective") || "Directive",
      correspondence:
        t?.("documentVault.typeCorrespondence") || "Correspondence",
      application_form:
        t?.("documentVault.typeApplicationForm") || "Application Form",
      other: t?.("documentVault.typeOther") || "Other",
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        padding: isMobile ? "14px" : "16px",
        transition: "box-shadow 0.2s, transform 0.2s",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "auto 1fr auto",
        gap: isMobile ? "12px" : "16px",
        alignItems: "center",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Left Column: Document Image/Icon */}
      <div
        style={{
          width: isMobile ? "100%" : "80px",
          height: isMobile ? "100px" : "80px",
          borderRadius: "10px",
          background: `linear-gradient(135deg, #EFF6FF, #DBEAFE)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isMobile ? "32px" : "36px",
          overflow: "hidden",
          color: "#2563EB",
          border: "1px solid #BFDBFE",
          position: "relative",
        }}
      >
        {doc.thumbnailUrl ? (
          <img
            src={doc.thumbnailUrl}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          getFileIcon(doc.fileType)
        )}
        {/* File type badge on image */}
        <span
          style={{
            position: "absolute",
            bottom: "4px",
            right: "4px",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontSize: "9px",
            padding: "2px 6px",
            borderRadius: "4px",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {doc.fileType?.toUpperCase() || "FILE"}
        </span>
      </div>

      {/* Middle Column: Document Info */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
        }}
      >
        {/* Title */}
        <div
          style={{
            fontWeight: 600,
            fontSize: isMobile ? "14px" : "15px",
            color: "#0F172A",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "4px",
          }}
        >
          <span style={{ wordBreak: "break-word" }}>{doc.title}</span>
        </div>

        {/* Reference Number */}
        <div
          style={{
            fontSize: isMobile ? "11px" : "12px",
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginBottom: "4px",
          }}
        >
          <FiHash size={12} color="#94A3B8" />
          <span style={{ fontFamily: "monospace", fontSize: "11px" }}>
            {doc.referenceNumber}
          </span>
        </div>

        {/* Tags and Badges - Row 1 */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "4px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              background: "#EFF6FF",
              color: "#1D4ED8",
              fontSize: isMobile ? "10px" : "11px",
              padding: "2px 10px",
              borderRadius: "99px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiBook size={10} />
            {getTypeLabel(doc.documentType)}
          </span>
          {doc.retentionPolicy === "lifetime" && (
            <span
              style={{
                background: "#F0FDF4",
                color: "#15803D",
                fontSize: isMobile ? "10px" : "11px",
                padding: "2px 10px",
                borderRadius: "99px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiArchive size={10} />♾{" "}
              {t?.("documentVault.lifetime") || "Lifetime"}
            </span>
          )}
          {doc.retentionPolicy === "10_years" && (
            <span
              style={{
                background: "#FEF3C7",
                color: "#92400E",
                fontSize: isMobile ? "10px" : "11px",
                padding: "2px 10px",
                borderRadius: "99px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiCalendar size={10} />
              {t?.("documentVault.tenYears") || "10 Years"}
            </span>
          )}
          {doc.retentionPolicy === "5_years" && (
            <span
              style={{
                background: "#FEF3C7",
                color: "#92400E",
                fontSize: isMobile ? "10px" : "11px",
                padding: "2px 10px",
                borderRadius: "99px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiCalendar size={10} />
              {t?.("documentVault.fiveYears") || "5 Years"}
            </span>
          )}
        </div>

        {/* Citizen Name */}
        {doc.citizenName && (
          <div
            style={{
              fontSize: isMobile ? "11px" : "12px",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiUser size={12} color="#94A3B8" />
            {doc.citizenName}
          </div>
        )}
      </div>

      {/* Right Column: File Size & Download */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          alignItems: isMobile ? "center" : "flex-end",
          gap: isMobile ? "8px" : "8px",
          flexShrink: 0,
          width: isMobile ? "100%" : "auto",
          justifyContent: isMobile ? "space-between" : "flex-start",
        }}
      >
        {/* File Size */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#F8FAFC",
            padding: isMobile ? "4px 12px" : "6px 14px",
            borderRadius: "20px",
            border: "1px solid #E2E8F0",
            width: isMobile ? "auto" : "100%",
            justifyContent: isMobile ? "flex-start" : "center",
          }}
        >
          <FiHardDrive size={14} color="#64748B" />
          <span
            style={{
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: 600,
              color: "#1E293B",
            }}
          >
            {formatFileSize(doc.fileSize)}
          </span>
        </div>

        {/* Download Button */}
        <button
          onClick={() => onDownload(doc._id)}
          style={{
            background: "#2563EB",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: isMobile ? "8px 16px" : "8px 18px",
            fontSize: isMobile ? "12px" : "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: isMobile ? "100%" : "100%",
            fontWeight: 600,
            transition: "all 0.2s",
            minWidth: isMobile ? "auto" : "100px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1D4ED8";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#2563EB";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <FiDownload size={14} />
          {t?.("common.download") || "Download"}
        </button>

        {/* File Type - Small indicator */}
        <div
          style={{
            fontSize: "9px",
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            display: isMobile ? "none" : "block",
          }}
        >
          {doc.fileType?.toUpperCase() || "FILE"}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
export default function DocumentVault() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 480);
  const { user } = useAuth();

  // Translation helpers
  const td = (key, fallback) => t?.(`documentVault.${key}`) || fallback;
  const tc = (key, fallback) => t?.(`common.${key}`) || fallback;

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Use ref to track if component is mounted
  const isMounted = useRef(true);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ Load documents function with mounted check
  const loadDocuments = useCallback(async () => {
    if (!isMounted.current) return;

    setIsLoading(true);
    try {
      const params = { page, limit: 12 };
      if (typeFilter) params.type = typeFilter;

      const res = await fetchDocuments(params);

      if (isMounted.current) {
        setDocuments(res.data.documents);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [page, typeFilter]);

  // ✅ Load documents when dependencies change
  useEffect(() => {
    let isEffectActive = true;

    const loadData = async () => {
      if (!isEffectActive) return;

      setIsLoading(true);
      try {
        const params = { page, limit: 12 };
        if (typeFilter) params.type = typeFilter;

        const res = await fetchDocuments(params);

        if (isEffectActive) {
          setDocuments(res.data.documents);
          setPagination(res.data.pagination);
        }
      } catch (error) {
        console.error("Failed to load documents:", error);
      } finally {
        if (isEffectActive) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isEffectActive = false;
    };
  }, [page, typeFilter]);

  // ✅ Reset to page 1 when filter changes
  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleDownload = async (id) => {
    try {
      const res = await getDocumentDownloadUrl(id);
      window.open(res.data.fileUrl, "_blank");
    } catch {
      alert(td("downloadError", "Download failed. Please try again."));
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadDocuments();
  };

  // ✅ Handle AI smart search selection
  const handleSmartSelect = (doc) => {
    handleDownload(doc._id);
  };

  return (
    <div
      style={{
        padding: "clamp(12px, 3vw, 24px)",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "flex-start",
          gap: "12px",
          marginBottom: "clamp(16px, 3vw, 24px)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(18px, 4vw, 22px)",
              fontWeight: 700,
              margin: 0,
              color: "#0F172A",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <FiFolder size={isMobile ? 20 : 28} color="#2563EB" />
            {td("title", "CRRSA Document Vault")}
          </h1>
          <p
            style={{
              color: "#64748B",
              fontSize: "clamp(11px, 2.5vw, 13px)",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <FiDatabase size={14} />
            {td(
              "subtitle",
              "Lifetime document storage for Civil Registration and Residency Service Agency",
            )}
          </p>
        </div>
        {["leader", "admin", "superadmin"].includes(user?.role) && (
          <button
            onClick={() => setShowUpload(true)}
            style={{
              background: "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "clamp(8px, 2vw, 10px) clamp(16px, 3vw, 20px)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "clamp(12px, 2.5vw, 14px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <FiUpload size={16} />
            {td("uploadDocument", "Upload Document")}
          </button>
        )}
      </div>

      {/* Upload modal */}
      {showUpload &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setShowUpload(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: "620px" }}
            >
              <DocumentUpload
                onSuccess={handleUploadComplete}
                onClose={() => setShowUpload(false)}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* ✅ AI Smart Search - Primary search */}
      <div style={{ marginBottom: "16px" }}>
        <AISmartSearch
          onSelect={handleSmartSelect}
          placeholder={td(
            "aiSearchPlaceholder",
            "AI-powered search by name, reference, content...",
          )}
        />
      </div>

      {/* ✅ Type Filter Only */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
          justifyContent: isMobile ? "flex-start" : "flex-end",
        }}
      >
        <div
          style={{
            position: "relative",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <FiFilter
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
              zIndex: 1,
            }}
          />
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            style={{
              border: "1px solid #CBD5E1",
              borderRadius: "10px",
              padding: "10px 14px 10px 36px",
              fontSize: "clamp(12px, 2.5vw, 13px)",
              background: "#fff",
              outline: "none",
              appearance: "none",
              minWidth: isMobile ? "100%" : "200px",
              cursor: "pointer",
              transition: "border-color 0.2s",
              width: isMobile ? "100%" : "auto",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#2563EB";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">
              {td("allDocumentTypes", "All Document Types")}
            </option>
            <option value="birth_certificate">
              {td("typeBirthCertificate", "Birth Certificate")}
            </option>
            <option value="death_certificate">
              {td("typeDeathCertificate", "Death Certificate")}
            </option>
            <option value="marriage_certificate">
              {td("typeMarriageCertificate", "Marriage Certificate")}
            </option>
            <option value="divorce_certificate">
              {td("typeDivorceCertificate", "Divorce Certificate")}
            </option>
            <option value="residence_id">
              {td("typeResidenceId", "Residence ID")}
            </option>
            <option value="name_change">
              {td("typeNameChange", "Name Change")}
            </option>
            <option value="registration_book">
              {td("typeRegistrationBook", "Registration Book")}
            </option>
            <option value="circular">{td("typeCircular", "Circular")}</option>
            <option value="directive">
              {td("typeDirective", "Directive")}
            </option>
            <option value="correspondence">
              {td("typeCorrespondence", "Correspondence")}
            </option>
            <option value="application_form">
              {td("typeApplicationForm", "Application Form")}
            </option>
            <option value="other">{td("typeOther", "Other")}</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {pagination.total !== undefined && (
        <p
          style={{
            fontSize: "clamp(12px, 2.5vw, 13px)",
            color: "#64748B",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <FiDatabase size={14} />
          {pagination.total}{" "}
          {pagination.total !== 1
            ? td("documents", "documents")
            : td("document", "document")}{" "}
          {tc("found", "found")}
        </p>
      )}

      {/* Documents grid */}
      {isLoading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#94A3B8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <FiFileText
            size={32}
            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
          />
          {tc("loading", "Loading...")}
        </div>
      ) : documents.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "clamp(40px, 8vw, 60px) clamp(16px, 3vw, 20px)",
            color: "#94A3B8",
            background: "#F8FAFC",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "clamp(32px, 8vw, 40px)" }}>
            <FiFolder size={48} color="#94A3B8" />
          </div>
          <p
            style={{
              fontWeight: 600,
              fontSize: "clamp(14px, 3vw, 16px)",
              color: "#64748B",
            }}
          >
            {td("noDocuments", "No documents found")}
          </p>
          <p style={{ fontSize: "clamp(12px, 2.5vw, 13px)" }}>
            {td(
              "uploadFirst",
              "Upload the first CRRSA document to get started",
            )}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {documents.map((doc) => (
            <DocumentCard
              key={doc._id}
              doc={doc}
              onDownload={handleDownload}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginTop: "24px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 16px)",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              background: "#fff",
              cursor: page === 1 ? "default" : "pointer",
              opacity: page === 1 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "clamp(12px, 2.5vw, 13px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.background = "#F1F5F9";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            <FiChevronLeft size={16} />
            {tc("previous", "Prev")}
          </button>
          <span
            style={{
              padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 16px)",
              fontSize: "clamp(12px, 2.5vw, 13px)",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiLayers size={14} />
            {tc("page", "Page")} {page} {tc("of", "of")} {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            style={{
              padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 16px)",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              background: "#fff",
              cursor: page === pagination.pages ? "default" : "pointer",
              opacity: page === pagination.pages ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "clamp(12px, 2.5vw, 13px)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (page !== pagination.pages) {
                e.currentTarget.style.background = "#F1F5F9";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            {tc("next", "Next")}
            <FiChevronRight size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
