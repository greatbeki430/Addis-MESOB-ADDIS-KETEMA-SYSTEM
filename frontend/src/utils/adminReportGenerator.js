// frontend/src/utils/adminReportGenerator.js
//
// Report generation for the three admin data-management pages:
//   • daily-reports  → Daily Report PDF
//   • forum-reports  → Peer Forum Report PDF
//   • evaluations    → Evaluation Report PDF
//
// Kept separate from AdminDataManagement.jsx so the table, filters,
// pagination, and delete flow stay untouched. The only integration
// point is: import { generateReportForRow } from this file, then
// call it from the row action handler.
//
// Amharic is the default output language, matching the existing
// PDF generators in this app. Pass { language: "en" } or
// { language: "om" } to override, or leave it undefined to keep
// the default.

import { generateDailyReportPDF } from "./pdf/reports/dailyReport";
import {
  exportForumReportToPDF,
  exportEvaluationReportToPDF,
} from "./pdfExport";

// ─────────────────────────────────────────────────────────────────────
// Adapters
//
// The admin table rows come from /api/admin/data/<type> and are
// shaped for DISPLAY. Each PDF generator expects a different,
// specialized input shape. These functions do the mapping and are
// the only place you need to edit if your backend field names
// differ from the ones below.
// ─────────────────────────────────────────────────────────────────────

// ─── Daily Reports ──────────────────────────────────────────────────
//
// generateDailyReportPDF(rows, date, t, options)
//   rows   → [{ dept, service, male, female, total }, …]
//   date   → ISO date string
//   t      → translations object (unused by the daily-report generator;
//            it reads its own LABELS table)
//   options → { language, preparedBy, preparedByDisplay, preparedByDepartment,
//               preparedByPosition, preparedByBranch, filename, … }
//
const buildDailyReportInput = (row, options = {}) => {
  // Some daily-report rows already carry `entries` (array of
  // { dept, service, male, female, total }), others may carry the
  // same info as flat columns. Prefer `entries` when present.
  const entries = Array.isArray(row.entries)
    ? row.entries
    : Array.isArray(row.services)
      ? row.services
      : [];

  return {
    rows: entries,
    date:
      row.date ||
      (row.createdAt
        ? new Date(row.createdAt).toISOString().split("T")[0]
        : null),
    options: {
      language: options.language || "am",
      showWatermark: true,
      watermarkText:
        options.language === "en"
          ? "Daily Report"
          : options.language === "om"
            ? "Gabaasa Guyyaa"
            : "ዕለታዊ ሪፖርት",
      preparedBy:
        options.preparedBy ||
        row.submittedBy ||
        row.employee_name ||
        row.employeeName ||
        null,
      preparedByDepartment: row.team_name || row.teamName || "",
      preparedByBranch: row.branch || "",
      filename: options.filename,
    },
  };
};

// ─── Forum Reports ──────────────────────────────────────────────────
//
// exportForumReportToPDF(formData, t, lang, teamName, options)
//   formData → { date, timeStart, timeEnd, present[], absent[],
//                prevResults[], topics[], explanation, gaps[],
//                agreements[], signatures[] }
//   t        → translations (unused — the generator has its own labels)
//   lang     → "am" | "en" | "om"
//   teamName → string
//   options  → { language, includeAI, filename, … }
//
const buildForumReportInput = (row, options = {}) => {
  return {
    formData: {
      date: row.date || null,
      timeStart: row.timeStart || "",
      timeEnd: row.timeEnd || "",
      present: Array.isArray(row.present)
        ? row.present
        : Array.isArray(row.presentMembers)
          ? row.presentMembers
          : [],
      absent: Array.isArray(row.absent)
        ? row.absent
        : Array.isArray(row.absentMembers)
          ? row.absentMembers
          : [],
      prevResults: Array.isArray(row.prevResults) ? row.prevResults : [],
      topics: Array.isArray(row.topics) ? row.topics : [],
      explanation: row.explanation || "",
      gaps: Array.isArray(row.gaps) ? row.gaps : [],
      agreements: Array.isArray(row.agreements) ? row.agreements : [],
      signatures: Array.isArray(row.signatures) ? row.signatures : [],
    },
    t: null, // generator uses its own labels
    lang: options.language || "am",
    teamName: row.team_name || row.teamName || row.team || "",
    options: {
      language: options.language || "am",
      includeAI: options.includeAI !== false,
      filename: options.filename,
    },
  };
};

