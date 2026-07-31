// components/golden-monday/GalleryUploader.jsx
import { useState } from "react";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { C } from "../../styles/theme";
import { FiCalendar } from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Ethiopian calendar conversion (Gregorian → Ethiopian)
// Ported from dailyReport.js so both places compute the SAME date, instead
// of this file using date-and-time's plain Gregorian formatter under a
// misleading "Ethiopian" function name.
// ─────────────────────────────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────

export default function GalleryUploader({
  isOpen,
  onClose,
  category,
  uploadQueue,
  onUploadComplete,
}) {
  const [uploadTopic, setUploadTopic] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // ✅ Now returns a genuine Ethiopian-calendar date, e.g. "ሐምሌ 23 ቀን 2018 ዓ.ም"
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

    setCreatingFolder(true);
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
        folderId = folderRes.data.folderId;
      } catch (error) {
        if (error.response?.data?.folderId) {
          folderId = error.response.data.folderId;
        } else {
          throw error;
        }
      }

      await onUploadComplete(folderId, uploadTopic);

      setUploadTopic("");
      onClose();
    } catch (error) {
      console.error("Folder creation failed:", error);
      showToast("Failed to create folder. Please try again.", "error");
    } finally {
      setCreatingFolder(false);
    }
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
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
            fontSize: 14,
          }}
          autoFocus
        />

        <div style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
          {uploadQueue.length} file(s) selected for upload.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setUploadTopic("");
              onClose();
            }}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!uploadTopic.trim() || creatingFolder}
            style={{
              padding: "8px 20px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              opacity: !uploadTopic.trim() || creatingFolder ? 0.6 : 1,
            }}
          >
            {creatingFolder ? "Creating..." : "Upload & Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
