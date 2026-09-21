// src/components/golden-monday/rotation/ManualPresenterPicker.jsx
//
// Admin-only modal that lets the manager pick ANY eligible presenter
// from the roster for the upcoming week. Bypasses the rotation
// algorithm's pick — but the backend still credits a "skip" to
// everyone the algorithm would have chosen ahead of the manual pick,
// so fairness tracking stays honest.
//
// The algorithm's choice is highlighted at the top with a "recommended"
// badge so admins know who they're overriding.
//
// The week banner at the top is critical: this modal writes to a
// SPECIFIC week, and without a visible indicator of which week, an
// admin can easily assign to the wrong one (which is exactly the bug
// this revision fixes — the parent used to pass a past week when
// currentSession resolved to the most recent past session, and the
// modal silently submitted the write to a session that already had a
// presenter, so nothing changed).

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  FiX,
  FiSearch,
  FiCheck,
  FiStar,
  FiLoader,
  FiAlertTriangle,
  FiCalendar,
} from "react-icons/fi";
import { C, F } from "../../../styles/theme";
import { goldenMondayAPI } from "../../../services/api";
import { notify } from "./helpers";

// Format a week (ISO string, Date, or null) for the banner. Falls
// back to the raw value if parsing fails, so a bad input is at least
// visible rather than silently blank.
const formatWeekLabel = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
};

export default function ManualPresenterPicker({
  isOpen,
  onClose,
  ranking = [],
  targetWeekOf,
  onAssigned,
  t,
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setSearch("");
    setSelectedId(null);
    setSubmitting(false);
    onClose();
  };

  const recommendedUserId = useMemo(
    () => (ranking[0]?.userId ? String(ranking[0].userId) : null),
    [ranking],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranking;
    return ranking.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q),
    );
  }, [ranking, search]);

  const weekLabel = formatWeekLabel(targetWeekOf);
  const hasTargetWeek = Boolean(targetWeekOf && weekLabel);

  const handleConfirm = async () => {
    if (!selectedId) return;

    // Guard: refuse to submit without a valid target week. Previously
    // this silently did nothing if the parent hadn't supplied one, and
    // the user saw "Presenter assigned" for an operation that was
    // never performed.
    if (!hasTargetWeek) {
      notify(
        t.noTargetWeek ||
          "No target week set — close this dialog and try again from the rotation panel.",
        "error",
      );
      return;
    }

    setSubmitting(true);
    try {
      await goldenMondayAPI.assignPresenter(selectedId, targetWeekOf);
      notify(t.manualAssignSuccess || "Presenter assigned", "success");
      if (onAssigned) await onAssigned();
      handleClose();
    } catch (err) {
      notify(
        err.response?.data?.message ||
          t.assignError ||
          "Failed to assign presenter",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
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
          width: "100%",
          maxWidth: 560,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 14px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: F.serif,
                fontSize: 20,
                color: C.dark,
              }}
            >
              {t.manualPickerTitle || "Assign a presenter"}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>
              {t.manualPickerSub ||
                "Pick any eligible presenter from the roster. The rotation algorithm's pick is highlighted."}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              padding: 4,
              flexShrink: 0,
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Target week banner — shows exactly which week this assignment
            will write to. Red when there's no target so the user never
            sees a "success" for a no-op. */}
        <div
          style={{
            margin: "12px 24px 0",
            padding: "10px 14px",
            borderRadius: 10,
            background: hasTargetWeek ? `${C.primary}0d` : "#FEF2F2",
            border: `1px solid ${hasTargetWeek ? `${C.primary}33` : "#FECACA"}`,
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {hasTargetWeek ? (
            <FiCalendar size={16} color={C.primary} style={{ flexShrink: 0 }} />
          ) : (
            <FiAlertTriangle
              size={16}
              color="#DC2626"
              style={{ flexShrink: 0 }}
            />
          )}
          <div
            style={{
              fontSize: 12,
              color: hasTargetWeek ? C.dark : "#7F1D1D",
            }}
          >
            {hasTargetWeek ? (
              <>
                <strong>{t.assigningToWeek || "Assigning to week:"}</strong>{" "}
                <span style={{ color: C.primary, fontWeight: 700 }}>
                  {weekLabel}
                </span>
              </>
            ) : (
              <span style={{ fontWeight: 700 }}>
                {t.noTargetWeek ||
                  "No target week set — this dialog can't submit an assignment. Close it and reopen from the rotation panel."}
              </span>
            )}
          </div>
        </div>

        {/* Warning banner */}
        <div
          style={{
            margin: "12px 24px 0",
            padding: "10px 14px",
            borderRadius: 10,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <FiAlertTriangle
            size={16}
            color="#B45309"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ fontSize: 12, color: "#78350F" }}>
            {t.manualPickerWarning ||
              "If you pick someone other than the algorithm's recommended presenter, everyone ahead of them gets a 'skipped' credit. This keeps the rotation fair next time."}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "14px 24px 8px", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <FiSearch
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#999",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                t.manualPickerSearch || "Search by name or department…"
              }
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                fontSize: 13,
                fontFamily: F.sans,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 16px" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px 0",
                color: C.muted,
                fontSize: 13,
              }}
            >
              {t.noMatchingPresenters || "No matching presenters"}
            </div>
          ) : (
            filtered.map((r) => {
              const isRecommended = String(r.userId) === recommendedUserId;
              const isSelected = String(r.userId) === String(selectedId);
              return (
                <button
                  key={r.userId}
                  onClick={() => setSelectedId(r.userId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? C.primary : C.border}`,
                    background: isSelected ? `${C.primary}0a` : "#fff",
                    cursor: "pointer",
                    textAlign: "left",
                    marginBottom: 8,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#fff";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {(r.name || "?").charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: C.dark,
                          fontSize: 14,
                        }}
                      >
                        {r.name}
                      </span>
                      {isRecommended && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: `${C.gold}33`,
                            color: "#8a6508",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <FiStar size={9} />
                          {t.recommended || "Recommended"}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.muted,
                        marginTop: 2,
                      }}
                    >
                      {r.department || t.noDepartment || "No department"}
                      {" · "}
                      {r.timesPresented || 0}x {t.presented || "presented"}
                      {r.daysSinceLastPresented === "never presented" && (
                        <>
                          {" · "}
                          <span style={{ color: C.primary, fontWeight: 600 }}>
                            {t.new || "NEW"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? C.primary : C.border}`,
                      background: isSelected ? C.primary : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <FiCheck size={13} color="#fff" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            flexShrink: 0,
            background: "#fafafa",
          }}
        >
          <button
            onClick={handleClose}
            disabled={submitting}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.muted,
              fontWeight: 600,
              fontSize: 13,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: F.sans,
            }}
          >
            {t.cancel || "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || submitting || !hasTargetWeek}
            title={
              !hasTargetWeek
                ? t.noTargetWeek || "No target week set"
                : undefined
            }
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background:
                !selectedId || submitting || !hasTargetWeek
                  ? C.border
                  : C.primary,
              color:
                !selectedId || submitting || !hasTargetWeek ? C.muted : "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor:
                !selectedId || submitting || !hasTargetWeek
                  ? "not-allowed"
                  : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: F.sans,
              transition: "all 0.2s ease",
            }}
          >
            {submitting ? (
              <FiLoader
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <FiCheck size={14} />
            )}
            {submitting
              ? t.assigning || "Assigning…"
              : t.confirmAssign || "Confirm Assignment"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
