// frontend/src/components/golden-monday/GalleryUploader.jsx
import { useState, useRef } from "react";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { C } from "../../styles/theme";
import { FiCalendar, FiUpload, FiLoader, FiX } from "react-icons/fi";

// Ethiopian calendar conversion
const ETHIOPIAN_MONTHS_AM = [
  "መስከረም",
  "ጥቅምት",
  "ህዳር",
  "ታህሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ",
];

const JDN_EPOCH_OFFSET_AMETE_MIHRET = 1723856;

function gregorianToJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function toEthiopianDate(date = new Date()) {
  const jdn = gregorianToJDN(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  const offsetDays = jdn - JDN_EPOCH_OFFSET_AMETE_MIHRET;
  const r = offsetDays % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor(offsetDays / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

function formatEthiopianDateAmharic(date = new Date()) {
  const { year, day, month } = toEthiopianDate(date);
  const monthName = ETHIOPIAN_MONTHS_AM[month - 1];
  return `${monthName} ${day} ቀን ${year} ዓ.ም`;
}

export default function GalleryUploader({
  isOpen,
  onClose,
  category,
  uploadQueue,
  onUploadComplete,
}) {
  const [uploadTopic, setUploadTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [attemptStatus, setAttemptStatus] = useState("");
  const isSubmittingRef = useRef(false);

  const getEthiopianDateString = () => formatEthiopianDateAmharic(new Date());

  const handleUpload = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (uploadQueue.length === 0) {
        showToast("Please select at least one file", "error");
        return;
      }
      if (!uploadTopic.trim()) {
        showToast("Please enter a topic for this session", "error");
        return;
      }

      setIsCreating(true);

      const dateStr = getEthiopianDateString();
      const folderName = `${dateStr} - ${uploadTopic}`;

      let folderId = null;
      let retries = 3;
      let lastError = null;

      const totalAttempts = 3;
      while (retries > 0 && !folderId) {
        const attemptNum = totalAttempts - retries + 1;
        setAttemptStatus(
          attemptNum === 1
            ? "Connecting to server..."
            : `Server is waking up, retrying (${attemptNum}/${totalAttempts})...`,
        );
        try {
          // Create folder with timeout
          const folderPromise = goldenMondayAPI.createFolder({
            name: folderName,
            ethiopianDate: dateStr,
            topic: uploadTopic,
            category: category !== "all" ? category : "other",
          });

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Folder creation timed out")),
              30000,
            );
          });

          const folderRes = await Promise.race([folderPromise, timeoutPromise]);

          // Handle different response shapes
          folderId =
            folderRes.data?.folderId ||
            folderRes.data?._id ||
            folderRes.data?.folder?._id;

          if (!folderId) {
            throw new Error("No folder ID returned from server");
          }
          break;
        } catch (error) {
          lastError = error;
          console.error(
            `Folder creation attempt failed (${retries} retries left):`,
            error,
          );

          // Check if it's a duplicate key error (E11000)
          if (
            error.response?.status === 409 ||
            error.response?.data?.code === 11000 ||
            error.message?.includes("duplicate")
          ) {
            // Try to find existing folder
            try {
              const existingFolders = await goldenMondayAPI.getFolders({
                limit: 50,
                search: uploadTopic,
              });
              // Look for matching folder
              const existing = existingFolders.data?.folders?.find((f) =>
                f.topics?.some(
                  (t) => t.toLowerCase() === uploadTopic.toLowerCase(),
                ),
              );
              if (existing) {
                folderId = existing._id;
                console.log("✅ Found existing folder:", folderId);
                break;
              }
            } catch (findError) {
              console.warn("Could not find existing folder:", findError);
            }
          }

          retries--;
          if (retries > 0) {
            // Wait before retry with exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * (4 - retries)),
            );
          }
        }
      }

      if (!folderId) {
        throw new Error(
          lastError?.response?.data?.error ||
            lastError?.message ||
            "Failed to create or find folder after multiple attempts",
        );
      }

      // ✅ FIX: Pass the topic to upload complete callback
      const topic = uploadTopic.trim();

      // Close modal first to show progress in main UI
      onClose();
      setUploadTopic("");

      // ✅ FIX: Call upload complete with folderId and topic
      await onUploadComplete(folderId, topic);
    } catch (error) {
      console.error("Upload process error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to upload. Please try again.";
      showToast(errorMessage, "error");
      setIsCreating(false);
      setAttemptStatus("");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleClose = () => {
    if (isCreating) {
      showToast("Please wait for upload to complete", "warning");
      return;
    }
    setUploadTopic("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          maxWidth: 450,
          width: "100%",
          padding: 24,
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "#999",
          }}
        >
          <FiX size={20} />
        </button>

        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Create New Folder</h3>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          <FiCalendar size={14} style={{ marginRight: 4 }} />
          Date: <strong>{getEthiopianDateString()}</strong>
        </p>

        <label
          style={{
            display: "block",
            fontWeight: 500,
            marginBottom: 4,
            fontSize: 13,
          }}
        >
          Topic / Presenter Name <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          type="text"
          placeholder="Ex: Leadership Training - Team A"
          value={uploadTopic}
          onChange={(e) => setUploadTopic(e.target.value)}
          disabled={isCreating}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isCreating && uploadTopic.trim()) {
              e.preventDefault();
              handleUpload();
            }
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
            fontSize: 14,
            background: isCreating ? "#f5f5f5" : "white",
          }}
          autoFocus
        />

        <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
          {uploadQueue.length} file(s) selected for upload.
          {isCreating && (
            <span style={{ marginLeft: 8, color: C.primary }}>
              <FiLoader
                size={14}
                style={{
                  animation: "spin 1s linear infinite",
                  display: "inline-block",
                }}
              />
              {attemptStatus || "Creating folder..."}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={handleClose}
            disabled={isCreating}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              cursor: isCreating ? "not-allowed" : "pointer",
              opacity: isCreating ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!uploadTopic.trim() || isCreating}
            style={{
              padding: "8px 20px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor:
                !uploadTopic.trim() || isCreating ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: !uploadTopic.trim() || isCreating ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isCreating ? (
              <>
                <FiLoader
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Processing...
              </>
            ) : (
              <>
                <FiUpload size={16} />
                Upload & Create
              </>
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
