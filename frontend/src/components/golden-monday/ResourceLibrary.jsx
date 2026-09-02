// frontend/src/components/golden-monday/ResourceLibrary.jsx
import { useState, useEffect, useCallback } from "react";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { useAuth } from "../../hooks/useAuth";
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
} from "react-icons/fi";

// ─── Helper: Get file icon ─────────────────────────────────────
const getFileIcon = (fileType, size = 24) => {
  const icons = {
    pdf: <FiFileText size={size} color="#e74c3c" />,
    presentation: <FiFileText size={size} color="#f39c12" />,
    document: <FiFileText size={size} color="#3498db" />,
    image: <FiImage size={size} color="#2ecc71" />,
    video: <FiVideo size={size} color="#9b59b6" />,
    other: <FiFile size={size} color="#95a5a6" />,
  };
  return icons[fileType] || icons.other;
};

export default function ResourceLibrary({ sessionId, onRefresh }) {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fileTags, setFileTags] = useState("");
  const [editingResource, setEditingResource] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const isAdmin = ["leader", "admin", "superadmin"].includes(user?.role);

  const loadResources = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await goldenMondayAPI.getSessionResources(sessionId);
      setResources(response.data.resources || []);
    } catch (error) {
      console.error("Failed to load resources:", error);
      showToast("Failed to load resources", "error");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;

    const timeoutId = setTimeout(() => {
      loadResources();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [sessionId, loadResources]);

  const handleUpload = async () => {
    if (!selectedFile || !fileTitle.trim()) {
      showToast("Please select a file and enter a title", "warning");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", fileTitle);
      formData.append("description", fileDescription);
      formData.append("tags", fileTags);

      const response = await goldenMondayAPI.uploadSessionResource(
        sessionId,
        formData,
      );
      showToast(response.data.message || "Resource uploaded!", "success");
      setShowUpload(false);
      setSelectedFile(null);
      setFileTitle("");
      setFileDescription("");
      setFileTags("");
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / 1024 / 1024).toFixed(1) + " MB";
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + " GB";
  };

  if (!sessionId) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
        <FiFile size={32} style={{ opacity: 0.3 }} />
        <p>Select a session to view resources</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: F.sans }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              color: C.dark,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiFile size={18} />
            Resource Library
            <span
              style={{
                fontSize: 12,
                color: C.muted,
                fontWeight: 400,
              }}
            >
              ({resources.length} files)
            </span>
          </h3>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: F.sans,
            }}
          >
            <FiUpload size={14} />
            Upload Resource
          </button>
        )}
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div
          style={{
            background: C.bg,
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            border: `1px dashed ${C.primary}`,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: C.muted,
                  marginBottom: 4,
                }}
              >
                File *
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
                  padding: "8px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  background: C.white,
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
                }}
              >
                Title *
              </label>
              <input
                type="text"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                placeholder="Resource title"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  background: C.white,
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
                }}
              >
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={fileTags}
                onChange={(e) => setFileTags(e.target.value)}
                placeholder="e.g. presentation, leadership"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  background: C.white,
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
                }}
              >
                Description
              </label>
              <textarea
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Brief description of the resource..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  background: C.white,
                  fontFamily: F.sans,
                  resize: "vertical",
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 12,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => {
                setShowUpload(false);
                setSelectedFile(null);
                setFileTitle("");
                setFileDescription("");
                setFileTags("");
              }}
              style={{
                padding: "8px 16px",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: F.sans,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !fileTitle.trim()}
              style={{
                padding: "8px 20px",
                background: C.primary,
                color: "#fff",
                border: "none",
                borderRadius: 6,
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
              }}
            >
              {uploading ? "Uploading..." : <FiUpload size={14} />}
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      )}

      {/* Resource List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
          Loading resources...
        </div>
      ) : resources.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: C.muted,
            border: `1px dashed ${C.border}`,
            borderRadius: 12,
          }}
        >
          <FiFile size={32} style={{ opacity: 0.3 }} />
          <p style={{ marginTop: 8 }}>No resources uploaded for this session</p>
          {isAdmin && (
            <p style={{ fontSize: 12, color: "#999" }}>
              Click "Upload Resource" to add files
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {resources.map((resource) => (
            <div
              key={resource._id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: C.white,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {getFileIcon(resource.fileType)}
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: C.dark,
                      fontSize: 14,
                    }}
                  >
                    {resource.title}
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
                    <span>{resource.filename}</span>
                    <span>•</span>
                    <span>{formatFileSize(resource.size)}</span>
                    <span>•</span>
                    <span>v{resource.version}</span>
                    {resource.downloads > 0 && (
                      <>
                        <span>•</span>
                        <span>⬇ {resource.downloads}</span>
                      </>
                    )}
                    {resource.tags?.length > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          <FiTag size={10} /> {resource.tags.join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => handleDownload(resource._id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: F.sans,
                  }}
                >
                  <FiDownload size={14} /> Download
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setEditingResource(resource._id);
                        setFileTitle(resource.title);
                        setFileDescription(resource.description || "");
                        setFileTags(resource.tags?.join(", ") || "");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "6px 10px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 12,
                        color: C.primary,
                      }}
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(resource._id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "6px 10px",
                        border: `1px solid #fecaca`,
                        borderRadius: 6,
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#ef4444",
                      }}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </>
                )}
              </div>

              {/* Edit form inline */}
              {editingResource === resource._id && (
                <div
                  style={{
                    width: "100%",
                    paddingTop: 12,
                    borderTop: `1px solid ${C.border}`,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <input
                    type="text"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <input
                    type="text"
                    value={fileTags}
                    onChange={(e) => setFileTags(e.target.value)}
                    placeholder="Tags"
                    style={{
                      padding: "6px 10px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <textarea
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="Description"
                    rows={2}
                    style={{
                      gridColumn: "1 / -1",
                      padding: "6px 10px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: F.sans,
                      resize: "vertical",
                    }}
                  />
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      gap: 10,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingResource(null);
                        setFileTitle("");
                        setFileDescription("");
                        setFileTags("");
                      }}
                      style={{
                        padding: "6px 14px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleUpdate(resource._id, {
                          title: fileTitle,
                          description: fileDescription,
                          tags: fileTags,
                        });
                      }}
                      style={{
                        padding: "6px 16px",
                        background: C.primary,
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <FiCheck size={14} /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: "92%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", color: C.dark }}>
              Delete Resource?
            </h3>
            <p style={{ fontSize: 13, color: C.muted }}>
              This action cannot be undone. The file will be permanently
              deleted.
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: "8px 16px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                style={{
                  padding: "8px 20px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
