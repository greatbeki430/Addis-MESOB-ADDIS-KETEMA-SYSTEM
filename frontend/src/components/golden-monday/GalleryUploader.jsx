// components/golden-monday/GalleryUploader.jsx
import { useState } from "react";
import { goldenMondayAPI } from "../../services/api";
import { showToast } from "../../utils/toastHelper";
import { C } from "../../styles/theme";
import { FiCalendar } from "react-icons/fi";
import dateAndTime from "date-and-time";

export default function GalleryUploader({
  isOpen,
  onClose,
  category,
  onUploadComplete,
}) {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTopic, setUploadTopic] = useState("");
  const [uploading, setUploading] = useState(false);

  const getEthiopianDateString = () => {
    const now = new Date();
    // Ensure your server-side also uses the same Ethiopian date conversion
    return dateAndTime.format(now, "MMMM D, YYYY");
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0 || !uploadTopic.trim()) {
      showToast("Please enter a topic for this session", "error");
      return;
    }

    setUploading(true);
    const dateStr = getEthiopianDateString();
    const folderName = `${dateStr} - ${uploadTopic}`;

    try {
      // 1. Create Folder via API
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
        // If folder exists, backend should return existing ID
        if (error.response?.data?.folderId) {
          folderId = error.response.data.folderId;
        } else {
          throw error;
        }
      }

      // 2. Upload Images
      let uploadedCount = 0;
      for (const file of uploadFiles) {
        const imageData = await fileToBase64(file);
        await goldenMondayAPI.uploadGalleryPhoto({
          image: imageData,
          folderId: folderId,
          category: category !== "all" ? category : null,
        });
        uploadedCount++;
      }

      showToast(
        `Successfully uploaded ${uploadedCount} images to "${folderName}"`,
        "success",
      );
      setUploadTopic("");
      setUploadFiles([]);
      onUploadComplete();
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      showToast("Failed to upload images. Please try again.", "error");
    } finally {
      setUploading(false);
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
          {uploadFiles.length} file(s) selected for upload.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              setUploadFiles([]);
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
            disabled={!uploadTopic.trim() || uploading}
            style={{
              padding: "8px 20px",
              background: C.primary,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              opacity: !uploadTopic.trim() || uploading ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Upload & Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
