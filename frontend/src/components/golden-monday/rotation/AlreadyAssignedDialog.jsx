// src/components/golden-monday/rotation/AlreadyAssignedDialog.jsx
//
// Shown when the admin clicks "Assign Next" but a presenter is
// already assigned for the upcoming week. Offers three real
// choices instead of a dead-end toast:
//   1. Keep as is
//   2. Re-announce (re-post to channel + re-send presenter DM)
//   3. Reassign (opens the manual picker)

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FiInfo, FiRotateCw, FiUsers, FiCheck } from "react-icons/fi";
import { C, F } from "../../../styles/theme";

export default function AlreadyAssignedDialog({
  isOpen,
  onClose,
  session,
  onKeep,
  onReAnnounce,
  onReassign,
  t,
}) {
  if (!isOpen) return null;

  const presenterName =
    session?.presenterName || session?.presenter?.name || "Presenter";

  const options = [
    {
      icon: <FiCheck size={18} />,
      label: t.alreadyAssignedKeep || "Keep as is",
      description:
        t.alreadyAssignedKeepDesc ||
        "Nothing changes. The current presenter stays.",
      onClick: onKeep,
      color: C.muted,
    },
    {
      icon: <FiRotateCw size={18} />,
      label: t.alreadyAssignedReannounce || "Re-announce",
      description:
        t.alreadyAssignedReannounceDesc ||
        "Re-post to the channel and re-send the availability DM.",
      onClick: onReAnnounce,
      color: C.primary,
    },
    {
      icon: <FiUsers size={18} />,
      label: t.alreadyAssignedReassign || "Reassign",
      description:
        t.alreadyAssignedReassignDesc ||
        "Pick a different presenter from the roster.",
      onClick: onReassign,
      color: C.gold,
    },
  ];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2147483000,
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ duration: 0.25, type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: 26,
          maxWidth: 520,
          width: "100%",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: "0 auto 12px",
              borderRadius: "50%",
              background: `${C.primary}15`,
              color: C.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiInfo size={24} />
          </div>
          <h3
            style={{
              margin: "0 0 6px",
              fontFamily: F.serif,
              fontSize: 20,
              color: C.dark,
            }}
          >
            {t.alreadyAssignedTitle || "This Week Already Has a Presenter"}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: C.muted,
              lineHeight: 1.5,
            }}
          >
            <strong>{presenterName}</strong>{" "}
            {t.alreadyAssignedBody ||
              "is already assigned for the upcoming Monday. What would you like to do?"}
          </p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={opt.onClick}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 12,
                border: `1.5px solid ${opt.color}33`,
                background: `${opt.color}0a`,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                fontFamily: F.sans,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${opt.color}1a`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${opt.color}0a`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${opt.color}22`,
                  color: opt.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {opt.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: C.dark,
                    fontSize: 14,
                    marginBottom: 2,
                  }}
                >
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {opt.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: C.muted,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: F.sans,
          }}
        >
          {t.cancel || "Cancel"}
        </button>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
