// src/utils/formatMeetingMinutes.js
//
// Turns the raw Markdown-ish output from the AI meeting-minutes endpoint
// into a clean, human-written-looking meeting minutes document.
//
// The AI produces output containing:
//   - **bold** markers around headings and field labels
//   - `---` horizontal rules as section separators
//   - `### heading` Markdown headers
//   - Markdown pipe tables:  | # | Task | Owner | Deadline |
//   - `- **Topic** – body` bullets where the topic is a Markdown bold
//
// None of that belongs in a document a coordinator hands to a manager.
// This module strips the syntax, translates the well-known headings, and
// re-renders the table as fixed-width columns.

const HEADING_MAP = {
  // English source → trilingual output
  "meeting minutes": {
    am: "የስብሰባ ደቂቃዎች",
    en: "Meeting Minutes",
    om: "Daqiiqaa Walgahii",
  },
  "agenda items & decisions": {
    am: "የአጀንዳ ውሳኔዎች",
    en: "Agenda Items & Decisions",
    om: "Ajandaa fi Murtiiwwan",
  },
  "agenda items and decisions": {
    am: "የአጀንዳ ውሳኔዎች",
    en: "Agenda Items & Decisions",
    om: "Ajandaa fi Murtiiwwan",
  },
  "action items": { am: "የተግባር እቅዶች", en: "Action Items", om: "Wanta Hojii" },
  "next meeting": {
    am: "ቀጣይ ስብሰባ",
    en: "Next Meeting",
    om: "Walgahii Itti Aanu",
  },
  attendees: { am: "ተሳታፊዎች", en: "Attendees", om: "Hirmaattota" },
  date: { am: "ቀን", en: "Date", om: "Guyyaa" },
};

const METADATA_LABELS = new Set([
  "date",
  "attendees",
  "meeting",
  "title",
  "location",
  "chair",
]);

// ─── Helpers ────────────────────────────────────────────────

const stripMarkdown = (line) =>
  String(line ?? "")
    .replace(/\*\*/g, "")
    .replace(/(^|\s)\*(\S)/g, "$1$2") // lone asterisks around emphasis
    .replace(/###\s*/g, "")
    .replace(/^[-–—]{3,}\s*$/gm, "") // horizontal rules
    .replace(/^\s*[*·•]\s+/, "") // leading bullets (we re-add ours)
    .trim();

const isSeparatorLine = (line) => /^\s*[-=_*─]{3,}\s*$/.test(line);

const isHeadingLine = (line) =>
  /^###?\s+/.test(line) || /^\*\*[A-Z].+\*\*\s*$/.test(line);

const isPipeTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);

const isPipeTableSeparator = (line) => /^\s*\|[\s\-:|]+\|\s*$/.test(line);

// Split on the FIRST dash-like separator so "**Topic** – Body" becomes
// { label: "Topic", body: "Body" }. Supports en-dash, em-dash, and " - ".
const splitLabelBody = (line) => {
  const m = line.match(/^([^–—-]{1,120}?)\s*[–—]\s*(.+)$/);
  if (m) return { label: m[1].trim(), body: m[2].trim() };
  const m2 = line.match(/^([^:]{1,120}?):\s*(.+)$/);
  if (m2) return { label: m2[1].trim(), body: m2[2].trim() };
  return { label: null, body: line.trim() };
};

// Word-wrap a plain string to N columns on word boundaries.
const wrapText = (text, width) => {
  if (text.length <= width) return [text];
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > width && current) {
      lines.push(current);
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
};

// ─── Section parsers ────────────────────────────────────────

function parseMetadata(lines) {
  // Collect "**Label:** value" and "**Label** value" patterns until a
  // separator or heading appears.
  const metadata = [];
  for (const raw of lines) {
    const line = stripMarkdown(raw);
    if (!line) continue;
    const m = line.match(/^([A-Za-z][A-Za-z ]{1,30}):\s*(.+)$/);
    if (m && METADATA_LABELS.has(m[1].toLowerCase())) {
      metadata.push({ label: m[1].toLowerCase(), value: m[2].trim() });
    }
  }
  return metadata;
}