// ─── Evaluations ────────────────────────────────────────────────────
//
// exportEvaluationReportToPDF(
//   scores, members, totalScores, bestPerformer, t,
//   comments, signatures, includeAINarrative, aiNarrative,
//   preparedBy, branchName
// )
//
// This one has a positional signature, not an options object.
// We build each argument from the row.
//
const buildEvaluationInput = (row, options = {}) => {
  // The evaluation row may carry `scores` as an object
  //   { "Daniel Elias": { punctuality: 4, quality: 5, ... }, ... }
  // or as an array of per-member records. Normalize so that
  // totalScores(name) always returns a number.
  const scoresObj =
    row.scores && typeof row.scores === "object" && !Array.isArray(row.scores)
      ? row.scores
      : {};

  const totalScoresFor = (name) => {
    // If the row already carries a precomputed total, use it.
    if (row.totalScores && typeof row.totalScores[name] === "number") {
      return row.totalScores[name];
    }
    // Otherwise sum whatever scores we have.
    const s = scoresObj[name];
    if (!s) return 0;
    if (typeof s === "number") return s;
    if (typeof s === "object") {
      return Object.values(s).reduce((sum, v) => sum + (Number(v) || 0), 0);
    }
    return 0;
  };

  const members = Array.isArray(row.members)
    ? row.members
    : Object.keys(scoresObj);

  return {
    args: [
      row.scores || {}, // scores (unused by current generator, kept for signature)
      members, // members
      totalScoresFor, // totalScores(name) → number
      row.bestPerformer || row.best_performer || "", // bestPerformer
      null, // t (generator uses its own labels)
      row.comments && typeof row.comments === "object" ? row.comments : {},
      row.signatures && typeof row.signatures === "object"
        ? row.signatures
        : {},
      options.includeAINarrative === true, // includeAINarrative
      row.aiNarrative || row.ai_narrative || "", // aiNarrative
      options.preparedBy || row.evaluatedBy || row.evaluator_name || "አስተዳዳሪ",
      row.branchName || row.branch || "አዲስ ከተማ ቅርንጫፍ",
    ],
  };
};

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

/**
 * Generate a PDF for one admin-table row.
 *
 * @param {object} row       — the admin table row object
 * @param {string} dataType  — "daily-reports" | "forum-reports" | "evaluations"
 * @param {object} [options] — { language?, includeAI?, includeAINarrative?,
 *                               preparedBy?, filename? }
 *
 * @returns {Promise<{ success: boolean, error?: string }>}
 *
 * Never throws — always resolves with a status object so the caller
 * can show a toast without a try/catch at every call site.
 */
export async function generateReportForRow(row, dataType, options = {}) {
  if (!row) {
    return { success: false, error: "No record selected." };
  }

  try {
    switch (dataType) {
      case "daily-reports": {
        const {
          rows,
          date,
          options: opts,
        } = buildDailyReportInput(row, options);
        if (!rows || rows.length === 0) {
          return {
            success: false,
            error: "This daily report has no service entries to export.",
          };
        }
        await generateDailyReportPDF(rows, date, null, opts);
        return { success: true };
      }

      case "forum-reports": {
        const {
          formData,
          t,
          lang,
          teamName,
          options: opts,
        } = buildForumReportInput(row, options);
        const ok = exportForumReportToPDF(formData, t, lang, teamName, opts);
        return ok
          ? { success: true }
          : {
              success: false,
              error: "Forum report PDF could not be generated.",
            };
      }

      case "evaluations": {
        const { args } = buildEvaluationInput(row, options);
        const ok = exportEvaluationReportToPDF(...args);
        return ok
          ? { success: true }
          : {
              success: false,
              error: "Evaluation report PDF could not be generated.",
            };
      }

      default:
        return {
          success: false,
          error: `Report generation is not supported for "${dataType}".`,
        };
    }
  } catch (err) {
    // Every generator we call has its own internal try/catch and
    // returns a boolean, but this outer guard exists in case an
    // adapter throws on a malformed row.
    console.error("[adminReportGenerator] generateReportForRow failed:", err);
    return {
      success: false,
      error: err?.message || "Unexpected error while generating PDF.",
    };
  }
}

/**
 * Does report generation exist for this data type?
 * Useful for conditionally rendering the PDF button in the table.
 */
export function isReportSupported(dataType) {
  return (
    dataType === "daily-reports" ||
    dataType === "forum-reports" ||
    dataType === "evaluations"
  );
}

export default { generateReportForRow, isReportSupported };
