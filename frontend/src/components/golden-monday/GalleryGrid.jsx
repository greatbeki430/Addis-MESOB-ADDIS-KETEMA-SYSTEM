// components/golden-monday/GalleryGrid.jsx
// Golden Monday Gallery with categories and lightbox

import { useState, useEffect, useCallback, useRef } from "react";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { showToast } from "../../utils/toastHelper";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiUpload,
  FiTrash2,
} from "react-icons/fi";

const CATEGORIES = [
  { value: "all", label: "All Photos" },
  { value: "flag-raising", label: "🇪🇹 Flag Raising", icon: "🇪🇹" },
  { value: "presentation", label: "🎤 Presentations", icon: "🎤" },
  { value: "group-photo", label: "📸 Group Photos", icon: "📸" },
  { value: "attendees", label: "👥 Attendees", icon: "👥" },
  { value: "event", label: "🎉 Events", icon: "🎉" },
  { value: "other", label: "📁 Other", icon: "📁" },
];

// Translations
const TRANSLATIONS = {
  en: {
    loading: "Loading gallery...",
    noPhotos: "No photos yet",
    uploadPhotos: "Upload photos from Golden Monday events",
    checkBackLater: "Check back later for photos",
    untitled: "Untitled",
    upload: "Upload",
    uploading: "Uploading...",
    deleteConfirm: "Delete this photo?",
    deleteSuccess: "Photo deleted",
    deleteError: "Failed to delete photo",
    uploadSuccess: "Photo uploaded successfully!",
    uploadError: "Failed to upload photo",
    selectImage: "Please select an image file",
    imageTooLarge: "Image must be less than 10MB",
    loadError: "Failed to load gallery photos",
    page: "Page",
    of: "of",
    by: "By",
  },
  am: {
    loading: "ምስሎች በመጫን ላይ...",
    noPhotos: "ምንም ፎቶዎች የሉም",
    uploadPhotos: "ከጎልደን ሰኞ ዝግጅቶች ፎቶዎችን ያስገቡ",
    checkBackLater: "ለፎቶዎች በኋላ ይመለሱ",
    untitled: "ርዕስ የሌለው",
    upload: "አስገባ",
    uploading: "በማስገባት ላይ...",
    deleteConfirm: "ይህን ፎቶ መሰረዝ ይፈልጋሉ?",
    deleteSuccess: "ፎቶ ተሰርዟል",
    deleteError: "ፎቶ መሰረዝ አልተቻለም",
    uploadSuccess: "ፎቶ በተሳካ ሁኔታ ተስተካክሏል!",
    uploadError: "ፎቶ ማስገባት አልተቻለም",
    selectImage: "እባክዎ የምስል ፋይል ይምረጡ",
    imageTooLarge: "ምስሉ ከ10ሜባ በታች መሆን አለበት",
    loadError: "የጋለሪ ፎቶዎችን ማግኘት አልተቻለም",
    page: "ገጽ",
    of: "ከ",
    by: "በ",
  },
};

