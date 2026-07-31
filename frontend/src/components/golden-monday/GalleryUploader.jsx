import { useState } from "react";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { C } from "../../styles/theme";
import { FiCalendar, FiUpload, FiLoader } from "react-icons/fi";

// Ethiopian calendar conversion (unchanged)
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
  uploading,
}) {
  const [uploadTopic, setUploadTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const getEthiopianDateString = () => formatEthiopianDateAmharic(new Date());

  const handleUpload = async () => {
    if (uploadQueue.length === 0) {
      showToast("Please select at least one photo", "error");
      return;
    }
    if (!uploadTopic.trim()) {
      showToast("Please enter a topic for this session", "error");
      return;
    }

    setIsCreating(true);
    const dateStr = getEthiopianDateString();
    const folderName = `${dateStr} - ${uploadTopic}`;

    try {
      let folderId = null;
      try {
        const folderRes = await goldenMondayAPI.createFolder({
          name: folderName,
          ethiopianDate: dateStr,
          topic: uploadTopic,
          category: category !== "all" ? category : "other",
        });
        folderId = folderRes.data.folderId || folderRes.data._id;
      } catch (error) {
        if (error.response?.data?.folderId) {
          folderId = error.response.data.folderId;
        } else if (error.response?.data?._id) {
          folderId = error.response.data._id;
        } else {
          throw error;
        }
      }

      if (!folderId) {
        throw new Error("Failed to create folder");
      }

      // ✅ Start the upload process with parallel processing
      await onUploadComplete(folderId, uploadTopic);

      setUploadTopic("");
      // Don't close immediately - let uploads finish
    } catch (error) {
      console.error("Folder creation failed:", error);
      showToast("Failed to create folder. Please try again.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // ✅ Allow closing only if not uploading
  const handleClose = () => {
    if (uploading) {
      showToast("Please wait for uploads to complete", "warning");
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
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Create New Folder</h3>
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
          Topic / Presenter Name
        </label>
        <input
          type="text"
          placeholder="Ex: Leadership Training - Team A"
          value={uploadTopic}
          onChange={(e) => setUploadTopic(e.target.value)}
          disabled={uploading}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
            fontSize: 14,
            background: uploading ? "#f5f5f5" : "white",
          }}
          autoFocus
        />

        <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
          {uploadQueue.length} file(s) selected for upload.
          {uploading && (
            <span style={{ marginLeft: 8, color: C.primary }}>
              <FiLoader
                size={14}
                style={{
                  animation: "spin 1s linear infinite",
                  display: "inline-block",
                }}
              />
              Uploading...
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={handleClose}
            disabled={uploading}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!uploadTopic.trim() || isCreating || uploading}
            style={{
              padding: "8px 20px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor:
                !uploadTopic.trim() || isCreating || uploading
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 600,
              opacity: !uploadTopic.trim() || isCreating || uploading ? 0.6 : 1,
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
                Creating...
              </>
            ) : uploading ? (
              <>
                <FiLoader
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Uploading...
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
