// components/golden-monday/GalleryGrid.jsx
// Golden Monday Gallery with categories, lightbox, multi-upload, AI categorization, delete modal, clear all, and auto-clear

import { useState, useEffect, useCallback, useRef } from "react";
import { C, F } from "../../styles/theme";
import { goldenMondayAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { showToast } from "../../utils/toastHelper";
import { goldenMondayTranslations } from "../../constants/goldenMondayTranslations";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiUpload,
  FiTrash2,
  FiLoader,
  FiCheck,
  FiAlertCircle,
  FiCpu,
  FiClock,
  FiSettings,
  FiCalendar,
} from "react-icons/fi";

export default function GalleryGrid({ sessionId = null, onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isInitialMount = useRef(true);

  // Get translations based on language
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);

  // ── Delete Modal State ──
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    photoId: null,
    photoTitle: "",
  });
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // ── Clear All Modal State ──
  const [clearAllModal, setClearAllModal] = useState({
    isOpen: false,
    category: "all",
  });

  // ── Auto-Clear Settings State ──
  const [autoClearSettings, setAutoClearSettings] = useState({
    enabled: false,
    period: "30", // days
    category: "all",
    lastRun: null,
  });
  const [showAutoClearSettings, setShowAutoClearSettings] = useState(false);

  // ── Use ref for autoClearSettings to avoid dependency issues ──
  const autoClearSettingsRef = useRef(autoClearSettings);

  // Update ref when autoClearSettings changes
  useEffect(() => {
    autoClearSettingsRef.current = autoClearSettings;
  }, [autoClearSettings]);

  // Check if user has previously set "don't ask again"
  useEffect(() => {
    const savedPreference = localStorage.getItem("galleryDeleteDontAskAgain");
    if (savedPreference === "true") {
      setDontAskAgain(true);
    }

    // Load auto-clear settings from localStorage
    const savedAutoClear = localStorage.getItem("galleryAutoClearSettings");
    if (savedAutoClear) {
      try {
        const parsed = JSON.parse(savedAutoClear);
        setAutoClearSettings(parsed);
      } catch (e) {
        console.error("Failed to parse auto-clear settings:", e);
      }
    }
  }, []);

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  // Category labels with translations - memoized to avoid recreation
  const getCategoryLabel = useCallback(
    (cat) => {
      const categoryMap = {
        all: t.allPhotos || "All Photos",
        "flag-raising": t.flagRaising || "🇪🇹 Flag Raising",
        presentation: t.presentations || "🎤 Presentations",
        "group-photo": t.groupPhotos || "📸 Group Photos",
        attendees: t.attendees || "👥 Attendees",
        event: t.events || "🎉 Events",
        other: t.other || "📁 Other",
      };
      return categoryMap[cat] || cat;
    },
    [
      t.allPhotos,
      t.flagRaising,
      t.presentations,
      t.groupPhotos,
      t.attendees,
      t.events,
      t.other,
    ],
  );

  // Categories with translations - memoized to avoid recreation
  const CATEGORIES = useCallback(
    () => [
      { value: "all", label: t.allPhotos || "All Photos" },
      {
        value: "flag-raising",
        label: t.flagRaising || "🇪🇹 Flag Raising",
        icon: "🇪🇹",
      },
      {
        value: "presentation",
        label: t.presentations || "🎤 Presentations",
        icon: "🎤",
      },
      {
        value: "group-photo",
        label: t.groupPhotos || "📸 Group Photos",
        icon: "📸",
      },
      { value: "attendees", label: t.attendees || "👥 Attendees", icon: "👥" },
      { value: "event", label: t.events || "🎉 Events", icon: "🎉" },
      { value: "other", label: t.other || "📁 Other", icon: "📁" },
    ],
    [
      t.allPhotos,
      t.flagRaising,
      t.presentations,
      t.groupPhotos,
      t.attendees,
      t.events,
      t.other,
    ],
  );

  const categories = CATEGORIES();

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
      showToast(t.loadError || "Failed to load gallery photos", "error");
    } finally {
      setLoading(false);
    }
  }, [page, category, sessionId, language, t.loadError]);

  // Effect for data fetching
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadGallery();
    } else {
      loadGallery();
    }
  }, [loadGallery]);

  // ─── Auto-Clear Check - FIXED with proper dependencies ──
  useEffect(() => {
    const settings = autoClearSettingsRef.current;
    if (!settings.enabled) return;

    const checkAndClear = async () => {
      const now = Date.now();
      const lastRun = settings.lastRun
        ? new Date(settings.lastRun).getTime()
        : 0;
      const periodDays = parseInt(settings.period) || 30;
      const periodMs = periodDays * 24 * 60 * 60 * 1000;

      if (now - lastRun >= periodMs) {
        console.log(
          `[Auto-Clear] Running scheduled clear (${periodDays} days)`,
        );
        try {
          const filter =
            settings.category !== "all" ? { category: settings.category } : {};

          // Get photos to delete
          const response = await goldenMondayAPI.getGallery({
            ...filter,
            limit: 1000,
          });
          const photosToDelete = response.data.photos || [];

          if (photosToDelete.length === 0) {
            console.log("[Auto-Clear] No photos to delete");
            // Update last run even if no photos
            const newSettings = {
              ...settings,
              lastRun: new Date().toISOString(),
            };
            setAutoClearSettings(newSettings);
            localStorage.setItem(
              "galleryAutoClearSettings",
              JSON.stringify(newSettings),
            );
            return;
          }

          // Delete each photo
          let deletedCount = 0;
          for (const photo of photosToDelete) {
            try {
              await goldenMondayAPI.deleteGalleryPhoto(photo._id);
              deletedCount++;
            } catch (e) {
              console.error(`Failed to delete photo ${photo._id}:`, e);
            }
          }

          const categoryLabel = getCategoryLabel(settings.category);
          showToast(
            `Auto-cleared ${deletedCount} photo${deletedCount > 1 ? "s" : ""} (${categoryLabel})`,
            "success",
          );

          // Update last run
          const newSettings = {
            ...settings,
            lastRun: new Date().toISOString(),
          };
          setAutoClearSettings(newSettings);
          localStorage.setItem(
            "galleryAutoClearSettings",
            JSON.stringify(newSettings),
          );

          // Refresh gallery
          await loadGallery();
          if (onRefresh) onRefresh();
        } catch (error) {
          console.error("[Auto-Clear] Failed:", error);
        }
      }
    };

    // Check on mount and then periodically
    checkAndClear();
    const interval = setInterval(checkAndClear, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [getCategoryLabel, loadGallery, onRefresh]);

  // AI Auto-Categorization function
  const analyzeAndCategorizePhoto = async (imageData) => {
    try {
      const response = await goldenMondayAPI.analyzeGalleryPhoto({
        image: imageData,
        sessionId: sessionId || undefined,
      });
      return response.data;
    } catch (error) {
      console.error("AI categorization failed:", error);
      return { category: "other", confidence: 0 };
    }
  };

  // Handle multiple file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        showToast(
          `${file.name}: ${t.selectImage || "Please select an image file"}`,
          "warning",
        );
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast(
          `${file.name}: ${t.imageTooLarge || "Image must be less than 10MB"}`,
          "warning",
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to upload queue
    const newQueue = validFiles.map((file) => ({
      file,
      id: Date.now() + Math.random(),
      status: "pending",
      progress: 0,
      category: category !== "all" ? category : null,
      error: null,
    }));

    setUploadQueue((prev) => [...prev, ...newQueue]);

    // Start upload process
    processUploadQueue(newQueue);

    // Reset input
    e.target.value = "";
  };

  // Process upload queue
  const processUploadQueue = async (queue = uploadQueue) => {
    if (uploading) return;
    if (queue.length === 0) return;

    setUploading(true);

    const pendingItems = queue.filter((item) => item.status === "pending");
    if (pendingItems.length === 0) {
      setUploading(false);
      return;
    }

    // Process one at a time to avoid overloading
    const item = pendingItems[0];

    try {
      // Update status to uploading
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "uploading", progress: 10 } : q,
        ),
      );

      // Convert to base64
      const imageData = await fileToBase64(item.file);

      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, progress: 30 } : q)),
      );

      // AI Auto-Categorization (if no category selected)
      let detectedCategory = item.category;
      let aiConfidence = 0;

      if (!detectedCategory) {
        setIsAIAnalyzing(true);
        try {
          const aiResult = await analyzeAndCategorizePhoto(imageData);
          detectedCategory = aiResult.category || "other";
          aiConfidence = aiResult.confidence || 0;

          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    progress: 50,
                    aiCategory: detectedCategory,
                    aiConfidence,
                  }
                : q,
            ),
          );
        } catch (aiError) {
          console.warn("AI analysis failed, using fallback:", aiError);
          detectedCategory = "other";
        } finally {
          setIsAIAnalyzing(false);
        }
      } else {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress: 50 } : q)),
        );
      }

      // Upload to server
      await goldenMondayAPI.uploadGalleryPhoto({
        image: imageData,
        category: detectedCategory,
        sessionId: sessionId || undefined,
        lang: language,
      });

      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: "completed",
                progress: 100,
                category: detectedCategory,
              }
            : q,
        ),
      );

      const categoryLabel = getCategoryLabel(detectedCategory);
      showToast(
        `${item.file.name}: ${t.uploadSuccess || "Photo uploaded successfully!"}${detectedCategory !== "other" ? ` (${categoryLabel})` : ""}`,
        "success",
      );

      // Remove from queue after delay
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((q) => q.id !== item.id));
      }, 2000);

      // Refresh gallery
      await loadGallery();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: "error", error: error.message || "Upload failed" }
            : q,
        ),
      );
      showToast(
        `${item.file.name}: ${t.uploadError || "Failed to upload photo"}`,
        "error",
      );
    } finally {
      setIsAIAnalyzing(false);
      // Process next item
      setUploadQueue((prev) => {
        const remaining = prev.filter((q) => q.status === "pending");
        if (remaining.length > 0) {
          setTimeout(() => processUploadQueue(prev), 500);
        } else {
          setUploading(false);
        }
        return prev;
      });
    }
  };

  // Remove a file from queue
  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  // ─── Open Delete Confirmation Modal ──
  const openDeleteModal = (photoId, photoTitle) => {
    // If "don't ask again" is checked, delete immediately
    if (dontAskAgain) {
      confirmDelete(photoId);
      return;
    }
    setDeleteModal({ isOpen: true, photoId, photoTitle });
  };

  // ─── Close Delete Confirmation Modal ──
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, photoId: null, photoTitle: "" });
  };

  // ─── Confirm Delete ──
  const confirmDelete = async (photoId) => {
    try {
      await goldenMondayAPI.deleteGalleryPhoto(photoId);
      showToast(t.deleteSuccess || "Photo deleted", "success");
      await loadGallery();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Delete error:", error);
      showToast(t.deleteError || "Failed to delete photo", "error");
    } finally {
      closeDeleteModal();
    }
  };

  // ─── Handle Delete with Modal ──
  const handleDelete = (photoId) => {
    const photo = photos.find((p) => p._id === photoId);
    const photoTitle =
      photo?.title || photo?.caption || t.untitled || "Untitled";
    openDeleteModal(photoId, photoTitle);
  };

  // ─── Handle "Don't Ask Again" Toggle ──
  const handleDontAskAgainToggle = (e) => {
    const checked = e.target.checked;
    setDontAskAgain(checked);
    if (checked) {
      localStorage.setItem("galleryDeleteDontAskAgain", "true");
    } else {
      localStorage.removeItem("galleryDeleteDontAskAgain");
    }
  };

  // ─── Clear All Photos - FIXED ──
  const clearAllPhotos = async () => {
    try {
      // Get all photos from the current view (respecting the current category filter)
      const params = {
        limit: 1000,
        page: 1,
      };

      // If a specific category is selected in the modal, filter by it
      if (clearAllModal.category !== "all") {
        params.category = clearAllModal.category;
      }

      const response = await goldenMondayAPI.getGallery(params);
      const photosToDelete = response.data.photos || [];

      if (photosToDelete.length === 0) {
        showToast(
          `No photos found in ${clearAllModal.category !== "all" ? getCategoryLabel(clearAllModal.category) : "all categories"}`,
          "info",
        );
        setClearAllModal({ isOpen: false, category: "all" });
        return;
      }

      // Confirm with user before proceeding with bulk delete
      const confirmMessage = `This will permanently delete ${photosToDelete.length} photo${photosToDelete.length > 1 ? "s" : ""} from ${clearAllModal.category !== "all" ? getCategoryLabel(clearAllModal.category) : "all categories"}. This action cannot be undone!`;
      if (!window.confirm(confirmMessage)) {
        return;
      }

      let deletedCount = 0;
      let failedCount = 0;

      // Delete each photo one by one with proper error handling
      for (const photo of photosToDelete) {
        try {
          await goldenMondayAPI.deleteGalleryPhoto(photo._id);
          deletedCount++;
        } catch (e) {
          console.error(`Failed to delete photo ${photo._id}:`, e);
          failedCount++;
        }
      }

      const categoryLabel =
        clearAllModal.category !== "all"
          ? getCategoryLabel(clearAllModal.category)
          : "all categories";

      if (deletedCount > 0) {
        showToast(
          `Successfully cleared ${deletedCount} photo${deletedCount > 1 ? "s" : ""} from ${categoryLabel}${failedCount > 0 ? ` (${failedCount} failed)` : ""}`,
          failedCount > 0 ? "warning" : "success",
        );
      } else if (failedCount > 0) {
        showToast(
          `Failed to clear ${failedCount} photo${failedCount > 1 ? "s" : ""}. Please try again.`,
          "error",
        );
      }

      setClearAllModal({ isOpen: false, category: "all" });
      await loadGallery();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Clear all error:", error);
      showToast("Failed to clear photos. Please try again.", "error");
    }
  };

  // ─── Open Clear All Modal ──
  const openClearAllModal = () => {
    setClearAllModal({ isOpen: true, category: "all" });
  };

  // ─── Close Clear All Modal ──
  const closeClearAllModal = () => {
    setClearAllModal({ isOpen: false, category: "all" });
  };

  // ─── Auto-Clear Settings ──
  const updateAutoClearSettings = (key, value) => {
    const newSettings = { ...autoClearSettings, [key]: value };
    setAutoClearSettings(newSettings);
    localStorage.setItem(
      "galleryAutoClearSettings",
      JSON.stringify(newSettings),
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(language, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
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
          {categories.map((cat) => (
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

        <div
          style={{
            display: "flex",
            gap: 6,
            marginLeft: "auto",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {isAdmin && (
            <>
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
                {uploading || uploadQueue.length > 0 ? (
                  <>
                    <FiLoader
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    {isAIAnalyzing ? "AI Analyzing..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <FiUpload size={14} /> {t.upload || "Upload"}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>

              {/* Clear All Button */}
              <button
                onClick={openClearAllModal}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid #fca5a5`,
                  background: "#fee2e2",
                  color: "#dc2626",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: F.sans,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fecaca";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                }}
              >
                <FiTrash2 size={14} />
                Clear All
              </button>

              {/* Auto-Clear Settings Button */}
              <button
                onClick={() => setShowAutoClearSettings(!showAutoClearSettings)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${autoClearSettings.enabled ? C.primary : C.border}`,
                  background: autoClearSettings.enabled
                    ? C.primary + "15"
                    : "transparent",
                  color: autoClearSettings.enabled ? C.primary : C.muted,
                  fontSize: 12,
                  fontWeight: autoClearSettings.enabled ? 600 : 400,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: F.sans,
                  transition: "all 0.2s ease",
                }}
              >
                <FiClock size={14} />
                Auto-Clear
                {autoClearSettings.enabled && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#10b981",
                      display: "inline-block",
                    }}
                  />
                )}
              </button>

              {/* AI Auto-Categorization Indicator */}
              {uploadQueue.some((q) => q.aiCategory) && (
                <span
                  style={{
                    fontSize: 11,
                    color: C.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <FiCpu size={14} />
                  AI Categorizing
                </span>
              )}
            </>
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
            aria-label={t.gridView || "Grid view"}
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
            aria-label={t.listView || "List view"}
          >
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Auto-Clear Settings Panel */}
      {showAutoClearSettings && isAdmin && (
        <div
          style={{
            marginBottom: 16,
            padding: "16px 20px",
            borderRadius: 12,
            background: C.white,
            border: `1px solid ${C.border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FiSettings size={18} color={C.primary} />
              <span style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                Auto-Clear Settings
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: autoClearSettings.enabled ? "#10b981" : C.muted,
                  fontWeight: 500,
                }}
              >
                {autoClearSettings.enabled ? "● Active" : "○ Disabled"}
              </span>
            </div>
            <button
              onClick={() => setShowAutoClearSettings(false)}
              style={{
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <FiX size={18} />
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ fontSize: 13, color: C.dark, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoClearSettings.enabled}
                  onChange={(e) =>
                    updateAutoClearSettings("enabled", e.target.checked)
                  }
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: C.primary,
                    cursor: "pointer",
                    marginRight: 6,
                  }}
                />
                Enable Auto-Clear
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13, color: C.dark }}>
                <FiCalendar size={14} style={{ marginRight: 4 }} />
                Clear every:
              </label>
              <select
                value={autoClearSettings.period}
                onChange={(e) =>
                  updateAutoClearSettings("period", e.target.value)
                }
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  fontSize: 12,
                  background: C.white,
                  outline: "none",
                }}
                disabled={!autoClearSettings.enabled}
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13, color: C.dark }}>Category:</label>
              <select
                value={autoClearSettings.category}
                onChange={(e) =>
                  updateAutoClearSettings("category", e.target.value)
                }
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  fontSize: 12,
                  background: C.white,
                  outline: "none",
                }}
                disabled={!autoClearSettings.enabled}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {autoClearSettings.lastRun && (
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiClock size={12} />
                Last run: {new Date(autoClearSettings.lastRun).toLocaleString()}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              borderRadius: 6,
              background: "#fef3c7",
              fontSize: 11,
              color: "#92400e",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FiAlertCircle size={14} />
            Photos will be automatically deleted based on the selected period
            and category.
            {autoClearSettings.enabled
              ? " Auto-clear is active."
              : " Enable to activate."}
          </div>
        </div>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 8,
            background: C.bg,
            border: `1px solid ${C.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>
              Uploading {uploadQueue.length} file
              {uploadQueue.length > 1 ? "s" : ""}
            </span>
            {isAIAnalyzing && (
              <span
                style={{
                  fontSize: 12,
                  color: C.primary,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiCpu size={14} /> AI analyzing...
              </span>
            )}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: C.white,
                  border: `1px solid ${
                    item.status === "error"
                      ? "#fecaca"
                      : item.status === "completed"
                        ? "#6ee7b7"
                        : C.border
                  }`,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background:
                      item.status === "completed"
                        ? "#d1fae5"
                        : item.status === "error"
                          ? "#fee2e2"
                          : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {item.status === "completed" && (
                    <FiCheck size={14} color="#065f46" />
                  )}
                  {item.status === "error" && (
                    <FiAlertCircle size={14} color="#991b1b" />
                  )}
                  {item.status === "uploading" && (
                    <FiLoader
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                  )}
                  {item.status === "pending" && <span>⏳</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: C.dark,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.file.name}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: "#e5e7eb",
                        overflow: "hidden",
                        maxWidth: 150,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${item.progress || 0}%`,
                          borderRadius: 2,
                          background:
                            item.status === "error"
                              ? "#ef4444"
                              : item.status === "completed"
                                ? "#10b981"
                                : C.primary,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: C.muted }}>
                      {item.progress || 0}%
                    </span>
                    {item.aiCategory && (
                      <span
                        style={{
                          fontSize: 9,
                          color: C.primary,
                          background: C.primary + "11",
                          padding: "1px 6px",
                          borderRadius: 10,
                        }}
                      >
                        {getCategoryLabel(item.aiCategory)}
                      </span>
                    )}
                  </div>
                </div>
                {item.status === "pending" && (
                  <button
                    onClick={() => removeFromQueue(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#999",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
          <p>{t.loadingGallery || "Loading gallery..."}</p>
        </div>
      ) : photos.length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
          <p style={{ fontSize: 16, marginBottom: 4 }}>
            {t.noPhotos || "No photos yet"}
          </p>
          <p style={{ fontSize: 13, color: "#999" }}>
            {isAdmin
              ? t.uploadPhotos || "Upload photos from Golden Monday events"
              : t.checkBackLater || "Check back later for photos"}
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
                  aria-label={t.delete || "Delete photo"}
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
                  {photo.title || photo.caption || t.untitled || "Untitled"}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  {getCategoryLabel(photo.category)} •{" "}
                  {formatDate(photo.createdAt)}
                  {photo.uploadedByName && (
                    <>
                      {" "}
                      • {t.by || "By"} {photo.uploadedByName}
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
                  aria-label={t.delete || "Delete photo"}
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
            {t.page || "Page"} {page} {t.of || "of"} {totalPages}
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

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deleteModal.isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.3s ease",
            }}
            onClick={closeDeleteModal}
          >
            {/* Modal */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "clamp(24px, 4vw, 32px)",
                maxWidth: 450,
                width: "92%",
                boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                position: "relative",
                animation: "slideUp 0.3s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeDeleteModal}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#999",
                  padding: "4px",
                }}
                aria-label="Close"
              >
                <FiX size={20} />
              </button>

              {/* Icon */}
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

              {/* Title */}
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: "clamp(16px, 2.5vw, 20px)",
                  fontWeight: 700,
                  color: C.dark,
                  textAlign: "center",
                  fontFamily: F.serif,
                }}
              >
                {t.deleteConfirmTitle || "Delete Photo?"}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: 14,
                  color: C.muted,
                  textAlign: "center",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                {t.deleteConfirmMessage || "Are you sure you want to delete"}
                <strong style={{ color: C.dark }}>
                  {" "}
                  "{deleteModal.photoTitle || "Untitled"}"
                </strong>
                ? {t.deleteWarning || "This action cannot be undone."}
              </p>

              {/* "Don't ask again" Checkbox */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                  padding: "8px 12px",
                  background: C.bg,
                  borderRadius: 8,
                }}
              >
                <input
                  type="checkbox"
                  id="dontAskAgain"
                  checked={dontAskAgain}
                  onChange={handleDontAskAgainToggle}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: C.primary,
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor="dontAskAgain"
                  style={{
                    fontSize: 13,
                    color: C.dark,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  {t.dontAskAgain || "Don't ask me again"}
                </label>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={closeDeleteModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.dark,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: F.sans,
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  onClick={() => confirmDelete(deleteModal.photoId)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: F.sans,
                    transition: "background 0.2s ease, transform 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
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
            </div>
          </div>
        </>
      )}

      {/* ─── CLEAR ALL CONFIRMATION MODAL ─── */}
      {clearAllModal.isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.3s ease",
            }}
            onClick={closeClearAllModal}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "clamp(24px, 4vw, 32px)",
                maxWidth: 450,
                width: "92%",
                boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                position: "relative",
                animation: "slideUp 0.3s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeClearAllModal}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 16,
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#999",
                  padding: "4px",
                }}
              >
                <FiX size={20} />
              </button>

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
                  fontSize: "clamp(16px, 2.5vw, 20px)",
                  fontWeight: 700,
                  color: C.dark,
                  textAlign: "center",
                  fontFamily: F.serif,
                }}
              >
                {t.clearAllTitle || "Clear All Photos?"}
              </h3>

              <p
                style={{
                  fontSize: 14,
                  color: C.muted,
                  textAlign: "center",
                  marginBottom: 16,
                  lineHeight: 1.6,
                }}
              >
                {t.clearAllMessage ||
                  "This will permanently delete all photos in the selected category."}
                <br />
                <strong style={{ color: "#dc2626" }}>
                  {t.deleteWarning || "This action cannot be undone!"}
                </strong>
              </p>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    fontSize: 13,
                    color: C.dark,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {t.category || "Category"}:
                </label>
                <select
                  value={clearAllModal.category}
                  onChange={(e) =>
                    setClearAllModal((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontSize: 13,
                    background: C.white,
                    outline: "none",
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={closeClearAllModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.dark,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: F.sans,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  onClick={clearAllPhotos}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: F.sans,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#b91c1c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                  }}
                >
                  <FiTrash2 size={14} />
                  {t.clearAll || "Clear All"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
