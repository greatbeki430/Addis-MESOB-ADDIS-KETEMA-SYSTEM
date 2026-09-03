// components/golden-monday/GalleryGrid.jsx
// Golden Monday Gallery with Folder Structure (Ethiopian Date + Topic)
// Supports AI Categorization, Auto-Clear, Bulk Actions, and Modals

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
  FiArrowLeft,
  FiFolder,
  FiFilter,
} from "react-icons/fi";

// Import our new separate components
import GalleryItem from "./GalleryItem";
import GalleryUploader from "./GalleryUploader";

// ─────────────────────────────────────────────────────────────────────────────
// ✅ FIX (setState-in-effect warning): these two helpers compute the initial
// value for their respective useState calls directly from localStorage, via
// React's lazy-initializer form (`useState(() => ...)`). This replaces a
// mount-only effect that called setState synchronously just to seed state
// from an external source — exactly the case lazy initial state exists for.
// No effect, no extra render, no warning.
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_AUTO_CLEAR_SETTINGS = {
  enabled: false,
  period: "30", // days
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

// ─── Helper: Convert dataURL to Blob ──────────────────────────────────────
function dataURLtoBlob(dataURL) {
  try {
    const arr = dataURL.split(",");
    if (!arr || arr.length < 2) {
      throw new Error("Invalid data URL format");
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error("Could not extract MIME type from data URL");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error("dataURLtoBlob error:", error);
    throw error;
  }
}

export default function GalleryGrid({ sessionId = null, onRefresh }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isInitialMount = useRef(true);

  // Get translations based on language
  const t = goldenMondayTranslations[language] || goldenMondayTranslations.en;

  // ── Core State ──
  const [items, setItems] = useState([]); // Holds Folders OR Photos
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
  // ✅ Lazy-initialized from localStorage — no mount effect needed.
  const [dontAskAgain, setDontAskAgain] = useState(getInitialDontAskAgain);

  // ── Clear All Modal State ──
  const [clearAllModal, setClearAllModal] = useState({
    isOpen: false,
    category: "all",
  });

  // ── Auto-Clear Settings State ──
  // ✅ Lazy-initialized from localStorage — no mount effect needed.
  const [autoClearSettings, setAutoClearSettings] = useState(
    getInitialAutoClearSettings,
  );
  const [showAutoClearSettings, setShowAutoClearSettings] = useState(false);
  const autoClearSettingsRef = useRef(autoClearSettings);

  // Update ref when autoClearSettings changes
  useEffect(() => {
    autoClearSettingsRef.current = autoClearSettings;
  }, [autoClearSettings]);

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  // Category labels with translations
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

  // Categories list
  const CATEGORIES = useCallback(
    () => [
      { value: "all", label: t.allPhotos || "All Photos" },
      { value: "flag-raising", label: t.flagRaising || "🇪🇹 Flag Raising" },
      { value: "presentation", label: t.presentations || "🎤 Presentations" },
      { value: "group-photo", label: t.groupPhotos || "📸 Group Photos" },
      { value: "attendees", label: t.attendees || "👥 Attendees" },
      { value: "event", label: t.events || "🎉 Events" },
      { value: "other", label: t.other || "📁 Other" },
    ],
    [t],
  );
  const categories = CATEGORIES();

  // ── Helper functions for modals ──
  const closeClearAllModal = () =>
    setClearAllModal({ isOpen: false, category: "all" });

  // ── Data Fetching (Folders vs. Photos with Category Support) ──
  const loadGallery = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
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
          // Only clear photos, not folders (depends on your backend logic)
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

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ FIX ("cannot be modified" / immutable-value error): this used to be
  // `let detectedCategory = item.category;` reassigned later inside a
  // try/catch/finally block. The React Compiler rejects reassigning a plain
  // local variable across that kind of control flow when it's derived from
  // component state/props it's tracking. Restructuring it as a function that
  // *returns* the resolved category — rather than mutating an outer variable
  // — sidesteps the problem entirely and is arguably clearer code besides.
  // ─────────────────────────────────────────────────────────────────────────
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

  // ✅ Helper: Convert file to base64 (moved BEFORE processUploadQueue)
  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle multiple file selection (Kickstarts the Uploader modal)
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Define allowed types and their size limits
    const allowedTypes = {
      image: { mimes: ["image/"], maxSize: 10 * 1024 * 1024, label: "Images" },
      pdf: {
        mimes: ["application/pdf"],
        maxSize: 10 * 1024 * 1024,
        label: "PDFs",
      },
      presentation: {
        mimes: [
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        maxSize: 10 * 1024 * 1024,
        label: "Presentations",
      },
      document: {
        mimes: [
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maxSize: 10 * 1024 * 1024,
        label: "Documents",
      },
      video: { mimes: ["video/"], maxSize: 100 * 1024 * 1024, label: "Videos" },
    };

    const validFiles = [];
    const rejectedFiles = [];

    for (const file of files) {
      let matchedType = null;
      let matchedMime = false;

      // Check which type family this file belongs to
      for (const [typeKey, typeConfig] of Object.entries(allowedTypes)) {
        if (
          typeConfig.mimes.some(
            (mime) =>
              file.type.startsWith(mime.replace("*", "")) || file.type === mime,
          )
        ) {
          matchedType = typeKey;
          matchedMime = true;
          break;
        }
      }

      if (!matchedMime) {
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

    // Show rejection messages
    if (rejectedFiles.length > 0) {
      const messages = rejectedFiles.map((f) => `❌ ${f.name}: ${f.reason}`);
      showToast(
        `${rejectedFiles.length} file(s) rejected:\n${messages.join("\n")}`,
        "warning",
        { duration: 5000 },
      );
    }

    if (validFiles.length === 0) {
      if (rejectedFiles.length === 0) {
        showToast("No valid files selected", "warning");
      }
      e.target.value = "";
      return;
    }

    // Pass the files to the uploader modal
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

  // ✅ FIXED: Professional parallel upload processing with concurrency control
  // USING FORMDATA for proper file upload
  const processUploadQueue = useCallback(
    async (folderId, topic) => {
      if (uploading || uploadQueue.length === 0) return;
      setUploading(true);

      const CONCURRENCY_LIMIT = 3; // Upload 3 files at a time
      const queue = [...uploadQueue];
      let processed = 0;
      let failed = 0;

      // Helper to upload a single file using FormData
      const uploadSingleFile = async (item) => {
        try {
          // Update status
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: "uploading", progress: 10 }
                : q,
            ),
          );

          const imageData = await fileToBase64(item.file);

          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: 30 } : q)),
          );

          // Get AI category if needed
          const wasAutoDetected = !item.category;
          const detectedCategory = await resolveUploadCategory(item, imageData);

          if (wasAutoDetected) {
            setUploadQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? { ...q, progress: 50, aiCategory: detectedCategory }
                  : q,
              ),
            );
          }

          // ✅ FIX: Use FormData for file upload with proper error handling
          const blob = dataURLtoBlob(imageData);
          const ext = blob.type.split("/")[1]?.split("+")[0] || "bin";
          const formData = new FormData();

          // Append the file with proper filename
          const filename = item.file.name || `upload.${ext}`;
          formData.append("image", blob, filename);
          formData.append("folderId", folderId);
          formData.append("category", detectedCategory);
          if (sessionId) formData.append("sessionId", sessionId);
          formData.append("lang", language);

          console.log(`📤 Uploading ${filename} to folder ${folderId}`);

          // Upload with progress tracking
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

          // Add timeout wrapper
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

          // Remove from queue after delay
          setTimeout(() => {
            setUploadQueue((prev) => prev.filter((q) => q.id !== item.id));
          }, 1500);

          return { success: true, item };
        } catch (error) {
          console.error(`Upload error for ${item.file.name}:`, error);
          failed++;

          // Get more detailed error info
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

          // Show toast for the specific failure
          showToast(`Failed: ${item.file.name} - ${errorMessage}`, "error");

          return { success: false, item, error };
        }
      };

      // ✅ Process files in parallel with concurrency limit
      const chunks = [];
      for (let i = 0; i < queue.length; i += CONCURRENCY_LIMIT) {
        chunks.push(queue.slice(i, i + CONCURRENCY_LIMIT));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map((item) => uploadSingleFile(item)));
      }

      // Final summary
      if (processed > 0) {
        const message = `Successfully uploaded ${processed} file(s) to "${topic}"`;
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

  // Remove a file from queue
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

  // ─── Render ──
  return (
    <div style={{ fontFamily: F.sans }}>
      {/* Uploader Modal Component - FIXED */}
      <GalleryUploader
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          // Don't clear the queue here - let it show progress in the main UI
        }}
        category={category}
        uploadQueue={uploadQueue}
        onUploadComplete={processUploadQueue}
      />

      {/* Folder Back Navigation */}
      {currentFolder && (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
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
              padding: "6px 14px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.white,
              color: C.dark,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <FiArrowLeft size={16} /> Back to Folders
          </button>
          <span style={{ fontSize: 14, color: C.muted }}>
            <FiFolder
              size={14}
              style={{ verticalAlign: "middle", marginRight: 4 }}
            />{" "}
            {currentFolder.title}
          </span>
        </div>
      )}

      {/* Category Filter Context Indicator */}
      {(category !== "all" || currentFolder) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {category !== "all" && (
            <span
              style={{
                fontSize: 12,
                color: C.primary,
                background: C.primary + "11",
                padding: "4px 12px",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FiFilter size={14} />
              Filtering: {getCategoryLabel(category)}
              <button
                onClick={() => {
                  setCategory("all");
                  setPage(1);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: C.primary,
                  cursor: "pointer",
                  padding: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FiX size={14} />
              </button>
            </span>
          )}
          {currentFolder && (
            <span
              style={{
                fontSize: 12,
                color: C.muted,
                background: C.bg,
                padding: "4px 12px",
                borderRadius: 16,
              }}
            >
              📁 {currentFolder.title}
            </span>
          )}
        </div>
      )}

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
                {uploading ? (
                  <>
                    <FiLoader
                      size={14}
                      style={{ animation: "spin 1s linear infinite" }}
                    />{" "}
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
                }}
              >
                <FiTrash2 size={14} /> Clear All
              </button>

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
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <FiClock size={14} /> Auto-Clear{" "}
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
              borderRadius: 6,
              border: `1px solid ${viewMode === "grid" ? C.primary : C.border}`,
              background: viewMode === "grid" ? C.primary : "transparent",
              color: viewMode === "grid" ? "#fff" : C.muted,
              cursor: "pointer",
            }}
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
                />{" "}
                Enable Auto-Clear
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13, color: C.dark }}>
                <FiCalendar size={14} style={{ marginRight: 4 }} /> Clear every:
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
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && !isUploadModalOpen && (
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
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
          <p>{t.loadingGallery || "Loading gallery..."}</p>
        </div>
      ) : items.length === 0 ? (
        <div
          style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {currentFolder ? "🖼️" : "📂"}
          </div>
          <p style={{ fontSize: 16, marginBottom: 4 }}>
            {currentFolder
              ? category !== "all"
                ? `No ${getCategoryLabel(category)} files in this folder`
                : "No photos in this folder"
              : category !== "all"
                ? `No ${getCategoryLabel(category)} files found`
                : t.noPhotos || "No folders yet"}
          </p>
          <p style={{ fontSize: 13, color: "#999" }}>
            {isAdmin
              ? currentFolder
                ? "Upload photos to this folder"
                : "Upload media to create a new Golden Monday folder"
              : t.checkBackLater || "Check back later"}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              viewMode === "grid"
                ? "repeat(auto-fill, minmax(220px, 1fr))"
                : "1fr",
            gap: viewMode === "grid" ? 16 : 8,
          }}
        >
          {items.map((item) => (
            <GalleryItem
              key={item._id}
              item={item}
              viewMode={viewMode}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onClick={(clickedItem) => {
                // Click logic: If folder (no url), open it. If photo (has url), open lightbox.
                if (!clickedItem.url) {
                  setCurrentFolder(clickedItem);
                  setPage(1);
                } else {
                  setSelectedPhoto(clickedItem);
                }
              }}
            />
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
              alt={selectedPhoto.title || "Golden Monday"}
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: 8,
                objectFit: "contain",
              }}
            />
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
            >
              <FiX size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deleteModal.isOpen && (
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
                {" "}
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
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "transparent",
                  color: C.dark,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
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
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiTrash2 size={14} /> {t.delete || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLEAR ALL CONFIRMATION MODAL ─── */}
      {clearAllModal.isOpen && (
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
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
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
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FiTrash2 size={14} /> {t.clearAll || "Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
