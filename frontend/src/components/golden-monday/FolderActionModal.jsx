// frontend/src/components/golden-monday/FolderActionModal.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { C, F } from "../../styles/theme";
import {
  FiX,
  FiFolder,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
  FiCheck,
  FiLoader,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
// This constant is intentionally co-located with the modal for its public API.
// eslint-disable-next-line react-refresh/only-export-components
export const FOLDER_MODAL_TYPES = {
  RENAME: "rename",
  DELETE: "delete",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function FolderActionModal({
  isOpen,
  onClose,
  type,
  folder,
  onConfirm,
  isLoading = false,
}) {
  const [newTitle, setNewTitle] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const inputRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    let resetTimer;

    if (isOpen) {
      if (type === FOLDER_MODAL_TYPES.RENAME) {
        resetTimer = setTimeout(() => {
          setNewTitle(folder?.title || "");
          inputRef.current?.focus();
        }, 0);
      } else if (type === FOLDER_MODAL_TYPES.DELETE) {
        resetTimer = setTimeout(() => setConfirmText(""), 0);
      }
    }

    return () => clearTimeout(resetTimer);
  }, [isOpen, type, folder]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Enter") {
        if (type === FOLDER_MODAL_TYPES.RENAME && newTitle.trim()) {
          onConfirm(newTitle.trim());
        } else if (
          type === FOLDER_MODAL_TYPES.DELETE &&
          confirmText === folder?.title
        ) {
          onConfirm();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, type, folder, newTitle, confirmText, onConfirm, onClose]);

  if (!isOpen) return null;

  // ─── RENAME MODAL ──────────────────────────────────────────────────────────
  if (type === FOLDER_MODAL_TYPES.RENAME) {
    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
            zIndex: 5000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            style={{
              background: "#fff",
              borderRadius: 24,
              maxWidth: 460,
              width: "100%",
              padding: 0,
              boxShadow: "0 32px 80px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative header bar */}
            <div
              style={{
                height: 4,
                background: `linear-gradient(90deg, ${C.primary}, ${C.gold}, ${C.primary})`,
                backgroundSize: "200% 100%",
                animation: "gradient-sweep 3s ease-in-out infinite",
              }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                background: "rgba(0,0,0,0.06)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#666",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FiX size={20} />
            </button>

            {/* Content */}
            <div style={{ padding: "28px 32px 32px" }}>
              {/* Icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: `${C.primary}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <FiFolder size={26} color={C.primary} />
              </div>

              {/* Title */}
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.dark,
                  fontFamily: F.serif,
                }}
              >
                Rename Folder
              </h3>

              {/* Description */}
              <p
                style={{
                  margin: "0 0 20px",
                  fontSize: 14,
                  color: C.muted,
                  lineHeight: 1.5,
                }}
              >
                Enter a new name for this folder. This will update the display
                name everywhere.
              </p>

              {/* Input */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.dark,
                    marginBottom: 6,
                  }}
                >
                  Folder Name
                </label>
                <div
                  style={{
                    position: "relative",
                    borderRadius: 12,
                    border: `1.5px solid ${C.border}`,
                    transition: "all 0.3s ease",
                    overflow: "hidden",
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter folder name..."
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      outline: "none",
                      fontSize: 15,
                      fontFamily: F.sans,
                      color: C.dark,
                      background: "transparent",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.parentElement.style.borderColor =
                        C.primary;
                      e.currentTarget.parentElement.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.parentElement.style.borderColor =
                        C.border;
                      e.currentTarget.parentElement.style.boxShadow = "none";
                    }}
                    disabled={isLoading}
                  />
                </div>
                {newTitle.trim() && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#10b981",
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiCheck size={14} />
                    Ready to rename
                  </div>
                )}
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
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.muted,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = C.bg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newTitle.trim()) {
                      onConfirm(newTitle.trim());
                    }
                  }}
                  disabled={!newTitle.trim() || isLoading}
                  style={{
                    padding: "10px 28px",
                    borderRadius: 12,
                    border: "none",
                    background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor:
                      !newTitle.trim() || isLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: !newTitle.trim() || isLoading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isLoading ? (
                    <>
                      <FiLoader
                        size={18}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiEdit2 size={18} />
                      Rename
                    </>
                  )}
                </button>
              </div>
            </div>

            <style>{`
              @keyframes gradient-sweep {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body,
    );
  }

  // ─── DELETE MODAL ──────────────────────────────────────────────────────────
  if (type === FOLDER_MODAL_TYPES.DELETE) {
    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
            zIndex: 5000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            style={{
              background: "#fff",
              borderRadius: 24,
              maxWidth: 460,
              width: "100%",
              padding: 0,
              boxShadow: "0 32px 80px rgba(0, 0, 0, 0.35)",
              overflow: "hidden",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative header bar - red for danger */}
            <div
              style={{
                height: 4,
                background: `linear-gradient(90deg, #ef4444, #f87171, #ef4444)`,
                backgroundSize: "200% 100%",
                animation: "gradient-sweep 3s ease-in-out infinite",
              }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                position: "absolute",
                top: 14,
                right: 16,
                background: "rgba(0,0,0,0.06)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#666",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FiX size={20} />
            </button>

            {/* Content */}
            <div style={{ padding: "28px 32px 32px" }}>
              {/* Icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <FiTrash2 size={26} color="#dc2626" />
              </div>

              {/* Title */}
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.dark,
                  fontFamily: F.serif,
                }}
              >
                Delete Folder?
              </h3>

              {/* Description */}
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 14,
                  color: C.muted,
                  lineHeight: 1.6,
                }}
              >
                You are about to permanently delete the folder
              </p>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: C.dark,
                  padding: "8px 14px",
                  background: C.bg,
                  borderRadius: 8,
                  display: "inline-block",
                  fontFamily: F.mono,
                }}
              >
                📁 {folder?.title || "Untitled"}
              </p>

              {/* Warning */}
              <div
                style={{
                  marginBottom: 20,
                  padding: "12px 16px",
                  background: "#fef3c7",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  border: `1px solid #fcd34d`,
                }}
              >
                <FiAlertTriangle
                  size={18}
                  color="#d97706"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#92400e",
                    }}
                  >
                    This action cannot be undone!
                  </div>
                  <div style={{ fontSize: 12, color: "#78350f", marginTop: 2 }}>
                    All photos and files inside this folder will be permanently
                    deleted.
                  </div>
                </div>
              </div>

              {/* Confirmation input */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.dark,
                    marginBottom: 6,
                  }}
                >
                  Type <span style={{ color: "#dc2626" }}>{folder?.title}</span>{" "}
                  to confirm
                </label>
                <div
                  style={{
                    position: "relative",
                    borderRadius: 12,
                    border: `1.5px solid ${confirmText === folder?.title ? "#10b981" : C.border}`,
                    transition: "all 0.3s ease",
                    overflow: "hidden",
                  }}
                >
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`Type "${folder?.title}" to confirm`}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "none",
                      outline: "none",
                      fontSize: 15,
                      fontFamily: F.sans,
                      color: C.dark,
                      background: "transparent",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.parentElement.style.borderColor =
                        confirmText === folder?.title ? "#10b981" : C.primary;
                      e.currentTarget.parentElement.style.boxShadow = `0 0 0 3px ${C.primary}22`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.parentElement.style.borderColor =
                        confirmText === folder?.title ? "#10b981" : C.border;
                      e.currentTarget.parentElement.style.boxShadow = "none";
                    }}
                    disabled={isLoading}
                    autoFocus
                  />
                  {confirmText === folder?.title && (
                    <div
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#10b981",
                      }}
                    >
                      <FiCheck size={20} />
                    </div>
                  )}
                </div>
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
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    color: C.muted,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = C.bg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmText === folder?.title) {
                      onConfirm();
                    }
                  }}
                  disabled={confirmText !== folder?.title || isLoading}
                  style={{
                    padding: "10px 28px",
                    borderRadius: 12,
                    border: "none",
                    background:
                      confirmText === folder?.title ? "#dc2626" : "#d1d5db",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor:
                      confirmText !== folder?.title || isLoading
                        ? "not-allowed"
                        : "pointer",
                    transition: "all 0.2s ease",
                    opacity:
                      confirmText !== folder?.title || isLoading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (confirmText === folder?.title && !isLoading) {
                      e.currentTarget.style.background = "#b91c1c";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (confirmText === folder?.title && !isLoading) {
                      e.currentTarget.style.background = "#dc2626";
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <FiLoader
                        size={18}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={18} />
                      Permanently Delete
                    </>
                  )}
                </button>
              </div>
            </div>

            <style>{`
              @keyframes gradient-sweep {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body,
    );
  }

  return null;
}
