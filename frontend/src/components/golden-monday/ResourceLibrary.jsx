// frontend/src/components/golden-monday/ResourceLibrary.jsx
// ============================================================
// 📚 GOLDEN MONDAY RESOURCE LIBRARY - Premium File Management
// Complete with upload, download, versioning, and glassmorphism
// ============================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiDownload,
  FiTrash2,
  FiUpload,
  FiFile,
  FiFileText,
  FiImage,
  FiVideo,
  FiTag,
  FiEdit2,
  FiCheck,
  FiLoader,
  FiSearch,
  FiX,
  FiFolder,
  FiEye,
  FiEyeOff,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// GLASSMORPHISM STYLES
// ─────────────────────────────────────────────────────────────────────────────
const glass = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
};

// ─── Helper: Get file icon with color ────────────────────────
const getFileIcon = (fileType, size = 28) => {
  const icons = {
    pdf: { icon: <FiFileText size={size} />, color: "#e74c3c", bg: "#fee2e2" },
    presentation: {
      icon: <FiFileText size={size} />,
      color: "#f39c12",
      bg: "#fef3c7",
    },
    document: {
      icon: <FiFileText size={size} />,
      color: "#3498db",
      bg: "#dbeafe",
    },
    image: { icon: <FiImage size={size} />, color: "#10b981", bg: "#d1fae5" },
    video: { icon: <FiVideo size={size} />, color: "#8b5cf6", bg: "#ede9fe" },
    audio: { icon: <FiFile size={size} />, color: "#ec4899", bg: "#fce7f3" },
    spreadsheet: {
      icon: <FiFileText size={size} />,
      color: "#059669",
      bg: "#d1fae5",
    },
    code: { icon: <FiFile size={size} />, color: "#6b7280", bg: "#f3f4f6" },
    other: { icon: <FiFile size={size} />, color: "#9ca3af", bg: "#f3f4f6" },
  };
  return icons[fileType] || icons.other;
};

// ─── Helper: Format file size ─────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(size >= 10 ? 1 : size >= 1 ? 1 : size > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