function parseBulletSection(lines) {
  // "- **Topic** – body" → bullets
  const bullets = [];
  for (const raw of lines) {
    const line = stripMarkdown(raw);
    if (!line) continue;
    const { label, body } = splitLabelBody(line);
    if (label) {
      // preserve the bold-ness of the label as plain text; body has
      // its own sentence(s).
      bullets.push({ label, body });
    } else {
      bullets.push({ label: null, body: line });
    }
  }
  return bullets;
}

function parsePipeTable(lines) {
  // Pull out head cells and body rows. Skip the "|---|---|" separator.
  const rows = lines
    .filter((l) => !isPipeTableSeparator(l))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim()),
    );

  if (rows.length === 0) return null;
  const header = rows[0];
  const body = rows.slice(1);
  return { header, rows: body };
}

// ─── Main entry point ───────────────────────────────────────

/**
 * @param {string} rawText - the AI's raw output
 * @param {{ language?: "am"|"en"|"om", tableWidth?: number, lineWidth?: number }} opts
 * @returns {{ title, metadata, sections, footer }}
 */
export function parseMeetingMinutes(rawText, opts = {}) {
  const language = opts.language || "am";
  const lineWidth = opts.lineWidth ?? 72; // target wrap width for plain text
  const tableWidth = opts.tableWidth ?? 76;

  const rawLines = String(rawText ?? "").split(/\r?\n/);

  // Normalize once: strip markdown, drop empties, drop horizontal rules,
  // but keep the raw line for detecting headings and tables.
  const cleaned = [];
  for (const raw of rawLines) {
    if (isSeparatorLine(raw)) continue;
    if (!raw.trim()) continue;
    cleaned.push(raw);
  }

  // Title is the first heading-like line, or "Meeting Minutes".
  let title = HEADING_MAP["meeting minutes"][language] || "Meeting Minutes";
  let cursor = 0;
  if (
    cleaned.length > 0 &&
    isHeadingLine(cleaned[0]) &&
    stripMarkdown(cleaned[0]).toLowerCase().includes("meeting minutes")
  ) {
    const mapKey = stripMarkdown(cleaned[0]).toLowerCase();
    title = HEADING_MAP[mapKey]?.[language] || stripMarkdown(cleaned[0]);
    cursor = 1;
  }

  // Metadata: consecutive label:value lines before the first heading.
  const metadataLines = [];
  while (cursor < cleaned.length && !isHeadingLine(cleaned[cursor])) {
    metadataLines.push(cleaned[cursor]);
    cursor++;
  }
  const metadata = parseMetadata(metadataLines);

  // Sections: split on heading lines. Each heading opens a new section
  // whose body extends until the next heading.
  const sections = [];
  while (cursor < cleaned.length) {
    const headingRaw = cleaned[cursor];
    if (!isHeadingLine(headingRaw)) {
      cursor++;
      continue;
    }
    const headingKey = stripMarkdown(headingRaw).toLowerCase();
    const heading =
      HEADING_MAP[headingKey]?.[language] || stripMarkdown(headingRaw);
    cursor++;

    const bodyLines = [];
    while (cursor < cleaned.length && !isHeadingLine(cleaned[cursor])) {
      bodyLines.push(cleaned[cursor]);
      cursor++;
    }

    // Decide the section shape: table, bullets, or prose.
    const hasTable = bodyLines.some(isPipeTableRow);
    if (hasTable) {
      // Table may be preceded by a couple of intro lines; keep them as
      // a `note`, then parse the table.
      const tableStart = bodyLines.findIndex(isPipeTableRow);
      const intro = bodyLines.slice(0, tableStart);
      const tableLines = bodyLines.slice(tableStart);
      const table = parsePipeTable(tableLines);
      sections.push({
        heading,
        note: intro.map(stripMarkdown).filter(Boolean).join(" "),
        table,
      });
      continue;
    }

    const hasBulletDash = bodyLines.some((l) => /^\s*[-*]\s+/.test(l));
    if (hasBulletDash) {
      sections.push({
        heading,
        bullets: parseBulletSection(bodyLines),
      });
      continue;
    }

    // Fallback: prose. Join everything and wrap later at render time.
    sections.push({
      heading,
      body: bodyLines.map(stripMarkdown).filter(Boolean).join(" "),
    });
  }

  return { title, metadata, sections, language, lineWidth, tableWidth };
}

// ─── Rendering: plain text (for textarea / AISummary) ────────

