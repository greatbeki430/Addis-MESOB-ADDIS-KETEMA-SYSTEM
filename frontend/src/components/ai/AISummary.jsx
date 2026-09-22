// frontend/src/components/ai/AISummary.jsx
// Enhanced AI summary component with professional styling

import { useState, useEffect, useRef, useCallback } from "react";
import { C, F, btn, radius, shadows } from "../../styles/theme";
import {
  FiZap,
  FiLoader,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCopy,
} from "react-icons/fi";

// ─── 1. Utility: Clean Markdown & Tables ─────────────────────
const cleanMarkdown = (text) => {
  if (!text) return "";

  let formatted = text;

  // Remove code fences
  formatted = formatted.replace(/```[\s\S]*?```/g, (m) =>
    m.replace(/```/g, ""),
  );

  // Convert markdown tables to readable text lists
  // Matches: | Header | ... | \n | --- | ... | \n | Cell | ... |
  formatted = formatted.replace(
    /(?:^\|.+\|\s*$\n^\|[\s\-:|]+\|\s*$\n(?:^\|.+\|\s*$\n?)*)/gm,
    (tableBlock) => {
      const lines = tableBlock.trim().split("\n");
      if (lines.length < 3) return tableBlock;

      const parseRow = (line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

      const headers = parseRow(lines[0]);
      const rows = lines.slice(2).map(parseRow);

      let out = "\n";
      rows.forEach((row, i) => {
        out += `  ${i + 1}. `;
        headers.forEach((h, j) => {
          if (row[j])
            out += `${h}: ${row[j]}${j < headers.length - 1 ? " • " : ""}`;
        });
        out += "\n";
      });
      return out;
    },
  );

  // Remove markdown emphasis markers
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "$1"); // **bold**
  formatted = formatted.replace(/\*(.+?)\*/g, "$1"); // *italic*
  formatted = formatted.replace(/__(.+?)__/g, "$1"); // __bold__
  formatted = formatted.replace(/_(.+?)_/g, "$1"); // _italic_
  formatted = formatted.replace(/`(.+?)`/g, "$1"); // `code`

  // Convert headings to clean uppercase lines
  formatted = formatted.replace(
    /^#{1,6}\s*(.+)$/gm,
    (_, title) =>
      `\n${title.trim().toUpperCase()}\n${"─".repeat(Math.min(title.trim().length, 40))}\n`,
  );

  // Convert horizontal rules
  formatted = formatted.replace(/^\s*-{3,}\s*$/gm, "─".repeat(40));

  // Convert markdown list markers
  formatted = formatted.replace(/^\s*[-*+]\s+/gm, "• ");
  formatted = formatted.replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + " ");

  // Remove leftover stray markers
  formatted = formatted
    .replace(/\*\*/g, "")
    .replace(/###/g, "")
    .replace(/---/g, "");
  formatted = formatted.replace(/^\s*\|.*\|\s*$/gm, ""); // orphan table rows

  // Collapse excess blank lines
  formatted = formatted.replace(/[ \t]+$/gm, "");
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted.trim();
};

// ─── 2. Renderer: Convert Cleaned Text to Styled JSX ─────────
const renderFormattedContent = (text) => {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let listBuffer = [];

  const flushList = (key) => {
    if (listBuffer.length) {
      elements.push(
        <ul
          key={`ul-${key}`}
          style={{
            margin: "6px 0 14px 0",
            paddingLeft: "20px",
            listStyle: "none",
          }}
        >
          {listBuffer.map((item, i) => (
            <li
              key={i}
              style={{
                position: "relative",
                paddingLeft: "16px",
                marginBottom: "4px",
                lineHeight: 1.7,
                color: "#1E293B",
                fontSize: "clamp(13px, 3vw, 14px)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  color: C.primary,
                  fontWeight: 700,
                }}
              >
                •
              </span>
              {item}
            </li>
          ))}
        </ul>,
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(idx);
      elements.push(<div key={`sp-${idx}`} style={{ height: 8 }} />);
      return;
    }

    // Divider line
    if (/^─{10,}$/.test(trimmed)) {
      flushList(idx);
      elements.push(
        <hr
          key={`hr-${idx}`}
          style={{
            border: "none",
            borderTop: `1px solid ${C.border}`,
            margin: "14px 0",
          }}
        />,
      );
      return;
    }

    // Bullet
    if (trimmed.startsWith("•")) {
      listBuffer.push(trimmed.replace(/^•\s*/, ""));
      return;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      listBuffer.push(`${numMatch[1]}. ${numMatch[2]}`);
      return;
    }

    // Section heading (ALL CAPS short line)
    const isHeading =
      /^[A-Z0-9 &'\-/:()]+$/.test(trimmed) &&
      trimmed.length < 60 &&
      trimmed.length > 2;

    if (isHeading) {
      flushList(idx);
      elements.push(
        <h4
          key={`h-${idx}`}
          style={{
            fontSize: "clamp(13px, 3vw, 15px)",
            fontWeight: 700,
            color: C.primary,
            fontFamily: F.sans,
            letterSpacing: "0.04em",
            margin: "16px 0 6px 0",
            textTransform: "uppercase",
          }}
        >
          {trimmed}
        </h4>,
      );
      return;
    }

    // Label: value line (e.g., "Date: 2026-09-22")
    const labelMatch = trimmed.match(/^([A-Z][A-Za-z ]{1,30}):\s*(.+)$/);
    if (labelMatch) {
      flushList(idx);
      elements.push(
        <div
          key={`lb-${idx}`}
          style={{
            fontSize: "clamp(13px, 3vw, 14px)",
            lineHeight: 1.7,
            color: "#1E293B",
            marginBottom: 4,
          }}
        >
          <strong style={{ color: C.dark, fontWeight: 600 }}>
            {labelMatch[1]}:
          </strong>{" "}
          {labelMatch[2]}
        </div>,
      );
      return;
    }

    // Normal paragraph
    flushList(idx);
    elements.push(
      <p
        key={`p-${idx}`}
        style={{
          fontSize: "clamp(13px, 3vw, 14px)",
          lineHeight: 1.8,
          color: "#1E293B",
          margin: "0 0 10px 0",
          textAlign: "justify",
        }}
      >
        {trimmed}
      </p>,
    );
  });

  flushList("end");
  return elements;
};

// ─── Main Component ─────────────────────────────────────────
const AISummary = ({
  fetchFn,
  args = [],
  label = "AI Analysis",
  variant = "default",
  autoGenerate = false,
  formatResult = null,
  onContentGenerated = null,
}) => {
  const [insight, setInsight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Helper to get the raw content from API response
  const extractContent = (res) => {
    return (
      res.data.insight ||
      res.data.summary ||
      res.data.digest ||
      res.data.minutes ||
      "No content returned"
    );
  };

  // Helper to handle formatting for the parent component
  const processContent = (content) => {
    // If a specific formatter is passed, use it. Otherwise clean it.
    const formatted = formatResult
      ? formatResult(content)
      : cleanMarkdown(content);
    if (onContentGenerated) {
      onContentGenerated(formatted);
    }
    return formatted;
  };

  const handleGenerate = useCallback(async () => {
    if (!isMounted.current) return;

    setIsLoading(true);
    setError("");
    try {
      const res = await fetchFn(...args);
      if (isMounted.current) {
        const content = extractContent(res);
        setInsight(content);
        setGenerated(true);
        processContent(content);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.response?.data?.message || "AI service unavailable");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, args, formatResult, onContentGenerated]);

  const handleCopy = () => {
    if (insight) {
      // Strip markdown for clipboard too, so it pastes cleanly
      const cleanText = cleanMarkdown(insight);
      navigator.clipboard?.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setGenerated(false);
    setInsight("");
    handleGenerate();
  };

  const getFormattedContent = () => {
    if (!insight) return "";
    // We clean the content for display, but if a custom formatResult is provided, we use that
    return formatResult ? formatResult(insight) : cleanMarkdown(insight);
  };

  useEffect(() => {
    let isEffectActive = true;

    const loadData = async () => {
      if (!isEffectActive || !isMounted.current) return;

      if (autoGenerate && !generated) {
        setIsLoading(true);
        setError("");
        try {
          const res = await fetchFn(...args);
          if (isEffectActive && isMounted.current) {
            const content = extractContent(res);
            setInsight(content);
            setGenerated(true);
            processContent(content);
          }
        } catch (err) {
          if (isEffectActive && isMounted.current) {
            setError(err.response?.data?.message || "AI service unavailable");
          }
        } finally {
          if (isEffectActive && isMounted.current) {
            setIsLoading(false);
          }
        }
      }
    };

    loadData();

    return () => {
      isEffectActive = false;
    };
  }, [
    autoGenerate,
    generated,
    fetchFn,
    args,
    formatResult,
    onContentGenerated,
  ]);

  const variantStyles = {
    default: {
      background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
      border: `1px solid #BFDBFE`,
      iconColor: "#1D4ED8",
      padding: "16px 20px",
    },
    compact: {
      background: "#F8FAFC",
      border: `1px solid ${C.border}`,
      iconColor: C.muted,
      padding: "12px 16px",
    },
    highlight: {
      background: "linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%)",
      border: `2px solid ${C.primary}`,
      iconColor: C.primary,
      padding: "20px 24px",
      boxShadow: shadows.md,
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;
  const displayContent = getFormattedContent();

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 18px",
          background: "#FEF2F2",
          border: `1px solid #FECACA`,
          borderRadius: radius.lg,
        }}
      >
        <FiAlertCircle size={20} color="#DC2626" />
        <span style={{ color: "#DC2626", fontSize: "14px", flex: 1 }}>
          {error}
        </span>
        <button
          onClick={handleGenerate}
          style={{
            ...btn.small,
            color: "#DC2626",
            borderColor: "#FECACA",
          }}
        >
          <FiRefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 20px",
          background: styles.background,
          border: styles.border,
          borderRadius: radius.lg,
          boxShadow: styles.boxShadow,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      >
        <FiLoader
          size={20}
          style={{
            animation: "spin 1s linear infinite",
            color: styles.iconColor,
          }}
        />
        <span style={{ color: C.muted, fontSize: "14px" }}>
          Generating {label.toLowerCase()}...
        </span>
      </div>
    );
  }

  if (!generated) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: styles.background,
          border: styles.border,
          borderRadius: radius.lg,
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FiZap size={20} color={styles.iconColor} />
          <span style={{ fontWeight: 600, fontSize: "14px", color: C.dark }}>
            {label}
          </span>
          <span
            style={{
              fontSize: "10px",
              background: "#DBEAFE",
              color: "#1D4ED8",
              padding: "2px 14px",
              borderRadius: "10px",
              fontWeight: 500,
            }}
          >
            AI Generated
          </span>
        </div>
        <button
          onClick={handleGenerate}
          style={{
            ...btn.primary,
            padding: "6px 16px",
            fontSize: "13px",
          }}
        >
          <FiZap size={14} />
          Generate
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: styles.padding,
        background: styles.background,
        border: styles.border,
        borderRadius: radius.lg,
        boxShadow: styles.boxShadow,
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "10px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiCheckCircle size={18} color="#10b981" />
          <span
            style={{
              fontWeight: 600,
              fontSize: "14px",
              color: C.dark,
              fontFamily: F.sans,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "10px",
              background: "#D1FAE5",
              color: "#065F46",
              padding: "2px 10px",
              borderRadius: radius.pill,
              fontWeight: 500,
            }}
          >
            Generated
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={handleCopy}
            style={{
              ...btn.small,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiCopy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleRegenerate}
            style={{
              ...btn.small,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiRefreshCw size={14} />
            Regenerate
          </button>
        </div>
      </div>

      {/* RENDER FORMATTED CONTENT */}
      <div
        style={{
          fontSize: "clamp(13px, 3vw, 14px)",
          lineHeight: "1.8",
          color: "#1E293B",
          fontFamily: F.sans,
          maxHeight: variant === "compact" ? "150px" : "400px",
          overflowY: "auto",
          paddingRight: "8px",
        }}
      >
        {renderFormattedContent(displayContent)}
      </div>

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          color: C.muted,
          borderTop: `1px solid ${C.border}`,
          paddingTop: "10px",
        }}
      >
        <FiClock size={12} />
        Generated by AI • {new Date().toLocaleString()}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default AISummary;