// ─── Helper: Get file type from filename ──────────────────────
const getFileTypeFromName = (filename) => {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  const typeMap = {
    pdf: "pdf",
    ppt: "presentation",
    pptx: "presentation",
    doc: "document",
    docx: "document",
    xls: "spreadsheet",
    xlsx: "spreadsheet",
    csv: "spreadsheet",
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    svg: "image",
    webp: "image",
    mp4: "video",
    mov: "video",
    avi: "video",
    mkv: "video",
    webm: "video",
    mp3: "audio",
    wav: "audio",
    flac: "audio",
    js: "code",
    py: "code",
    java: "code",
    cpp: "code",
    html: "code",
    css: "code",
    json: "code",
    xml: "code",
  };
  return typeMap[ext] || "other";
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ResourceLibrary({ sessionId, onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  // ── State ──
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fileTags, setFileTags] = useState("");
  const [editingResource, setEditingResource] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("recent");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showStats, setShowStats] = useState(true);

  const isAdmin = ["leader", "admin", "superadmin"].includes(user?.role);

  // ── Load Resources ──
  const loadResources = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await goldenMondayAPI.getSessionResources(sessionId);
      setResources(response.data.resources || []);
    } catch (error) {
      console.error("Failed to load resources:", error);
      showToast(t.failedToLoad || "Failed to load resources", "error");
    } finally {
      setLoading(false);
    }
  }, [sessionId, t]);

  useEffect(() => {
    if (!sessionId) return;

    const timeoutId = setTimeout(() => {
      loadResources();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [sessionId, loadResources]);

  // ── Derived Data ──
  const allTags = useMemo(() => {
    const tagSet = new Set();
    resources.forEach((r) => {
      if (r.tags) {
        r.tags.forEach((tag) => {
          if (tag && tag.trim()) tagSet.add(tag.trim());
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [resources]);

  const fileTypes = useMemo(() => {
    const types = new Set();
    resources.forEach((r) => {
      if (r.fileType) types.add(r.fileType);
    });
    return Array.from(types).sort();
  }, [resources]);

  const stats = useMemo(() => {
    const total = resources.length;
    const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
    const totalDownloads = resources.reduce(
      (sum, r) => sum + (r.downloads || 0),
      0,
    );
    const typeCount = {};
    resources.forEach((r) => {
      const type = r.fileType || "other";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return { total, totalSize, totalDownloads, typeCount };
  }, [resources]);

  // ── Filter and Sort ──
  const filteredResources = useMemo(() => {
    let filtered = [...resources];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.filename?.toLowerCase().includes(query) ||
          r.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.fileType === filterType);
    }

    // Tag filter
    if (filterTag !== "all") {
      filtered = filtered.filter((r) => r.tags?.includes(filterTag));
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA, compareB;
      switch (sortBy) {
        case "recent":
          compareA = new Date(a.createdAt || a.uploadedAt || 0).getTime();
          compareB = new Date(b.createdAt || b.uploadedAt || 0).getTime();
          break;
        case "name":
          compareA = a.title || a.filename || "";
          compareB = b.title || b.filename || "";
          break;
        case "size":
          compareA = a.size || 0;
          compareB = b.size || 0;
          break;
        case "downloads":
          compareA = a.downloads || 0;
          compareB = b.downloads || 0;
          break;
        case "version":
          compareA = a.version || 0;
          compareB = b.version || 0;
          break;
        default:
          compareA = new Date(a.createdAt || a.uploadedAt || 0).getTime();
          compareB = new Date(b.createdAt || b.uploadedAt || 0).getTime();
      }
      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [resources, searchQuery, filterType, filterTag, sortBy, sortOrder]);

  // ── Handlers ──
  const handleUpload = async () => {
    if (!selectedFile || !fileTitle.trim()) {
      showToast(
        t.pleaseSelectFile || "Please select a file and enter a title",
        "warning",
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", fileTitle);
      formData.append("description", fileDescription);
      formData.append("tags", fileTags);

      const response = await goldenMondayAPI.uploadSessionResource(
        sessionId,
        formData,
        (progress) => setUploadProgress(progress),
      );

      showToast(response.data.message || "Resource uploaded! 🎉", "success");
      setShowUpload(false);
      setSelectedFile(null);
      setFileTitle("");
      setFileDescription("");
      setFileTags("");
      setUploadProgress(0);
      await loadResources();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Upload failed:", error);
      showToast(error.response?.data?.error || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resourceId) => {
    try {
      const response = await goldenMondayAPI.downloadResource(resourceId);
      window.open(response.data.url, "_blank");
      // Update local downloads count
      setResources((prev) =>
        prev.map((r) =>
          r._id === resourceId
            ? { ...r, downloads: (r.downloads || 0) + 1 }
            : r,
        ),
      );
    } catch (error) {
      console.error("Download failed:", error);
      showToast("Download failed", "error");
    }
  };

  const handleDelete = async (resourceId) => {
    try {
      await goldenMondayAPI.deleteSessionResource(resourceId);
      showToast("Resource deleted", "success");
      setShowDeleteConfirm(null);
      await loadResources();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Delete failed:", error);
      showToast("Delete failed", "error");
    }
  };

  const handleUpdate = async (resourceId, updates) => {
    try {
      await goldenMondayAPI.updateSessionResource(resourceId, updates);
      showToast("Resource updated", "success");
      setEditingResource(null);
      await loadResources();
    } catch (error) {
      console.error("Update failed:", error);
      showToast("Update failed", "error");
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  if (!sessionId) {
    return (
      <div
        style={{
          ...glass,
          borderRadius: 16,
          padding: "60px 20px",
          textAlign: "center",
          color: C.muted,
        }}
      >
        <FiFolder size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>
          {t.selectSession || "Select a session to view resources"}
        </p>
        <p style={{ fontSize: 13 }}>
          {t.resourcesDescription || "Resources are organized by session"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: F.sans }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .resource-card {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .resource-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
        }
        .upload-drop-zone {
          transition: all 0.3s ease;
        }
        .upload-drop-zone.dragover {
          border-color: ${C.primary};
          background: ${C.primary}11;
          transform: scale(1.02);
        }
        .shimmer-loading {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* ── STATS BANNER ── */}
      {showStats && resources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...glass,
            borderRadius: 14,
            padding: "14px 18px",
            marginBottom: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: 12,
          }}
        >
          {[
            {
              label: t.total || "Total",
              value: stats.total,
              icon: <FiFile size={16} />,
            },
            {
              label: t.size || "Size",
              value: formatFileSize(stats.totalSize),
              icon: <FiFolder size={16} />,
            },
            {
              label: t.downloads || "Downloads",
              value: stats.totalDownloads,
              icon: <FiDownload size={16} />,
            },
          ].map((stat, index) => (
            <div key={index} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.dark }}>
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {stat.icon}
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── HEADER ── */}
      <div
        style={{
          ...glass,
          borderRadius: 14,
          padding: "14px 18px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <FiFolder size={20} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                color: C.dark,
                fontFamily: F.serif,
              }}
            >
              {t.resourceLibrary || "Resource Library"}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
              {resources.length} {t.files || "files"} · {allTags.length}{" "}
              {t.tags || "tags"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isAdmin && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                background: showUpload
                  ? "#ef4444"
                  : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: F.sans,
                transition: "all 0.3s ease",
                boxShadow: showUpload ? "none" : `0 4px 16px ${C.primary}44`,
              }}
              onMouseEnter={(e) => {
                if (!showUpload) {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = `0 6px 24px ${C.primary}55`;
                }
              }}
              onMouseLeave={(e) => {
                if (!showUpload) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}44`;
                }
              }}
            >
              {showUpload ? <FiX size={16} /> : <FiUpload size={16} />}
              {showUpload
                ? t.close || "Close"
                : t.uploadResource || "Upload Resource"}
            </button>
          )}
          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: C.muted,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            {showStats ? <FiEye size={16} /> : <FiEyeOff size={16} />}
          </button>
        </div>
      </div>

      {/* ── UPLOAD FORM ── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="upload-drop-zone"
              style={{
                ...glass,
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 16,
                border: `2px dashed ${C.primary}44`,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("dragover");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("dragover");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("dragover");
                const file = e.dataTransfer.files[0];
                if (file) {
                  setSelectedFile(file);
                  if (!fileTitle) setFileTitle(file.name.split(".")[0]);
                }
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 14,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: C.muted,
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    {t.fileLabel || "File"}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!fileTitle) setFileTitle(file.name.split(".")[0]);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 12,
                      background: C.white,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {selectedFile && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      {selectedFile.name} · {formatFileSize(selectedFile.size)}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: C.muted,
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    {t.title || "Title"}{" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    placeholder={t.titlePlaceholder || "Resource title"}
                    style={{
                      width: "100%",
                      padding: "8px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      background: C.white,
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: C.muted,
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    {t.tags || "Tags"} ({t.optional || "optional"})
                  </label>
                  <input
                    type="text"
                    value={fileTags}
                    onChange={(e) => setFileTags(e.target.value)}
                    placeholder={
                      t.tagsPlaceholder || "e.g. presentation, leadership"
                    }
                    style={{
                      width: "100%",
                      padding: "8px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      background: C.white,
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: C.muted,
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    {t.description || "Description"} ({t.optional || "optional"}
                    )
                  </label>
                  <textarea
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder={
                      t.descriptionPlaceholder ||
                      "Brief description of the resource..."
                    }
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "8px 14px",
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 13,
                      background: C.white,
                      fontFamily: F.sans,
                      resize: "vertical",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: C.muted,
                      marginBottom: 4,
                    }}
                  >
                    <span>{t.uploading || "Uploading..."}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: C.border,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 16,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setSelectedFile(null);
                    setFileTitle("");
                    setFileDescription("");
                    setFileTags("");
                    setUploadProgress(0);
                  }}
                  disabled={uploading}
                  style={{
                    padding: "8px 20px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 8,
                    background: "transparent",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: F.sans,
                    opacity: uploading ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!uploading) e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    if (!uploading)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !fileTitle.trim()}
                  style={{
                    padding: "8px 24px",
                    background:
                      uploading || !selectedFile || !fileTitle.trim()
                        ? C.border
                        : `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                    color:
                      uploading || !selectedFile || !fileTitle.trim()
                        ? C.muted
                        : "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor:
                      uploading || !selectedFile || !fileTitle.trim()
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      uploading || !selectedFile || !fileTitle.trim() ? 0.6 : 1,
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: F.sans,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.3s ease",
                  }}
                >
                  {uploading ? (
                    <>
                      <FiLoader
                        size={16}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      {t.uploading || "Uploading..."}
                    </>
                  ) : (
                    <>
                      <FiUpload size={16} />
                      {t.upload || "Upload"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTERS & SEARCH ── */}
      <div
        style={{
          ...glass,
          borderRadius: 14,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ flex: "1 1 160px", position: "relative", minWidth: 120 }}>
          <FiSearch
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#999",
            }}
          />
          <input
            type="text"
            placeholder={t.searchResources || "Search resources..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              transition: "all 0.3s ease",
              background: C.white,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Type Filter */}
        {fileTypes.length > 0 && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "8px 12px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 12,
              background: C.white,
              outline: "none",
              cursor: "pointer",
              minWidth: 100,
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="all">{t.allTypes || "All Types"}</option>
            {fileTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        )}

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            style={{
              padding: "8px 12px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 12,
              background: C.white,
              outline: "none",
              cursor: "pointer",
              minWidth: 100,
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="all">{t.allTags || "All Tags"}</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        )}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "6px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 12,
              background: C.white,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="recent">{t.sortRecent || "Recent"}</option>
            <option value="name">{t.sortName || "Name"}</option>
            <option value="size">{t.sortSize || "Size"}</option>
            <option value="downloads">{t.sortDownloads || "Downloads"}</option>
            <option value="version">{t.sortVersion || "Version"}</option>
          </select>

          <button
            onClick={toggleSortOrder}
            style={{
              padding: "6px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
          >
            {sortOrder === "asc" ? (
              <FiArrowUp size={14} />
            ) : (
              <FiArrowDown size={14} />
            )}
          </button>

          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1.5px solid ${viewMode === "grid" ? C.primary : C.border}`,
              background: viewMode === "grid" ? C.primary : C.white,
              color: viewMode === "grid" ? "#fff" : C.muted,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1.5px solid ${viewMode === "list" ? C.primary : C.border}`,
              background: viewMode === "list" ? C.primary : C.white,
              color: viewMode === "list" ? "#fff" : C.muted,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiList size={14} />
          </button>

          <button
            onClick={loadResources}
            disabled={loading}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1.5px solid ${C.border}`,
              background: C.white,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = C.bg;
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = C.white;
            }}
          >
            <FiRefreshCw
              size={14}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* ── RESOURCE LIST ── */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="shimmer-loading"
              style={{
                height: 180,
                borderRadius: 14,
                background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div
          style={{
            ...glass,
            borderRadius: 14,
            padding: "50px 20px",
            textAlign: "center",
            color: C.muted,
          }}
        >
          <FiFile size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>
            {searchQuery || filterType !== "all" || filterTag !== "all"
              ? t.noMatchingResources || "No matching resources found"
              : t.noResources || "No resources uploaded for this session"}
          </p>
          <p style={{ fontSize: 13 }}>
            {searchQuery || filterType !== "all" || filterTag !== "all"
              ? t.tryAdjustingFilters || "Try adjusting your filters"
              : isAdmin
                ? t.uploadFirstResource ||
                  "Click 'Upload Resource' to add files"
                : t.checkBackLater || "Check back later for resources"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {filteredResources.map((resource, index) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              index={index}
              isAdmin={isAdmin}
              onDownload={handleDownload}
              onDelete={(id) => setShowDeleteConfirm(id)}
              onEdit={(r) => {
                setEditingResource(r._id);
                setFileTitle(r.title);
                setFileDescription(r.description || "");
                setFileTags(r.tags?.join(", ") || "");
              }}
              isEditing={editingResource === resource._id}
              fileTitle={fileTitle}
              setFileTitle={setFileTitle}
              fileDescription={fileDescription}
              setFileDescription={setFileDescription}
              fileTags={fileTags}
              setFileTags={setFileTags}
              onUpdate={() => {
                handleUpdate(resource._id, {
                  title: fileTitle,
                  description: fileDescription,
                  tags: fileTags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
              }}
              onCancelEdit={() => {
                setEditingResource(null);
                setFileTitle("");
                setFileDescription("");
                setFileTags("");
              }}
              formatFileSize={formatFileSize}
              getFileIcon={getFileIcon}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filteredResources.map((resource, index) => (
            <ResourceListItem
              key={resource._id}
              resource={resource}
              index={index}
              isAdmin={isAdmin}
              onDownload={handleDownload}
              onDelete={(id) => setShowDeleteConfirm(id)}
              onEdit={(r) => {
                setEditingResource(r._id);
                setFileTitle(r.title);
                setFileDescription(r.description || "");
                setFileTags(r.tags?.join(", ") || "");
              }}
              isEditing={editingResource === resource._id}
              fileTitle={fileTitle}
              setFileTitle={setFileTitle}
              fileDescription={fileDescription}
              setFileDescription={setFileDescription}
              fileTags={fileTags}
              setFileTags={setFileTags}
              onUpdate={() => {
                handleUpdate(resource._id, {
                  title: fileTitle,
                  description: fileDescription,
                  tags: fileTags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
              }}
              onCancelEdit={() => {
                setEditingResource(null);
                setFileTitle("");
                setFileDescription("");
                setFileTags("");
              }}
              formatFileSize={formatFileSize}
              getFileIcon={getFileIcon}
              t={t}
            />
          ))}
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              padding: 20,
            }}
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                ...glass,
                borderRadius: 20,
                padding: "clamp(24px, 4vw, 32px)",
                maxWidth: 440,
                width: "100%",
                boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiTrash2 size={28} color="#dc2626" />
                </div>
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 18,
                  color: C.dark,
                  textAlign: "center",
                  fontFamily: F.serif,
                }}
              >
                {t.deleteResource || "Delete Resource?"}
              </h3>

              <p
                style={{
                  fontSize: 14,
                  color: C.muted,
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                {t.deleteConfirmMessage ||
                  "This action cannot be undone. The file will be permanently deleted."}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 20,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    background: "transparent",
                    color: C.dark,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = C.bg)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#b91c1c";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiTrash2 size={14} />
                  {t.delete || "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE CARD (Grid View)
// ─────────────────────────────────────────────────────────────────────────────
function ResourceCard({
  resource,
  index,
  isAdmin,
  onDownload,
  onDelete,
  onEdit,
  isEditing,
  fileTitle,
  setFileTitle,
  fileDescription,
  setFileDescription,
  fileTags,
  setFileTags,
  onUpdate,
  onCancelEdit,
  formatFileSize,
  getFileIcon,
  t,
}) {
  const [expanded, setExpanded] = useState(false);

  const fileIcon = getFileIcon(
    resource.fileType || getFileTypeFromName(resource.filename),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="resource-card"
      style={{
        ...glass,
        borderRadius: 14,
        padding: "16px 18px",
        border: `1px solid ${isEditing ? C.primary : C.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        height: "100%",
      }}
    >
      {/* Icon & Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: fileIcon.bg || C.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: fileIcon.color || C.muted,
            flexShrink: 0,
          }}
        >
          {fileIcon.icon}
        </div>
        {isAdmin && !isEditing && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => onEdit(resource)}
              style={{
                padding: "4px 6px",
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: C.muted,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = C.primary;
                e.currentTarget.style.background = `${C.primary}11`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.muted;
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FiEdit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(resource._id)}
              style={{
                padding: "4px 6px",
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: C.muted,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.background = "#fee2e2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.muted;
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div>
        <div
          style={{
            fontWeight: 600,
            color: C.dark,
            fontSize: 14,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {resource.title || resource.filename || t.untitled || "Untitled"}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
          {formatFileSize(resource.size)} · v{resource.version || 1}
          {resource.downloads > 0 && ` · ⬇ ${resource.downloads}`}
        </div>
      </div>

      {/* Tags */}
      {resource.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {resource.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: 9,
                background: `${C.primary}11`,
                color: C.primary,
                padding: "1px 8px",
                borderRadius: 10,
                border: `1px solid ${C.primary}15`,
              }}
            >
              #{tag}
            </span>
          ))}
          {resource.tags.length > 3 && (
            <span style={{ fontSize: 9, color: C.muted }}>
              +{resource.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Description */}
      {resource.description && expanded && (
        <div
          style={{
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.5,
            paddingTop: 4,
          }}
        >
          {resource.description}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: "auto",
          paddingTop: 10,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <button
          onClick={() => onDownload(resource._id)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = `0 4px 16px ${C.primary}44`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <FiDownload size={14} /> {t.download || "Download"}
        </button>
      </div>

      {/* Edit Form Inline */}
      {isEditing && (
        <div
          style={{
            paddingTop: 10,
            borderTop: `1px solid ${C.border}`,
            display: "grid",
            gap: 8,
          }}
        >
          <input
            type="text"
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
            placeholder={t.title || "Title"}
            style={{
              padding: "6px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <input
            type="text"
            value={fileTags}
            onChange={(e) => setFileTags(e.target.value)}
            placeholder={t.tags || "Tags (comma separated)"}
            style={{
              padding: "6px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <textarea
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            placeholder={t.description || "Description"}
            rows={2}
            style={{
              padding: "6px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: F.sans,
              resize: "vertical",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              onClick={onCancelEdit}
              style={{
                padding: "4px 14px",
                border: `1.5px solid ${C.border}`,
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {t.cancel || "Cancel"}
            </button>
            <button
              onClick={onUpdate}
              style={{
                padding: "4px 16px",
                borderRadius: 6,
                border: "none",
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FiCheck size={14} /> {t.save || "Save"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCE LIST ITEM (List View)
// ─────────────────────────────────────────────────────────────────────────────
function ResourceListItem({
  resource,
  index,
  isAdmin,
  onDownload,
  onDelete,
  onEdit,
  isEditing,
  fileTitle,
  setFileTitle,
  fileDescription,
  setFileDescription,
  fileTags,
  setFileTags,
  onUpdate,
  onCancelEdit,
  formatFileSize,
  getFileIcon,
  t,
}) {
  const fileIcon = getFileIcon(
    resource.fileType || getFileTypeFromName(resource.filename),
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      style={{
        ...glass,
        borderRadius: 12,
        padding: "12px 16px",
        border: `1px solid ${isEditing ? C.primary : C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: fileIcon.bg || C.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: fileIcon.color || C.muted,
            flexShrink: 0,
          }}
        >
          {fileIcon.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              color: C.dark,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {resource.title || resource.filename || t.untitled || "Untitled"}
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>
              v{resource.version || 1}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 11,
              color: C.muted,
              flexWrap: "wrap",
            }}
          >
            <span>{formatFileSize(resource.size)}</span>
            {resource.downloads > 0 && <span>⬇ {resource.downloads}</span>}
            {resource.tags?.length > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <FiTag size={10} />
                {resource.tags.slice(0, 3).join(", ")}
                {resource.tags.length > 3 && ` +${resource.tags.length - 3}`}
              </span>
            )}
          </div>
          {resource.description && (
            <div style={{ fontSize: 11, color: C.muted, opacity: 0.7 }}>
              {resource.description}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => onDownload(resource._id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 14px",
            borderRadius: 8,
            border: `1.5px solid ${C.border}`,
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            fontFamily: F.sans,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.bg;
            e.currentTarget.style.borderColor = C.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          <FiDownload size={14} /> {t.download || "Download"}
        </button>

        {isAdmin && !isEditing && (
          <>
            <button
              onClick={() => onEdit(resource)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                background: "transparent",
                cursor: "pointer",
                color: C.muted,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = C.primary;
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.background = `${C.primary}11`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.muted;
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FiEdit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(resource._id)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                background: "transparent",
                cursor: "pointer",
                color: C.muted,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ef4444";
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.background = "#fee2e2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.muted;
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FiTrash2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Edit Form Inline */}
      {isEditing && (
        <div
          style={{
            width: "100%",
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <input
            type="text"
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
            placeholder={t.title || "Title"}
            style={{
              padding: "6px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <input
            type="text"
            value={fileTags}
            onChange={(e) => setFileTags(e.target.value)}
            placeholder={t.tags || "Tags (comma separated)"}
            style={{
              padding: "6px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <textarea
            value={fileDescription}
            onChange={(e) => setFileDescription(e.target.value)}
            placeholder={t.description || "Description"}
            rows={2}
            style={{
              gridColumn: "1 / -1",
              padding: "6px 10px",
              border: `1.5px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: F.sans,
              resize: "vertical",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.primary;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={onCancelEdit}
              style={{
                padding: "6px 16px",
                border: `1.5px solid ${C.border}`,
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {t.cancel || "Cancel"}
            </button>
            <button
              onClick={onUpdate}
              style={{
                padding: "6px 20px",
                borderRadius: 6,
                border: "none",
                background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FiCheck size={14} /> {t.save || "Save"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