export default function GalleryGrid({ sessionId = null, onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isInitialMount = useRef(true);

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [uploading, setUploading] = useState(false);

  // Get translations based on language
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        lang: language,
      };
      if (category !== "all") params.category = category;
      if (sessionId) params.session = sessionId;

      const response = await goldenMondayAPI.getGallery(params);
      setPhotos(response.data.photos || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error("Failed to load gallery:", error);
      showToast(t.loadError, "error");
    } finally {
      setLoading(false);
    }
  }, [page, category, sessionId, language, t.loadError]);

  // Effect for data fetching
  useEffect(() => {
    // Skip the first render if it's the initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadGallery();
    } else {
      loadGallery();
    }
  }, [loadGallery]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast(t.selectImage, "warning");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast(t.imageTooLarge, "warning");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await goldenMondayAPI.uploadGalleryPhoto({
            image: reader.result,
            category: category !== "all" ? category : "other",
            sessionId: sessionId || undefined,
            lang: language,
          });
          showToast(t.uploadSuccess, "success");
          await loadGallery();
          if (onRefresh) onRefresh();
        } catch (err) {
          console.error("Upload error:", err);
          showToast(t.uploadError, "error");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      showToast(t.uploadError, "error");
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      await goldenMondayAPI.deleteGalleryPhoto(photoId);
      showToast(t.deleteSuccess, "success");
      await loadGallery();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Delete error:", error);
      showToast(t.deleteError, "error");
    }
  };

  const getCategoryLabel = (cat) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found ? found.label : cat;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(language, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div style={{ fontFamily: F.sans }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1px solid ${category === cat.value ? C.primary : C.border}`,
                background: category === cat.value ? C.primary : "transparent",
                color: category === cat.value ? "#fff" : C.muted,
                fontSize: 12,
                fontWeight: category === cat.value ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: F.sans,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {isAdmin && (
            <label
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: `1px dashed ${C.primary}`,
                background: C.primary + "11",
                color: C.primary,
                fontSize: 12,
                cursor: uploading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                opacity: uploading ? 0.6 : 1,
              }}
            >
              {uploading ? (
                t.uploading
              ) : (
                <>
                  <FiUpload size={14} /> {t.upload}
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                style={{ display: "none" }}
                disabled={uploading}
              />
            </label>
          )}
          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${viewMode === "grid" ? C.primary : C.border}`,
              background: viewMode === "grid" ? C.primary : "transparent",
              color: viewMode === "grid" ? "#fff" : C.muted,
              cursor: "pointer",
            }}
            aria-label="Grid view"
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: `1px solid ${viewMode === "list" ? C.primary : C.border}`,
              background: viewMode === "list" ? C.primary : "transparent",
              color: viewMode === "list" ? "#fff" : C.muted,
              cursor: "pointer",
            }}
            aria-label="List view"
          >
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
          <p>{t.loading}</p>
        </div>
      ) : photos.length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
          <p style={{ fontSize: 16, marginBottom: 4 }}>{t.noPhotos}</p>
          <p style={{ fontSize: 13, color: "#999" }}>
            {isAdmin ? t.uploadPhotos : t.checkBackLater}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {photos.map((photo) => (
            <div
              key={photo._id}
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                cursor: "pointer",
                aspectRatio: "1/1",
                background: C.bg,
                border: `1px solid ${C.border}`,
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.title || photo.caption || "Golden Monday"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                loading="lazy"
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "6px 10px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                  color: "#fff",
                  fontSize: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {photo.category && getCategoryLabel(photo.category)}
                </span>
                <span style={{ opacity: 0.7 }}>
                  {formatDate(photo.createdAt)}
                </span>
              </div>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo._id);
                  }}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.9)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Delete photo"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        // List view
        <div style={{ display: "grid", gap: 8 }}>
          {photos.map((photo) => (
            <div
              key={photo._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.white,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.white;
              }}
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.title || photo.caption || "Golden Monday"}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 6,
                  objectFit: "cover",
                }}
                loading="lazy"
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.dark, fontSize: 13 }}>
                  {photo.title || photo.caption || t.untitled}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {getCategoryLabel(photo.category)} •{" "}
                  {formatDate(photo.createdAt)}
                  {photo.uploadedByName && (
                    <>
                      {" "}
                      • {t.by} {photo.uploadedByName}
                    </>
                  )}
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo._id);
                  }}
                  style={{
                    padding: "4px 10px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 11,
                  }}
                  aria-label="Delete photo"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: page === 1 ? "#f3f4f6" : C.white,
              color: page === 1 ? "#999" : C.dark,
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
            aria-label="Previous page"
          >
            <FiChevronLeft size={14} />
          </button>
          <span style={{ padding: "6px 12px", color: C.muted, fontSize: 13 }}>
            {t.page} {page} {t.of} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: page === totalPages ? "#f3f4f6" : C.white,
              color: page === totalPages ? "#999" : C.dark,
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
            aria-label="Next page"
          >
            <FiChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
        >
          <div
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url}
              alt={
                selectedPhoto.title || selectedPhoto.caption || "Golden Monday"
              }
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: 8,
                objectFit: "contain",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -40,
                left: 0,
                right: 0,
                color: "#fff",
                textAlign: "center",
                fontSize: 13,
              }}
            >
              {selectedPhoto.title || selectedPhoto.caption || ""}
              {selectedPhoto.category && (
                <span style={{ opacity: 0.7, marginLeft: 10 }}>
                  {getCategoryLabel(selectedPhoto.category)}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                color: "#fff",
                cursor: "pointer",
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Close lightbox"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
