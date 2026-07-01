// frontend/src/pages/documents/DocumentVault.jsx
// Main CRRSA Document Vault page — list, search, and upload documents

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { documentAPI } from "../../services/api";
import DocumentUpload from "./DocumentUpload";
import { useAuth } from "../../hooks/useAuth";
import { AISmartSearch } from "../../components/ai";

// ✅ Import react-icons
import {
  FiFolder,
  FiFile,
  FiImage,
  FiFileText,
  FiDownload,
  // FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiFilter,
  FiLayers,
  // FiClock,
  FiUser,
  FiFileType,
  FiHardDrive,
  FiUpload,
  FiDatabase,
  // FiInfo,
  FiBook,
  FiArchive,
} from "react-icons/fi";

const fetchDocuments = (params) => documentAPI.getAll(params);
const getDocumentDownloadUrl = (id) => documentAPI.getDownloadUrl(id);

const DOCUMENT_TYPE_LABELS = {
  birth_certificate: "Birth Certificate / የልደት ምስክር ወረቀት",
  death_certificate: "Death Certificate / የሞት ምስክር ወረቀት",
  marriage_certificate: "Marriage Certificate / የጋብቻ ምስክር ወረቀት",
  divorce_certificate: "Divorce Certificate / የፍቺ ምስክር ወረቀት",
  residence_id: "Residence ID / የኑሮ መታወቂያ",
  name_change: "Name Change / የስም ለውጥ",
  registration_book: "Registration Book / የምዝገባ መዝገብ",
  circular: "Circular / ክብ ደብዳቤ",
  directive: "Directive / መመሪያ",
  correspondence: "Correspondence / ደብዳቤ",
  application_form: "Application Form / ማመልከቻ ቅጽ",
  other: "Other / ሌሎች",
};

// ✅ File type icons using react-icons
const FILE_TYPE_ICON = {
  pdf: <FiFile size={24} />,
  jpg: <FiImage size={24} />,
  png: <FiImage size={24} />,
  tiff: <FiImage size={24} />,
  other: <FiFileText size={24} />,
};

