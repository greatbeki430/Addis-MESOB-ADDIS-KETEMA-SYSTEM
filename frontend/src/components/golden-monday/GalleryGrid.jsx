// components/golden-monday/GalleryGrid.jsx
// ============================================================
// 🖼️ GOLDEN MONDAY GALLERY - Premium Masonry Layout with Glassmorphism
// Supports AI Categorization, Auto-Clear, Bulk Actions, and Lightbox
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FiArrowLeft,
  FiFolder,
  FiDownload,
  FiPlus,
  FiMinus,
  FiMaximize2,
  FiMinimize2,
  FiRotateCw,
} from "react-icons/fi";

// Import components
import GalleryItem from "./GalleryItem";
import GalleryUploader from "./GalleryUploader";

// ─────────────────────────────────────────────────────────────────────────────
// GLASSMORPHISM STYLES
// ─────────────────────────────────────────────────────────────────────────────
const glass = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_AUTO_CLEAR_SETTINGS = {
  enabled: false,
  period: "30",
  category: "all",
  lastRun: null,
};

function getInitialDontAskAgain() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("galleryDeleteDontAskAgain") === "true";
}

function getInitialAutoClearSettings() {
  if (typeof window === "undefined") return DEFAULT_AUTO_CLEAR_SETTINGS;
  try {
    const saved = localStorage.getItem("galleryAutoClearSettings");
    return saved ? JSON.parse(saved) : DEFAULT_AUTO_CLEAR_SETTINGS;
  } catch (e) {
    console.error("Failed to parse auto-clear settings:", e);
    return DEFAULT_AUTO_CLEAR_SETTINGS;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function GalleryGrid({ sessionId = null, onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isInitialMount = useRef(true);

  // Get translations based on language
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  // ── Core State ──
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState("grid");

  // ── Folder Navigation State ──
  const [currentFolder, setCurrentFolder] = useState(null);

  // ── Upload State ──
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // ── Delete Modal State ──
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    photoId: null,
    photoTitle: "",
  });
  const [dontAskAgain, setDontAskAgain] = useState(getInitialDontAskAgain);

  // ── Clear All Modal State ──
  const [clearAllModal, setClearAllModal] = useState({
    isOpen: false,
    category: "all",
  });

  // ── Auto-Clear Settings State ──
  const [autoClearSettings, setAutoClearSettings] = useState(
    getInitialAutoClearSettings,
  );
  const [showAutoClearSettings, setShowAutoClearSettings] = useState(false);
  const autoClearSettingsRef = useRef(autoClearSettings);

  // ── Lightbox State ──
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ── Drag State ──
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Update ref when autoClearSettings changes
  useEffect(() => {
    autoClearSettingsRef.current = autoClearSettings;
  }, [autoClearSettings]);

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  // ── Category labels with translations ──
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
    [t],
  );

  // ── Categories list with icons ──
  const CATEGORIES = [
    {
      value: "all",
      label: t.allPhotos || "All Photos",
      icon: "🖼️",
      color: C.primary,
    },
    {
      value: "flag-raising",
      label: t.flagRaising || "🇪🇹 Flag Raising",
      icon: "🇪🇹",
      color: "#ef4444",
    },
    {
      value: "presentation",
      label: t.presentations || "🎤 Presentations",
      icon: "🎤",
      color: "#8b5cf6",
    },
    {
      value: "group-photo",
      label: t.groupPhotos || "📸 Group Photos",
      icon: "📸",
      color: "#10b981",
    },
    {
      value: "attendees",
      label: t.attendees || "👥 Attendees",
      icon: "👥",
      color: "#3b82f6",
    },
    {
      value: "event",
      label: t.events || "🎉 Events",
      icon: "🎉",
      color: "#f59e0b",
    },
    {
      value: "other",
      label: t.other || "📁 Other",
      icon: "📁",
      color: "#6b7280",
    },
  ];

  // ── Helper functions for modals ──
  const closeClearAllModal = () =>
    setClearAllModal({ isOpen: false, category: "all" });

  // ── Data Fetching (Folders vs. Photos with Category Support) ──
  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 24,
        lang: language,
      };

      // Case 1: We're inside a folder - show files with category filter
      if (currentFolder) {
        params.folderId = currentFolder._id;
        if (category !== "all") params.category = category;
        const response = await goldenMondayAPI.getGallery(params);
        setItems(response.data.photos || []);
        setTotalPages(response.data.pagination?.pages || 1);
        return;
      }

      // Case 2: Category filter is active at top level - show all files matching category
      if (category !== "all") {
        params.category = category;
        if (sessionId) params.session = sessionId;
        const response = await goldenMondayAPI.getGallery(params);
        setItems(response.data.photos || []);
        setTotalPages(response.data.pagination?.pages || 1);
        return;
      }

      // Case 3: Default - show folders at top level
      if (sessionId) params.session = sessionId;
      const response = await goldenMondayAPI.getFolders(params);
      setItems(response.data.folders || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error("Failed to load gallery:", error);
      showToast(t.loadError || "Failed to load gallery", "error");
    } finally {
      setLoading(false);
    }
  }, [page, category, currentFolder, sessionId, language, t.loadError]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadGallery();
    } else {
      loadGallery();
    }
  }, [loadGallery]);

  // ─── Auto-Clear Check ──
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
          const response = await goldenMondayAPI.getGallery({
            ...filter,
            limit: 1000,
          });
          const photosToDelete = response.data.photos || [];

          if (photosToDelete.length === 0) {
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

          const newSettings = {
            ...settings,
            lastRun: new Date().toISOString(),
          };
          setAutoClearSettings(newSettings);
          localStorage.setItem(
            "galleryAutoClearSettings",
            JSON.stringify(newSettings),
          );

          await loadGallery();
          if (onRefresh) onRefresh();
        } catch (error) {
          console.error("[Auto-Clear] Failed:", error);
        }
      }
    };

    checkAndClear();
    const interval = setInterval(checkAndClear, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getCategoryLabel, loadGallery, onRefresh]);

  // ─── AI & Upload Logic ──
  const analyzeAndCategorizePhoto = useCallback(
    async (imageData) => {
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
    },
    [sessionId],
  );

  const resolveUploadCategory = useCallback(
    async (item, imageData) => {
      if (item.category) return item.category;

      setIsAIAnalyzing(true);
      try {
        const aiResult = await analyzeAndCategorizePhoto(imageData);
        return aiResult.category || "other";
      } catch {
        return "other";
      } finally {
        setIsAIAnalyzing(false);
      }
    },
    [analyzeAndCategorizePhoto],
  );

  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // ─── Handle File Selection ──
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const allowedTypes = {
      image: { mimes: ["image/"], maxSize: 10 * 1024 * 1024 },
      pdf: { mimes: ["application/pdf"], maxSize: 10 * 1024 * 1024 },
      presentation: {
        mimes: [
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        maxSize: 10 * 1024 * 1024,
      },
      document: {
        mimes: [
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maxSize: 10 * 1024 * 1024,
      },
      video: { mimes: ["video/"], maxSize: 100 * 1024 * 1024 },
    };

    const validFiles = [];
    const rejectedFiles = [];

    for (const file of files) {
      let matchedType = null;
      for (const [typeKey, typeConfig] of Object.entries(allowedTypes)) {
        if (
          typeConfig.mimes.some(
            (mime) =>
              file.type.startsWith(mime.replace("*", "")) || file.type === mime,
          )
        ) {
          matchedType = typeKey;
          break;
        }
      }
      if (!matchedType) {
        rejectedFiles.push({
          name: file.name,
          reason: `Unsupported file type: ${file.type || "unknown"}`,
        });
        continue;
      }
      const typeConfig = allowedTypes[matchedType];
      if (file.size > typeConfig.maxSize) {
        rejectedFiles.push({
          name: file.name,
          reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max ${(typeConfig.maxSize / 1024 / 1024).toFixed(0)}MB)`,
        });
        continue;
      }
      validFiles.push(file);
    }

    if (rejectedFiles.length > 0) {
      const messages = rejectedFiles.map((f) => `❌ ${f.name}: ${f.reason}`);
      showToast(
        `${rejectedFiles.length} file(s) rejected:\n${messages.join("\n")}`,
        "warning",
        { duration: 5000 },
      );
    }

    if (validFiles.length === 0) {
      if (rejectedFiles.length === 0)
        showToast("No valid files selected", "warning");
      e.target.value = "";
      return;
    }

    setUploadQueue(
      validFiles.map((file) => ({
        file,
        id: Date.now() + Math.random(),
        status: "pending",
        progress: 0,
        category: category !== "all" ? category : null,
      })),
    );
    setIsUploadModalOpen(true);
    e.target.value = "";
  };

  // ─── Process Upload Queue ──
  const processUploadQueue = useCallback(
    async (folderId, topic) => {
      if (uploading || uploadQueue.length === 0) return;
      setUploading(true);

      const CONCURRENCY_LIMIT = 3;
      const queue = [...uploadQueue];
      let processed = 0;
      let failed = 0;

      const uploadSingleFile = async (item) => {
        try {
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "uploading", progress: 10 }
                : q,
            ),
          );

          // Use the original file directly - NO base64 conversion!
          const file = item.file;

          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: 30 } : q)),
          );

          const wasAutoDetected = !item.category;

          // For AI categorization, we still need base64 (only if needed)
          let detectedCategory = item.category || "other";
          if (wasAutoDetected) {
            try {
              // Only convert to base64 if we need AI categorization
              const imageData = await fileToBase64(file);
              detectedCategory = await resolveUploadCategory(item, imageData);
              setUploadQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id
                    ? { ...q, progress: 50, aiCategory: detectedCategory }
                    : q,
                ),
              );
            } catch (aiError) {
              console.warn("AI categorization failed, using default:", aiError);
              detectedCategory = "other";
            }
          }
          console.log(
            `📤 [GALLERY] Uploading ${file.name} to folder ${folderId}`,
          );
          console.log(`📤 [GALLERY] File details:`, {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
          });

          const formData = new FormData();
          // Use the original file directly!
          formData.append("image", file, file.name);
          formData.append("folderId", folderId);
          formData.append("category", detectedCategory);
          if (sessionId) formData.append("sessionId", sessionId);
          formData.append("lang", language);

          console.log(`📤 [GALLERY] FormData fields:`, [...formData.keys()]);
          console.log(`📤 [GALLERY] FormData image:`, formData.get("image"));

          const uploadPromise = goldenMondayAPI.uploadGalleryPhoto(
            formData,
            (progress) => {
              setUploadQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id
                    ? { ...q, progress: 50 + progress * 0.4 }
                    : q,
                ),
              );
            },
          );

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Upload timeout after 120 seconds")),
              120000,
            );
          });

          await Promise.race([uploadPromise, timeoutPromise]);

          processed++;
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "completed", progress: 100 }
                : q,
            ),
          );

          setTimeout(() => {
            setUploadQueue((prev) => prev.filter((q) => q.id !== item.id));
          }, 1500);

          return { success: true, item };
        } catch (error) {
          console.error(`Upload error for ${item.file.name}:`, error);
          failed++;

          let errorMessage = error.message || "Upload failed";
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }

          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "error", progress: 0, errorMessage }
                : q,
            ),
          );

          showToast(`Failed: ${item.file.name} - ${errorMessage}`, "error");

          return { success: false, item, error };
        }
      };

      const chunks = [];
      for (let i = 0; i < queue.length; i += CONCURRENCY_LIMIT) {
        chunks.push(queue.slice(i, i + CONCURRENCY_LIMIT));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map((item) => uploadSingleFile(item)));
      }

      if (processed > 0) {
        const message = `✅ Successfully uploaded ${processed} file(s) to "${topic}"`;
        if (failed > 0) {
          showToast(`${message} (${failed} failed)`, "warning");
        } else {
          showToast(message, "success");
        }
        await loadGallery();
        if (onRefresh) onRefresh();
      }

      setUploading(false);
    },
    [
      uploadQueue,
      uploading,
      resolveUploadCategory,
      fileToBase64,
      sessionId,
      language,
      loadGallery,
      onRefresh,
    ],
  );

  const removeFromQueue = (id) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  // ─── Delete Modal Logic ──
  const openDeleteModal = (photoId, photoTitle) => {
    if (dontAskAgain) {
      confirmDelete(photoId);
      return;
    }
    setDeleteModal({ isOpen: true, photoId, photoTitle });
  };

  const closeDeleteModal = () =>
    setDeleteModal({ isOpen: false, photoId: null, photoTitle: "" });

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

  const handleDelete = (photoId) => {
    const photo = items.find((p) => p._id === photoId);
    const photoTitle =
      photo?.title || photo?.caption || t.untitled || "Untitled";
    openDeleteModal(photoId, photoTitle);
  };

  const handleDontAskAgainToggle = (e) => {
    const checked = e.target.checked;
    setDontAskAgain(checked);
    if (checked) localStorage.setItem("galleryDeleteDontAskAgain", "true");
    else localStorage.removeItem("galleryDeleteDontAskAgain");
  };

  // ─── Clear All Photos ──
  const clearAllPhotos = async () => {
    try {
      const params = { limit: 1000, page: 1 };
      if (clearAllModal.category !== "all")
        params.category = clearAllModal.category;

      const response = await goldenMondayAPI.getGallery(params);
      const photosToDelete = response.data.photos || [];

      if (photosToDelete.length === 0) {
        showToast(
          `No photos found in ${clearAllModal.category !== "all" ? getCategoryLabel(clearAllModal.category) : "all categories"}`,
          "info",
        );
        closeClearAllModal();
        return;
      }

      if (
        !window.confirm(
          `This will permanently delete ${photosToDelete.length} photo(s). This action cannot be undone!`,
        )
      )
        return;

      let deletedCount = 0;
      for (const photo of photosToDelete) {
        try {
          await goldenMondayAPI.deleteGalleryPhoto(photo._id);
          deletedCount++;
        } catch (e) {
          console.error(`Failed to delete photo ${photo._id}:`, e);
        }
      }

      showToast(
        `Successfully cleared ${deletedCount} photo(s)`,
        deletedCount > 0 ? "success" : "warning",
      );
      closeClearAllModal();
      await loadGallery();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Clear all error:", error);
      showToast("Failed to clear photos.", "error");
    }
  };

  const updateAutoClearSettings = (key, value) => {
    const newSettings = { ...autoClearSettings, [key]: value };
    setAutoClearSettings(newSettings);
    localStorage.setItem(
      "galleryAutoClearSettings",
      JSON.stringify(newSettings),
    );
  };

  // ─── Lightbox Navigation ──
  const openLightbox = (photo) => {
    const photoItems = items.filter((item) => item.url);
    const index = photoItems.findIndex((p) => p._id === photo._id);
    setLightboxIndex(index >= 0 ? index : 0);
    setSelectedPhoto(photo);
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = useCallback(() => {
    setSelectedPhoto(null);
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
    document.body.style.overflow = "";
    if (isFullscreen) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const navigateLightbox = useCallback(
    (direction) => {
      const photoItems = items.filter((item) => item.url);
      if (photoItems.length === 0) return;
      const newIndex =
        (lightboxIndex + direction + photoItems.length) % photoItems.length;
      setLightboxIndex(newIndex);
      setSelectedPhoto(photoItems[newIndex]);
      setZoomLevel(1);
      setDragOffset({ x: 0, y: 0 });
    },
    [items, lightboxIndex],
  );

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const handleZoomIn = useCallback(
    () => setZoomLevel((prev) => Math.min(prev + 0.25, 3)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5)),
    [],
  );
  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // ─── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedPhoto) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleZoomReset();
      if (e.key === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedPhoto,
    lightboxIndex,
    closeLightbox,
    navigateLightbox,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    toggleFullscreen,
  ]);

  // ─── Render ──
  return (
    <div style={{ fontFamily: F.sans }}>
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
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 20px rgba(245,197,24,0.2); }
          50% { box-shadow: 0 0 40px rgba(245,197,24,0.4); }
          100% { box-shadow: 0 0 20px rgba(245,197,24,0.2); }
        }
        .gallery-item {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .gallery-item:hover {
          transform: scale(1.03) translateY(-6px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.15);
          z-index: 10;
        }
        .glass-card {
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .shimmer-loading {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        .category-btn {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .category-btn:hover {
          transform: translateY(-2px);
        }
        .category-btn.active {
          background: ${C.primary};
          color: #fff;
          box-shadow: 0 4px 16px ${C.primary}44;
        }
        .lightbox-controls {
          transition: opacity 0.3s ease;
        }
        .lightbox-controls:hover {
          opacity: 1 !important;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${C.border};
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${C.muted};
        }
      `}</style>

      {/* ── Uploader Modal ── */}
      <GalleryUploader
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
        }}
        category={category}
        uploadQueue={uploadQueue}
        onUploadComplete={processUploadQueue}
      />

      {/* ── Folder Navigation ── */}
      {currentFolder && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...glass,
            borderRadius: 14,
            padding: "12px 18px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <button
            onClick={() => {
              setCurrentFolder(null);
              setPage(1);
              setCategory("all");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 16px",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              background: "transparent",
              color: C.dark,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <FiArrowLeft size={16} /> Back
          </button>
          <span
            style={{
              fontSize: 14,
              color: C.dark,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <FiFolder size={18} color={C.primary} />
            {currentFolder.title}
          </span>
          <span style={{ fontSize: 12, color: C.muted }}>
            {items.length} {t.items || "items"}
          </span>
        </motion.div>
      )}

      {/* ── Category Filter Bar ── */}
      <div
        style={{
          ...glass,
          borderRadius: 14,
          padding: "10px 14px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`category-btn ${category === cat.value ? "active" : ""}`}
            onClick={() => {
              setCategory(cat.value);
              setPage(1);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: `1px solid ${category === cat.value ? C.primary : C.border}`,
              background: category === cat.value ? C.primary : "transparent",
              color: category === cat.value ? "#fff" : C.muted,
              fontSize: 12,
              fontWeight: category === cat.value ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          {isAdmin && (
            <>
              <label
                style={{
                  padding: "6px 14px",
                  borderRadius: 10,
                  border: `1px dashed ${C.primary}`,
                  background: `${C.primary}11`,
                  color: C.primary,
                  fontSize: 12,
                  cursor: uploading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  opacity: uploading ? 0.6 : 1,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!uploading)
                    e.currentTarget.style.background = `${C.primary}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${C.primary}11`;
                }}
              >
                {uploading ? (
                  <>
                    <FiLoader
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    {isAIAnalyzing ? "AI Analyzing..." : "Uploading..."}
                  </>
                ) : uploadQueue.length > 0 ? (
                  <>
                    <FiClock size={14} /> Awaiting details…
                  </>
                ) : (
                  <>
                    <FiUpload size={14} /> {t.upload || "Upload Media"}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>

              <button
                onClick={() =>
                  setClearAllModal({ isOpen: true, category: "all" })
                }
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: `1px solid #fca5a5`,
                  background: "#fee2e2",
                  color: "#dc2626",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fecaca";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <FiTrash2 size={14} /> Clear All
              </button>

              <button
                onClick={() => setShowAutoClearSettings(!showAutoClearSettings)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  border: `1px solid ${autoClearSettings.enabled ? C.primary : C.border}`,
                  background: autoClearSettings.enabled
                    ? `${C.primary}15`
                    : "transparent",
                  color: autoClearSettings.enabled ? C.primary : C.muted,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <FiClock size={14} />
                {autoClearSettings.enabled && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#10b981",
                      display: "inline-block",
                      animation: "pulse-glow 2s ease-in-out infinite",
                    }}
                  />
                )}
              </button>

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
                  <FiCpu size={14} /> AI Categorizing
                </span>
              )}
            </>
          )}

          <button
            onClick={() => setViewMode("grid")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${viewMode === "grid" ? C.primary : C.border}`,
              background: viewMode === "grid" ? C.primary : "transparent",
              color: viewMode === "grid" ? "#fff" : C.muted,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${viewMode === "list" ? C.primary : C.border}`,
              background: viewMode === "list" ? C.primary : "transparent",
              color: viewMode === "list" ? "#fff" : C.muted,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* ── Auto-Clear Settings Panel ── */}
      <AnimatePresence>
        {showAutoClearSettings && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                ...glass,
                borderRadius: 14,
                padding: "16px 20px",
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
                  <span
                    style={{ fontWeight: 700, fontSize: 14, color: C.dark }}
                  >
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
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label
                    style={{ fontSize: 13, color: C.dark, cursor: "pointer" }}
                  >
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
                    />{" "}
                    Enable Auto-Clear
                  </label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, color: C.dark }}>
                    <FiCalendar size={14} style={{ marginRight: 4 }} /> Clear
                    every:
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
                  <label style={{ fontSize: 13, color: C.dark }}>
                    Category:
                  </label>
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
                    {CATEGORIES.map((cat) => (
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
                    <FiClock size={12} /> Last run:{" "}
                    {new Date(autoClearSettings.lastRun).toLocaleString()}
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
                <FiAlertCircle size={14} /> Photos will be automatically deleted
                based on the selected period and category.{" "}
                {autoClearSettings.enabled
                  ? " Auto-clear is active."
                  : " Enable to activate."}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload Queue ── */}
      {uploadQueue.length > 0 && !isUploadModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...glass,
            borderRadius: 14,
            padding: "12px 16px",
            marginBottom: 16,
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
                  borderRadius: 8,
                  background: C.white,
                  border: `1px solid ${item.status === "error" ? "#fecaca" : item.status === "completed" ? "#6ee7b7" : C.border}`,
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
        </motion.div>
      )}

      {/* ── Main Content ── */}
      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="shimmer-loading"
              style={{
                aspectRatio: "1/1",
                borderRadius: 14,
                background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            ...glass,
            borderRadius: 20,
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {currentFolder ? "🖼️" : "📂"}
          </div>
          <h3 style={{ color: C.dark, fontFamily: F.serif, marginBottom: 4 }}>
            {currentFolder
              ? category !== "all"
                ? `No ${getCategoryLabel(category)} files in this folder`
                : "No photos in this folder"
              : category !== "all"
                ? `No ${getCategoryLabel(category)} files found`
                : t.noPhotos || "No folders yet"}
          </h3>
          <p style={{ color: C.muted, fontSize: 13 }}>
            {isAdmin
              ? currentFolder
                ? "Upload photos to this folder"
                : "Upload media to create a new Golden Monday folder"
              : t.checkBackLater || "Check back later"}
          </p>
          {isAdmin && !currentFolder && (
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 16,
                padding: "10px 24px",
                borderRadius: 10,
                border: `1px dashed ${C.primary}`,
                background: `${C.primary}11`,
                color: C.primary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${C.primary}22`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = `${C.primary}11`)
              }
            >
              <FiUpload size={16} /> Create First Folder
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </label>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            display: "grid",
            gridTemplateColumns:
              viewMode === "grid"
                ? "repeat(auto-fill, minmax(220px, 1fr))"
                : "1fr",
            gap: viewMode === "grid" ? 16 : 8,
          }}
        >
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="gallery-item"
            >
              <GalleryItem
                item={item}
                viewMode={viewMode}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onClick={(clickedItem) => {
                  if (!clickedItem.url) {
                    setCurrentFolder(clickedItem);
                    setPage(1);
                  } else {
                    openLightbox(clickedItem);
                  }
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: page === 1 ? C.bg : C.white,
              color: page === 1 ? "#999" : C.dark,
              cursor: page === 1 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = page === 1 ? C.bg : C.white;
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <FiChevronLeft size={16} />
          </button>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 16px",
              color: C.muted,
              fontSize: 13,
            }}
          >
            {t.page || "Page"} {page} {t.of || "of"} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: page === totalPages ? C.bg : C.white,
              color: page === totalPages ? "#999" : C.dark,
              cursor: page === totalPages ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.background = C.bg;
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                page === totalPages ? C.bg : C.white;
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ─── PREMIUM LIGHTBOX MODAL ─── */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.92)",
              backdropFilter: "blur(20px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3000,
              padding: 20,
            }}
            onClick={closeLightbox}
          >
            {/* ── Photo Container ── */}
            <div
              style={{
                position: "relative",
                maxWidth: "95vw",
                maxHeight: "95vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                if (zoomLevel > 1) {
                  setDragStart({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseMove={(e) => {
                if (dragStart && zoomLevel > 1) {
                  const dx = e.clientX - dragStart.x;
                  const dy = e.clientY - dragStart.y;
                  setDragOffset((prev) => ({
                    x: prev.x + dx,
                    y: prev.y + dy,
                  }));
                  setDragStart({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseUp={() => setDragStart(null)}
              onMouseLeave={() => setDragStart(null)}
            >
              <motion.img
                src={selectedPhoto.url}
                alt={selectedPhoto.title || "Golden Monday"}
                style={{
                  maxWidth: "90vw",
                  maxHeight: "85vh",
                  borderRadius: 12,
                  objectFit: "contain",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                  transform: `scale(${zoomLevel}) translate(${dragOffset.x / zoomLevel}px, ${dragOffset.y / zoomLevel}px)`,
                  transition: zoomLevel === 1 ? "transform 0.3s ease" : "none",
                  cursor: zoomLevel > 1 ? "grab" : "default",
                }}
                drag={zoomLevel > 1}
                dragConstraints={{
                  left: -200 * zoomLevel,
                  right: 200 * zoomLevel,
                  top: -200 * zoomLevel,
                  bottom: 200 * zoomLevel,
                }}
                dragElastic={0.1}
                onDragStart={(e) => {
                  if (zoomLevel > 1) {
                    e.currentTarget.style.cursor = "grabbing";
                  }
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.cursor =
                    zoomLevel > 1 ? "grab" : "default";
                }}
              />

              {/* ── Navigation Arrows ── */}
              <button
                className="lightbox-controls"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(-1);
                }}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  width: 48,
                  height: 48,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  opacity: 0.6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform =
                    "translateY(-50%) scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                  e.currentTarget.style.opacity = "0.6";
                  e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                }}
              >
                <FiChevronLeft size={28} />
              </button>

              <button
                className="lightbox-controls"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateLightbox(1);
                }}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  width: 48,
                  height: 48,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  opacity: 0.6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform =
                    "translateY(-50%) scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                  e.currentTarget.style.opacity = "0.6";
                  e.currentTarget.style.transform = "translateY(-50%) scale(1)";
                }}
              >
                <FiChevronRight size={28} />
              </button>

              {/* ── Top Controls ── */}
              <div
                className="lightbox-controls"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  display: "flex",
                  gap: 8,
                  opacity: 0.6,
                  transition: "opacity 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.6";
                }}
              >
                {/* Zoom Controls */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiMinus size={18} />
                </button>

                <span
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "0 12px",
                    color: "#fff",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    minWidth: 44,
                    justifyContent: "center",
                  }}
                >
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <FiPlus size={18} />
                </button>

                <div
                  style={{
                    width: 1,
                    height: 30,
                    background: "rgba(255,255,255,0.15)",
                  }}
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomReset();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Reset zoom"
                >
                  <FiRotateCw size={18} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title={
                    isFullscreen ? "Exit fullscreen (f)" : "Fullscreen (f)"
                  }
                >
                  {isFullscreen ? (
                    <FiMinimize2 size={18} />
                  ) : (
                    <FiMaximize2 size={18} />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(selectedPhoto.url, "_blank");
                  }}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Download (opens in new tab)"
                >
                  <FiDownload size={18} />
                </button>

                {isAdmin && (
                  <>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "rgba(255,255,255,0.15)",
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeLightbox();
                        setTimeout(() => handleDelete(selectedPhoto._id), 300);
                      }}
                      style={{
                        background: "rgba(239,68,68,0.3)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "50%",
                        width: 40,
                        height: 40,
                        color: "#ef4444",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(239,68,68,0.5)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(239,68,68,0.3)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </>
                )}

                <div
                  style={{
                    width: 1,
                    height: 30,
                    background: "rgba(255,255,255,0.15)",
                  }}
                />

                <button
                  onClick={closeLightbox}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                    width: 40,
                    height: 40,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.5)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Close (Esc)"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* ── Bottom Info Bar ── */}
              <div
                className="lightbox-controls"
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 20,
                  right: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#fff",
                  fontSize: 13,
                  opacity: 0.6,
                  transition: "opacity 0.3s ease",
                  background: "rgba(0,0,0,0.3)",
                  backdropFilter: "blur(8px)",
                  padding: "8px 16px",
                  borderRadius: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.6";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 500 }}>
                    {selectedPhoto.title ||
                      selectedPhoto.originalFilename ||
                      "Untitled"}
                  </span>
                  {selectedPhoto.category && (
                    <span
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        padding: "2px 12px",
                        borderRadius: 999,
                        fontSize: 11,
                      }}
                    >
                      {getCategoryLabel(selectedPhoto.category)}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    {lightboxIndex + 1} / {items.filter((i) => i.url).length}
                  </span>
                  {selectedPhoto.fileType && (
                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                      {selectedPhoto.fileType.toUpperCase()}
                      {selectedPhoto.size && (
                        <span style={{ marginLeft: 8 }}>
                          {(selectedPhoto.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              zIndex: 4000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={closeDeleteModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "clamp(24px, 4vw, 32px)",
                maxWidth: 450,
                width: "92%",
                boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
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
                {t.deleteConfirmTitle || "Delete Photo?"}
              </h3>

              <p
                style={{
                  fontSize: 14,
                  color: C.muted,
                  textAlign: "center",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                {t.deleteConfirmMessage || "Are you sure you want to delete"}{" "}
                <strong style={{ color: C.dark }}>
                  "{deleteModal.photoTitle || "Untitled"}"
                </strong>
                ? {t.deleteWarning || "This action cannot be undone."}
              </p>

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

              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  onClick={closeDeleteModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
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
                  onClick={() => confirmDelete(deleteModal.photoId)}
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
                  <FiTrash2 size={14} /> {t.delete || "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CLEAR ALL CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {clearAllModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              zIndex: 4000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={closeClearAllModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "clamp(24px, 4vw, 32px)",
                maxWidth: 450,
                width: "92%",
                boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
                position: "relative",
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
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  onClick={closeClearAllModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
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
                  onClick={clearAllPhotos}
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
                  <FiTrash2 size={14} /> {t.clearAll || "Clear All"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