/**
 * Renders the parsed structure as plain text suitable for a <textarea>
 * or a document. Uses only ASCII + Ethiopic-safe punctuation.
 */
export function renderMeetingMinutesText(parsed) {
  const { title, metadata, sections, language, lineWidth, tableWidth } = parsed;

  const out = [];
  out.push(title);
  out.push("");

  // Metadata block: "Label: value" with wrapped continuation indent.
  const metadataLabelMap = {
    am: {
      date: "ቀን",
      attendees: "ተሳታፊዎች",
      meeting: "ስብሰባ",
      location: "ቦታ",
      chair: "ሰብሳቢ",
      title: "ርዕስ",
    },
    en: {
      date: "Date",
      attendees: "Attendees",
      meeting: "Meeting",
      location: "Location",
      chair: "Chair",
      title: "Title",
    },
    om: {
      date: "Guyyaa",
      attendees: "Hirmaattota",
      meeting: "Walgahii",
      location: "Bakka",
      chair: "Duree",
      title: "Mataduree",
    },
  };
  const labelMap = metadataLabelMap[language] || metadataLabelMap.en;

  for (const { label, value } of metadata) {
    const localized = labelMap[label] || label;
    const prefix = `${localized}: `;
    const available = lineWidth - prefix.length;
    const wrapped = wrapText(value, Math.max(available, 40));
    out.push(prefix + wrapped[0]);
    for (let i = 1; i < wrapped.length; i++) {
      out.push(" ".repeat(prefix.length) + wrapped[i]);
    }
  }
  out.push("");

  for (const section of sections) {
    out.push(section.heading);
    out.push("");

    if (section.note) {
      for (const line of wrapText(section.note, lineWidth)) {
        out.push(line);
      }
      out.push("");
    }

    if (section.bullets) {
      for (const b of section.bullets) {
        const prefix = "• ";
        const text = b.label ? `${b.label} — ${b.body}` : b.body;
        const wrapped = wrapText(text, lineWidth - prefix.length);
        out.push(prefix + wrapped[0]);
        for (let i = 1; i < wrapped.length; i++) {
          out.push(" ".repeat(prefix.length) + wrapped[i]);
        }
      }
      out.push("");
    }

    if (section.table) {
      out.push(renderPlainTable(section.table, tableWidth));
      out.push("");
    }

    if (section.body) {
      for (const line of wrapText(section.body, lineWidth)) {
        out.push(line);
      }
      out.push("");
    }
  }

  return out.join("\n").trimEnd();
}

/**
 * Renders a table as fixed-width columns, using "─" for the header rule.
 * Column widths are computed from content, then trimmed to fit `maxWidth`.
 */
export function renderPlainTable(table, maxWidth = 76) {
  if (!table || !table.header || table.header.length === 0) return "";

  // Compute natural column widths.
  const cols = table.header.length;
  const widths = table.header.map((h) => h.length);
  for (const row of table.rows) {
    for (let i = 0; i < cols; i++) {
      const cell = String(row[i] ?? "");
      if (cell.length > widths[i]) widths[i] = cell.length;
    }
  }

  // Shrink if the total exceeds maxWidth. Reduce the widest column(s)
  // first so short columns stay intact.
  const gutter = "  ".length * (cols - 1);
  let total = widths.reduce((a, b) => a + b, 0) + gutter;
  while (total > maxWidth) {
    const maxIdx = widths.indexOf(Math.max(...widths));
    if (widths[maxIdx] <= 8) break;
    widths[maxIdx] -= 1;
    total -= 1;
  }

  const pad = (s, w) =>
    s.length >= w ? s.slice(0, w) : s + " ".repeat(w - s.length);

  const lines = [];
  lines.push(widths.map((w, i) => pad(table.header[i], w)).join("  "));
  lines.push(widths.map((w) => "─".repeat(w)).join("  "));
  for (const row of table.rows) {
    lines.push(widths.map((w, i) => pad(String(row[i] ?? ""), w)).join("  "));
  }
  return lines.join("\n");
}

// ─── One-shot convenience wrapper ──────────────────────────

/**
 * Full pipeline: raw AI output → clean plain text.
 * Use this when you just need a string to drop into a textarea or
 * a PDF generator.
 */
export function formatMeetingMinutes(rawText, opts = {}) {
  return renderMeetingMinutesText(parseMeetingMinutes(rawText, opts));
}