// ─── Document Card ────────────────────────────────────────────
const DocumentCard = ({ doc, onDownload }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #E2E8F0",
      borderRadius: "12px",
      padding: "16px",
      display: "flex",
      gap: "14px",
      alignItems: "flex-start",
      transition: "box-shadow 0.2s",
    }}
    onMouseEnter={(e) =>
      (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")
    }
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
  >
    {/* Thumbnail or icon */}
    <div
      style={{
        width: "52px",
        height: "52px",
        borderRadius: "8px",
        background: "#F1F5F9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "26px",
        flexShrink: 0,
        overflow: "hidden",
        color: "#64748B",
      }}
    >
      {doc.thumbnailUrl ? (
        <img
          src={doc.thumbnailUrl}
          alt="preview"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        FILE_TYPE_ICON[doc.fileType] || <FiFileText size={24} />
      )}
    </div>

    {/* Info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontWeight: 600,
          fontSize: "14px",
          color: "#1E293B",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <FiFileText size={14} color="#64748B" />
        {doc.title}
      </div>
      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
        <FiFileType size={12} style={{ marginRight: "4px" }} />
        {doc.referenceNumber}
      </div>
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginTop: "6px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background: "#EFF6FF",
            color: "#1D4ED8",
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "99px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <FiBook size={10} />
          {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
        </span>
        {doc.retentionPolicy === "lifetime" && (
          <span
            style={{
              background: "#F0FDF4",
              color: "#15803D",
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "99px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiArchive size={10} />♾ Lifetime
          </span>
        )}
      </div>
      {doc.citizenName && (
        <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
          <FiUser size={12} style={{ marginRight: "4px" }} />
          {doc.citizenName}
        </div>
      )}
    </div>

    {/* Actions */}
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <button
        onClick={() => onDownload(doc._id)}
        style={{
          background: "#2563EB",
          color: "#fff",
          border: "none",
          borderRadius: "7px",
          padding: "6px 12px",
          fontSize: "12px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <FiDownload size={14} />
        Download
      </button>
      <div
        style={{
          fontSize: "11px",
          color: "#94A3B8",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          justifyContent: "center",
        }}
      >
        <FiHardDrive size={12} />
        {doc.fileType?.toUpperCase()}
        {doc.fileSize ? ` · ${(doc.fileSize / 1024).toFixed(0)}KB` : ""}
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────
export default function DocumentVault() {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const { user } = useAuth();

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
    // Don't set loading if already loading or unmounted
    if (!isMounted.current) return;

    setIsLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.type = typeFilter;

      const res = await fetchDocuments(params);

      // ✅ Only update state if component is still mounted
      if (isMounted.current) {
        setDocuments(res.data.documents);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
      if (isMounted.current) {
        // Optionally set error state here
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [page, search, typeFilter]);

  // ✅ Load documents when dependencies change - using a cleanup flag pattern
  useEffect(() => {
    let isEffectActive = true;

    const loadData = async () => {
      if (!isEffectActive) return;

      setIsLoading(true);
      try {
        const params = { page, limit: 12 };
        if (search.trim()) params.search = search.trim();
        if (typeFilter) params.type = typeFilter;

        const res = await fetchDocuments(params);

        // ✅ Only update state if effect is still active
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

    // ✅ Cleanup function - marks effect as inactive
    return () => {
      isEffectActive = false;
    };
  }, [page, search, typeFilter]);

  // ✅ Reset to page 1 when search or filter changes
  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleDownload = async (id) => {
    try {
      const res = await getDocumentDownloadUrl(id);
      window.open(res.data.fileUrl, "_blank");
    } catch {
      alert("Download failed. Please try again.");
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    // Reload documents after upload
    loadDocuments();
  };

  // ✅ Handle AI smart search selection
  const handleSmartSelect = (doc) => {
    handleDownload(doc._id);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              margin: 0,
              color: "#0F172A",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FiFolder size={28} color="#2563EB" />
            CRRSA Document Vault
          </h1>
          <p
            style={{
              color: "#64748B",
              fontSize: "13px",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FiDatabase size={14} />
            Lifetime document storage for Civil Registration and Residency
            Service Agency
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
              padding: "10px 20px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FiUpload size={16} />
            Upload Document
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
            }}
            onClick={() => setShowUpload(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <DocumentUpload
                onSuccess={handleUploadComplete}
                onClose={() => setShowUpload(false)}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* ✅ AI Smart Search */}
      <div style={{ marginBottom: "16px" }}>
        <AISmartSearch
          onSelect={handleSmartSelect}
          placeholder="AI-powered search by name, reference, content..."
        />
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <FiSearch
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
            }}
          />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, reference no., or keyword..."
            style={{
              width: "100%",
              border: "1px solid #CBD5E1",
              borderRadius: "10px",
              padding: "10px 14px 10px 38px",
              fontSize: "13px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#2563EB";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <div style={{ position: "relative" }}>
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
              fontSize: "13px",
              background: "#fff",
              outline: "none",
              appearance: "none",
              minWidth: "180px",
              cursor: "pointer",
              transition: "border-color 0.2s",
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
              <FiLayers size={12} /> All Document Types
            </option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {pagination.total !== undefined && (
        <p
          style={{
            fontSize: "13px",
            color: "#64748B",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <FiDatabase size={14} />
          {pagination.total} document{pagination.total !== 1 ? "s" : ""} found
          {search ? ` for "${search}"` : ""}
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
          Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#94A3B8",
            background: "#F8FAFC",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>
            <FiFolder size={48} color="#94A3B8" />
          </div>
          <p style={{ fontWeight: 600, fontSize: "16px", color: "#64748B" }}>
            No documents found
          </p>
          <p style={{ fontSize: "13px" }}>
            {search
              ? "Try different search terms"
              : "Upload the first CRRSA document"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {documents.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} onDownload={handleDownload} />
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
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 16px",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              background: "#fff",
              cursor: page === 1 ? "default" : "pointer",
              opacity: page === 1 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
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
            Prev
          </button>
          <span
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiLayers size={14} />
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            style={{
              padding: "8px 16px",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              background: "#fff",
              cursor: page === pagination.pages ? "default" : "pointer",
              opacity: page === pagination.pages ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
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
            Next
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
