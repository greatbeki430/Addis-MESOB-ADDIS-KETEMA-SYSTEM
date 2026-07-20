// frontend/src/components/chatbot/ChatbotWidget.jsx
// Full-featured AI chatbot widget — global, Amharic + English
// Features: chat history, quick actions, complaint helper, translation, service search

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { chatbotAPI, aiAPI } from "../../services/api";
import { C } from "../../styles/theme";

// ✅ Import react-icons
import {
  FiMessageSquare,
  FiTool,
  FiHelpCircle,
  FiX,
  FiHome,
  FiFileText,
  FiStar,
  FiUsers,
  FiFolder,
  FiKey,
  FiCopy,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiBook,
  FiBriefcase,
  FiUser,
  FiGlobe,
  FiSend,
  FiLoader,
  FiSearch,
  FiClock,
  FiUserCheck,
  FiBarChart2,
  FiUsers as FiUsersIcon,
} from "react-icons/fi";

// ─── Markdown Renderer ──────────────────────────────────────────
const MarkdownRenderer = ({ content }) => {
  // Split content into lines
  const lines = content.split("\n");

  // Use a function to render table from rows
  const renderTable = (rows) => {
    if (!rows || rows.length === 0) return null;

    // Find header row (first row with all cells)
    const headerRow = rows[0];
    const dataRows = rows.slice(1);

    // Filter out separator rows (rows with only ---)
    const filteredDataRows = dataRows.filter(
      (row) => !row.every((cell) => /^[-:]+$/.test(cell.trim())),
    );

    // Determine column alignment from separator row if exists
    let alignments = [];
    let tableRows = [headerRow, ...filteredDataRows];

    if (
      dataRows.length > 0 &&
      dataRows[0].every((cell) => /^[-:]+$/.test(cell.trim()))
    ) {
      alignments = dataRows[0].map((cell) => {
        const trimmed = cell.trim();
        if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
        if (trimmed.endsWith(":")) return "right";
        if (trimmed.startsWith(":")) return "left";
        return "left";
      });
      // Remove separator row from data
      tableRows = [headerRow, ...filteredDataRows];
    }

    return (
      <div style={{ overflowX: "auto", margin: "8px 0" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            backgroundColor: "#fff",
            borderRadius: "6px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#F1F5F9" }}>
              {tableRows[0]?.map((cell, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: "6px 10px",
                    textAlign: alignments[idx] || "left",
                    borderBottom: "2px solid #E2E8F0",
                    fontWeight: 600,
                    color: "#0F172A",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  <span
                    dangerouslySetInnerHTML={{ __html: renderText(cell) }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, rowIdx) => (
              <tr
                key={rowIdx}
                style={{
                  backgroundColor: rowIdx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                  transition: "background-color 0.15s",
                }}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    style={{
                      padding: "6px 10px",
                      textAlign: alignments[cellIdx] || "left",
                      borderBottom: "1px solid #F1F5F9",
                      fontSize: "12px",
                      color: "#1E293B",
                      wordBreak: "break-word",
                    }}
                  >
                    <span
                      dangerouslySetInnerHTML={{ __html: renderText(cell) }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderText = (text) => {
    // Remove ** and replace with bold
    let formatted = text;

    // Bold: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italic: *text* -> <em>text</em>
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Inline code: `text` -> <code>text</code>
    formatted = formatted.replace(/`(.*?)`/g, "<code>$1</code>");

    // Links: [text](url) -> <a href="url">text</a>
    formatted = formatted.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );

    return formatted;
  };

  // Process lines to build elements
  const elements = [];
  let inTable = false;
  let tableRows = [];

  // Process lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines at the beginning of a table
    if (inTable && trimmed === "") {
      continue;
    }

    // Check for table start (line starts with | or contains |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
      tableRows.push(cells);
      continue;
    }

    // End of table
    if (inTable && !trimmed.startsWith("|")) {
      elements.push(
        <div key={`table-${elements.length}`}>{renderTable(tableRows)}</div>,
      );
      inTable = false;
      tableRows = [];
    }

    // Headers (## or ###)
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{
            margin: "12px 0 4px 0",
            fontSize: "14px",
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          <span
            dangerouslySetInnerHTML={{ __html: renderText(trimmed.slice(4)) }}
          />
        </h4>,
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          style={{
            margin: "14px 0 6px 0",
            fontSize: "15px",
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          <span
            dangerouslySetInnerHTML={{ __html: renderText(trimmed.slice(3)) }}
          />
        </h3>,
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          style={{
            margin: "16px 0 8px 0",
            fontSize: "17px",
            fontWeight: 700,
            color: "#0F172A",
            borderBottom: "2px solid #E2E8F0",
            paddingBottom: "4px",
          }}
        >
          <span
            dangerouslySetInnerHTML={{ __html: renderText(trimmed.slice(2)) }}
          />
        </h2>,
      );
      continue;
    }

    // Unordered lists (- item)
    if (trimmed.startsWith("- ")) {
      elements.push(
        <div
          key={`li-${i}`}
          style={{
            paddingLeft: "16px",
            margin: "2px 0",
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
          }}
        >
          <span style={{ color: "#2563EB", fontSize: "12px" }}>•</span>
          <span style={{ fontSize: "12px", color: "#1E293B" }}>
            <span
              dangerouslySetInnerHTML={{ __html: renderText(trimmed.slice(2)) }}
            />
          </span>
        </div>,
      );
      continue;
    }

    // Ordered lists (1. item)
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (orderedMatch) {
      elements.push(
        <div
          key={`ol-${i}`}
          style={{
            paddingLeft: "16px",
            margin: "2px 0",
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
          }}
        >
          <span
            style={{
              color: "#64748B",
              fontSize: "12px",
              fontWeight: 600,
              minWidth: "18px",
            }}
          >
            {orderedMatch[1]}.
          </span>
          <span style={{ fontSize: "12px", color: "#1E293B" }}>
            <span
              dangerouslySetInnerHTML={{ __html: renderText(orderedMatch[2]) }}
            />
          </span>
        </div>,
      );
      continue;
    }

    // Separators (---)
    if (trimmed === "---") {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{
            margin: "8px 0",
            border: "none",
            borderTop: "1px solid #E2E8F0",
          }}
        />,
      );
      continue;
    }

    // Blockquotes (> text)
    if (trimmed.startsWith("> ")) {
      elements.push(
        <div
          key={`blockquote-${i}`}
          style={{
            margin: "4px 0",
            padding: "6px 12px",
            borderLeft: "3px solid #2563EB",
            backgroundColor: "#F8FAFC",
            borderRadius: "0 4px 4px 0",
          }}
        >
          <span style={{ fontSize: "12px", color: "#475569" }}>
            <span
              dangerouslySetInnerHTML={{ __html: renderText(trimmed.slice(2)) }}
            />
          </span>
        </div>,
      );
      continue;
    }

    // Empty line - add spacing
    if (trimmed === "") {
      elements.push(<div key={`space-${i}`} style={{ height: "4px" }} />);
      continue;
    }

    // Regular paragraph
    if (trimmed) {
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            margin: "4px 0",
            fontSize: "12px",
            color: "#1E293B",
            lineHeight: "1.6",
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: renderText(trimmed) }} />
        </p>,
      );
    }
  }

  // Handle trailing table
  if (inTable) {
    elements.push(<div key="table-end">{renderTable(tableRows)}</div>);
  }

  return <div>{elements}</div>;
};

// ─── Message bubble ──────────────────────────────────────────
const ChatMessage = ({ msg }) => {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div style={{ textAlign: "center", margin: "6px 0" }}>
        <span
          style={{
            fontSize: "11px",
            color: "#94A3B8",
            background: "#F1F5F9",
            padding: "2px 10px",
            borderRadius: "99px",
          }}
        >
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "8px",
        gap: "6px",
        alignItems: "flex-start",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 26,
            height: 26,
            background: C.primary || "#2563EB",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            flexShrink: 0,
            color: "#fff",
            marginTop: "2px",
          }}
        >
          <FiMessageSquare size={14} />
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser ? "#2563EB" : "#F1F5F9",
          color: isUser ? "#fff" : "#1E293B",
          fontSize: "13px",
          lineHeight: "1.55",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: "hidden",
        }}
      >
        {isUser ? msg.content : <MarkdownRenderer content={msg.content} />}
        {msg.timestamp && (
          <div
            style={{
              fontSize: "10px",
              opacity: 0.6,
              marginTop: "6px",
              textAlign: isUser ? "right" : "left",
              borderTop: isUser
                ? "1px solid rgba(255,255,255,0.2)"
                : "1px solid rgba(0,0,0,0.05)",
              paddingTop: "4px",
            }}
          >
            <FiClock size={10} style={{ marginRight: "2px" }} />
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Quick action chip ────────────────────────────────────────
const QuickChip = ({ label, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{
      background: "#EFF6FF",
      border: "1px solid #BFDBFE",
      borderRadius: "99px",
      padding: "5px 12px",
      fontSize: "12px",
      color: "#1D4ED8",
      cursor: "pointer",
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      transition: "all 0.15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "#DBEAFE";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#EFF6FF";
    }}
  >
    {icon && <span style={{ fontSize: "14px" }}>{icon}</span>}
    {label}
  </button>
);

// ─── Tab button ───────────────────────────────────────────────
const TabBtn = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: "7px 4px",
      background: active ? "#2563EB" : "transparent",
      color: active ? "#fff" : "#64748B",
      border: "none",
      borderRadius: "8px",
      fontSize: "11px",
      fontWeight: active ? 600 : 400,
      cursor: "pointer",
      transition: "all 0.15s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "3px",
    }}
  >
    <span style={{ fontSize: "14px" }}>{icon}</span> {label}
  </button>
);

// ─── Tool button ──────────────────────────────────────────────
const ToolBtn = ({ label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      padding: "8px 4px",
      background: active ? "#2563EB" : "#F1F5F9",
      color: active ? "#fff" : "#475569",
      border: "none",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "2px",
    }}
  >
    <span style={{ fontSize: "16px" }}>{icon}</span>
    {label}
  </button>
);

// ─── Main component ───────────────────────────────────────────
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Tools tab state
  const [toolMode, setToolMode] = useState(null);
  const [toolInput, setToolInput] = useState("");
  const [toolResult, setToolResult] = useState(null);
  const [toolLoading, setToolLoading] = useState(false);
  const [translateTarget, setTranslateTarget] = useState("am");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();

  // Load chat history on first open
  useEffect(() => {
    let isMounted = true;

    if (isOpen && !sessionLoaded && user) {
      chatbotAPI
        .getHistory()
        .then((res) => {
          if (!isMounted) return;
          const msgs = res.data.messages || [];
          if (msgs.length > 0) {
            setMessages(
              msgs.map((m) => ({ ...m, timestamp: m.timestamp || new Date() })),
            );
          } else {
            setMessages([
              {
                role: "assistant",
                content: user?.name
                  ? `Hello ${user.name}! 👋 I'm your MESOB Assistant.\n\nሰላም ${user.name}! 🌟 የ MESOB ረዳትዎ ነኝ።\n\nYou can ask me anything about the system, CRRSA services, or get help with reports and evaluations. Use the Tools tab for translation, complaint handling, and service lookup.`
                  : "Hello! I'm your MESOB Assistant. Ask me anything about the system or CRRSA services.",
                timestamp: new Date(),
              },
            ]);
          }
          if (isMounted) setSessionLoaded(true);
        })
        .catch(() => {
          if (isMounted) setSessionLoaded(true);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, sessionLoaded, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset unread on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setUnreadCount(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || input).trim();
      if (!trimmed || isLoading) return;

      const userMsg = { role: "user", content: trimmed, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await chatbotAPI.sendMessage(trimmed);
        const reply = res.data.reply;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply, timestamp: new Date() },
        ]);
        if (!isOpen) setUnreadCount((c) => c + 1);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I'm having trouble connecting. Please try again.\n\nለምላሽ ችግር አጋጥሟል። እባክዎ እንደገና ይሞክሩ።",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, isOpen],
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    await chatbotAPI.clearSession().catch(() => {});
    setMessages([
      {
        role: "system",
        content: "Chat cleared",
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content:
          "New session started. How can I help you?\n\nአዲስ ውይይት ተጀምሯል። ምን ልረዳዎ?",
        timestamp: new Date(),
      },
    ]);
  };

  const quickActions = [
    {
      label: "System overview",
      icon: <FiHome size={14} />,
      msg: "Give me an overview of the Addis MESOB system and its main features",
    },
    {
      label: "Daily Report help",
      icon: <FiFileText size={14} />,
      msg: "How do I fill out a Daily Report? Walk me through step by step.",
    },
    {
      label: "Evaluation guide",
      icon: <FiStar size={14} />,
      msg: "Explain the 5 evaluation criteria and how scoring works",
    },
    {
      label: "Forum Report",
      icon: <FiUsers size={14} />,
      msg: "What is a Peer Forum Report and how do I create one?",
    },
    {
      label: "Document Vault",
      icon: <FiFolder size={14} />,
      msg: "How do I use the CRRSA Document Vault to upload and find documents?",
    },
    {
      label: "My role access",
      icon: <FiKey size={14} />,
      msg: `What features can I access as a ${user?.role || "user"}?`,
    },
  ];

  // ─── Helper: extract a human-readable error message from an Axios error ──
  const getToolErrorMessage = (err, action) => {
    const code = err?.response?.data?.code;
    const serverMsg = err?.response?.data?.message;
    const status = err?.response?.status;

    if (code === "AI_AUTH_ERROR" || code === "AI_NOT_CONFIGURED") {
      return "The AI service is misconfigured on the server (invalid API key). Contact your system administrator.";
    }
    if (code === "AI_RATE_LIMIT" || status === 429) {
      return "The AI service is temporarily busy. Wait a moment and try again.";
    }
    if (code === "AI_MODEL_NOT_FOUND" || status === 503) {
      return (
        serverMsg ||
        "AI service unavailable. Contact your system administrator."
      );
    }
    if (status === 401 || status === 403) {
      return "Authentication error. Please refresh the page and log in again.";
    }
    return serverMsg || `${action} failed. Please try again.`;
  };

  // ─── Tool: Complaint Categorizer ────────────────────────────
  const handleComplaint = async () => {
    if (!toolInput.trim()) return;
    setToolLoading(true);
    setToolResult(null);
    try {
      const res = await aiAPI.categorizeComplaint(toolInput);
      setToolResult({ type: "complaint", data: res.data });
    } catch (err) {
      setToolResult({
        type: "error",
        data: getToolErrorMessage(err, "Complaint analysis"),
      });
    } finally {
      setToolLoading(false);
    }
  };

  // ─── Tool: Translation ───────────────────────────────────────
  const handleTranslate = async () => {
    if (!toolInput.trim()) return;
    setToolLoading(true);
    setToolResult(null);
    try {
      const res = await aiAPI.translate(toolInput, translateTarget);
      setToolResult({ type: "translation", data: res.data.translation });
    } catch (err) {
      setToolResult({
        type: "error",
        data: getToolErrorMessage(err, "Translation"),
      });
    } finally {
      setToolLoading(false);
    }
  };

  // ─── Tool: Service Search ────────────────────────────────────
  const handleServiceSearch = async () => {
    if (!toolInput.trim()) return;
    setToolLoading(true);
    setToolResult(null);
    try {
      const res = await aiAPI.getServiceRecommendations(toolInput);
      setToolResult({ type: "services", data: res.data });
    } catch (err) {
      setToolResult({
        type: "error",
        data: getToolErrorMessage(err, "Service search"),
      });
    } finally {
      setToolLoading(false);
    }
  };

  const renderToolResult = () => {
    if (!toolResult) return null;
    const { type, data } = toolResult;

    if (type === "error")
      return (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "13px",
            color: "#B91C1C",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <FiAlertCircle
            size={16}
            style={{ flexShrink: 0, marginTop: "1px" }}
          />
          <span>{data}</span>
        </div>
      );

    if (type === "translation")
      return (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: "8px",
            padding: "12px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#15803D",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FiCheckCircle size={14} />
            Translation
          </div>
          <p
            style={{
              fontSize: "14px",
              color: "#1E293B",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {data}
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText(data)}
            style={{
              marginTop: "8px",
              background: "none",
              border: "1px solid #86EFAC",
              borderRadius: "6px",
              padding: "3px 10px",
              fontSize: "11px",
              color: "#15803D",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiCopy size={12} />
            Copy
          </button>
        </div>
      );

    if (type === "complaint")
      return (
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "13px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background:
                  data.severity === "high"
                    ? "#FEE2E2"
                    : data.severity === "medium"
                      ? "#FEF9C3"
                      : "#F0FDF4",
                color:
                  data.severity === "high"
                    ? "#B91C1C"
                    : data.severity === "medium"
                      ? "#854D0E"
                      : "#15803D",
                padding: "2px 10px",
                borderRadius: "99px",
                fontSize: "11px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiAlertCircle size={12} />
              {data.severity?.toUpperCase()} SEVERITY
            </span>
            <span
              style={{
                background: "#EFF6FF",
                color: "#1D4ED8",
                padding: "2px 10px",
                borderRadius: "99px",
                fontSize: "11px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiInfo size={12} />
              {data.category?.replace(/_/g, " ")}
            </span>
            {data.department && (
              <span
                style={{
                  background: "#F5F3FF",
                  color: "#7C3AED",
                  padding: "2px 10px",
                  borderRadius: "99px",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <FiBriefcase size={12} />
                {data.department}
              </span>
            )}
          </div>
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                fontWeight: 600,
                color: "#0F172A",
                marginBottom: "3px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiMessageSquare size={14} />
              Suggested Response:
            </div>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
              {data.suggestedResponse}
            </p>
          </div>
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                fontWeight: 600,
                color: "#0F172A",
                marginBottom: "3px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FiCheckCircle size={14} />
              Action Required:
            </div>
            <p style={{ margin: 0, color: "#475569" }}>{data.actionRequired}</p>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiClock size={12} />
            Est. resolution: {data.estimatedResolutionDays} day(s)
          </div>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(data.suggestedResponse)
            }
            style={{
              marginTop: "8px",
              background: "none",
              border: "1px solid #CBD5E1",
              borderRadius: "6px",
              padding: "3px 10px",
              fontSize: "11px",
              color: "#475569",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <FiCopy size={12} />
            Copy Response
          </button>
        </div>
      );

    if (type === "services")
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {data.summary && (
            <p
              style={{
                fontSize: "13px",
                color: "#475569",
                margin: 0,
                fontStyle: "italic",
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
              }}
            >
              <FiInfo size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
              {data.summary}
            </p>
          )}
          {(data.recommendations || []).map((rec, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FiBriefcase size={14} color="#2563EB" />
                {rec.serviceName}
              </div>
              <div
                style={{ fontSize: "11px", color: "#64748B", margin: "2px 0" }}
              >
                <FiUser size={12} style={{ marginRight: "4px" }} />
                {rec.department}
              </div>
              <div style={{ fontSize: "12px", color: "#475569" }}>
                {rec.reason}
              </div>
            </div>
          ))}
        </div>
      );
  };

  return (
    <>
      {/* ─── Floating button ─── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open MESOB Assistant"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(37,99,235,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          zIndex: 1000,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.45)";
        }}
      >
        {isOpen ? <FiX size={22} /> : <FiMessageSquare size={22} />}
        {unreadCount > 0 && !isOpen && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "#EF4444",
              color: "#fff",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount}
          </div>
        )}
      </button>

      {/* ─── Chat panel ─── */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "92px",
            right: "24px",
            width: "420px",
            maxWidth: "calc(100vw - 48px)",
            height: "560px",
            maxHeight: "calc(100vh - 120px)",
            background: "#fff",
            borderRadius: "20px",
            boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999,
            border: "1px solid #E2E8F0",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              padding: "14px 16px",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    color: "#fff",
                  }}
                >
                  <FiMessageSquare size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>
                    MESOB Assistant
                  </div>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>
                    <FiGlobe size={11} style={{ marginRight: "4px" }} />
                    AI-powered · Amharic & English
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "4px",
                marginTop: "10px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "10px",
                padding: "3px",
              }}
            >
              <TabBtn
                label="Chat"
                icon={<FiMessageSquare size={14} />}
                active={activeTab === "chat"}
                onClick={() => setActiveTab("chat")}
              />
              <TabBtn
                label="Tools"
                icon={<FiTool size={14} />}
                active={activeTab === "tools"}
                onClick={() => setActiveTab("tools")}
              />
              <TabBtn
                label="Help"
                icon={<FiHelpCircle size={14} />}
                active={activeTab === "help"}
                onClick={() => setActiveTab("help")}
              />
            </div>
          </div>

          {/* ─── CHAT TAB ─── */}
          {activeTab === "chat" && (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "12px",
                  background: "#F8FAFC",
                }}
              >
                {messages.map((msg, i) => (
                  <ChatMessage key={i} msg={msg} />
                ))}
                {isLoading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        background: "#2563EB",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        color: "#fff",
                        marginTop: "2px",
                      }}
                    >
                      <FiMessageSquare size={14} />
                    </div>
                    <div
                      style={{
                        background: "#F1F5F9",
                        padding: "10px 14px",
                        borderRadius: "18px 18px 18px 4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          alignItems: "center",
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            style={{
                              width: 6,
                              height: 6,
                              background: "#94A3B8",
                              borderRadius: "50%",
                              animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick actions (show only on first load) */}
              {messages.length <= 1 && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderTop: "1px solid #E2E8F0",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    background: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {quickActions.map((a, i) => (
                    <QuickChip
                      key={i}
                      label={a.label}
                      icon={a.icon}
                      onClick={() => sendMessage(a.msg)}
                    />
                  ))}
                </div>
              )}

              {/* Input */}
              <div
                style={{
                  padding: "10px 12px",
                  borderTop: "1px solid #E2E8F0",
                  display: "flex",
                  gap: "8px",
                  background: "#fff",
                  flexShrink: 0,
                }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything... / ማንኛውንም ጥያቄ ይጠይቁ..."
                  rows={2}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    border: "1px solid #CBD5E1",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    resize: "none",
                    outline: "none",
                    fontFamily: "inherit",
                    lineHeight: 1.4,
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  style={{
                    background:
                      input.trim() && !isLoading ? "#2563EB" : "#CBD5E1",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0 14px",
                    cursor: input.trim() && !isLoading ? "pointer" : "default",
                    fontSize: "18px",
                    transition: "background 0.2s",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiSend size={18} />
                </button>
              </div>
            </>
          )}

          {/* ─── TOOLS TAB ─── */}
          {activeTab === "tools" && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Tool selector */}
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  {
                    key: "complaint",
                    icon: <FiAlertCircle size={16} />,
                    label: "Complaint",
                  },
                  {
                    key: "translate",
                    icon: <FiGlobe size={16} />,
                    label: "Translate",
                  },
                  {
                    key: "services",
                    icon: <FiSearch size={16} />,
                    label: "Find Service",
                  },
                ].map((t) => (
                  <ToolBtn
                    key={t.key}
                    label={t.label}
                    icon={t.icon}
                    active={toolMode === t.key}
                    onClick={() => {
                      setToolMode(t.key);
                      setToolInput("");
                      setToolResult(null);
                    }}
                  />
                ))}
              </div>

              {!toolMode && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#94A3B8",
                    padding: "20px 0",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    <FiTool
                      size={32}
                      color="#94A3B8"
                      style={{ display: "block", margin: "0 auto" }}
                    />
                  </div>
                  <p style={{ fontSize: "13px", margin: 0 }}>
                    Select a tool above
                  </p>
                </div>
              )}

              {toolMode === "translate" && (
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setTranslateTarget("am")}
                    style={{
                      flex: 1,
                      padding: "6px",
                      background:
                        translateTarget === "am" ? "#2563EB" : "#F1F5F9",
                      color: translateTarget === "am" ? "#fff" : "#475569",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FiGlobe size={14} style={{ marginRight: "4px" }} />→
                    Amharic
                  </button>
                  <button
                    onClick={() => setTranslateTarget("en")}
                    style={{
                      flex: 1,
                      padding: "6px",
                      background:
                        translateTarget === "en" ? "#2563EB" : "#F1F5F9",
                      color: translateTarget === "en" ? "#fff" : "#475569",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FiGlobe size={14} style={{ marginRight: "4px" }} />→
                    English
                  </button>
                </div>
              )}

              {toolMode && (
                <>
                  <textarea
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    placeholder={
                      toolMode === "complaint"
                        ? "Paste citizen complaint here..."
                        : toolMode === "translate"
                          ? "Enter text to translate..."
                          : "Describe what the citizen needs..."
                    }
                    rows={4}
                    style={{
                      border: "1px solid #CBD5E1",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      fontSize: "13px",
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      lineHeight: 1.4,
                    }}
                  />
                  <button
                    onClick={
                      toolMode === "complaint"
                        ? handleComplaint
                        : toolMode === "translate"
                          ? handleTranslate
                          : handleServiceSearch
                    }
                    disabled={toolLoading || !toolInput.trim()}
                    style={{
                      background:
                        toolLoading || !toolInput.trim()
                          ? "#93C5FD"
                          : "#2563EB",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor:
                        toolLoading || !toolInput.trim()
                          ? "default"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {toolLoading ? (
                      <>
                        <FiLoader
                          size={16}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        Processing…
                      </>
                    ) : toolMode === "complaint" ? (
                      <>
                        <FiAlertCircle size={16} />
                        Analyze Complaint
                      </>
                    ) : toolMode === "translate" ? (
                      <>
                        <FiGlobe size={16} />
                        Translate
                      </>
                    ) : (
                      <>
                        <FiSearch size={16} />
                        Find Services
                      </>
                    )}
                  </button>
                  {toolResult && renderToolResult()}
                </>
              )}
            </div>
          )}

          {/* ─── HELP TAB ─── */}
          {activeTab === "help" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
              <h4
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  color: "#0F172A",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FiBook size={18} />
                Quick Reference
              </h4>
              {[
                {
                  icon: <FiHome size={16} />,
                  title: "Dashboard",
                  desc: "View stats, AI digest, department performance charts",
                },
                {
                  icon: <FiFileText size={16} />,
                  title: "Daily Report (/report)",
                  desc: "Log daily services. Select dept → service → enter M/F counts. Leaders and above only.",
                },
                {
                  icon: <FiStar size={16} />,
                  title: "Evaluation (/evaluation)",
                  desc: "Score team members on 5 criteria (100 pts total). Export signed PDF.",
                },
                {
                  icon: <FiUsers size={16} />,
                  title: "Peer Forum (/forum)",
                  desc: "Fill attendance, discussion topics, gaps, agreements. AI generates minutes.",
                },
                {
                  icon: <FiBarChart2 size={16} />,
                  title: "Analytics (/analytics)",
                  desc: "Generate reports by period. Export Excel/PDF/Word.",
                },
                {
                  icon: <FiTool size={16} />,
                  title: "Services (/services)",
                  desc: "Browse all CRRSA service catalogue by department. Admin only.",
                },
                {
                  icon: <FiFolder size={16} />,
                  title: "Document Vault (/documents)",
                  desc: "Upload CRRSA documents. AI auto-fills metadata. Lifetime storage.",
                },
                {
                  icon: <FiUsersIcon size={16} />,
                  title: "Users (/users)",
                  desc: "Manage users. Assign roles and teams. Admin only.",
                },
                {
                  icon: <FiUserCheck size={16} />,
                  title: "Teams (/teams)",
                  desc: "Create and manage teams. Superadmin only.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #F1F5F9",
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      flexShrink: 0,
                      marginTop: "1px",
                      color: "#2563EB",
                    }}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "#0F172A",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748B",
                        marginTop: "2px",
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
              <div
                style={{
                  marginTop: "12px",
                  background: "#EFF6FF",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#1D4ED8",
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FiInfo size={14} />
                  Tips
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#1E293B",
                    lineHeight: 1.5,
                  }}
                >
                  • Ask me in Amharic for Amharic replies
                  <br />
                  • Use Tools tab to translate content or analyze complaints
                  <br />• Type "help me with [feature]" for step-by-step guides
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Table styles */
        table {
          border-collapse: collapse;
        }
        table th {
          background-color: #F1F5F9 !important;
          font-weight: 600 !important;
        }
        table tr:hover td {
          background-color: #F8FAFC !important;
        }
        /* Code styles */
        code {
          background-color: #F1F5F9;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 11px;
          color: #2563EB;
          font-family: monospace;
        }
        /* Link styles */
        a {
          color: #2563EB;
          text-decoration: underline;
          text-decoration-color: #93C5FD;
        }
        a:hover {
          color: #1D4ED8;
          text-decoration-color: #2563EB;
        }
        /* Strong text */
        strong {
          color: #0F172A;
          font-weight: 700;
        }
      `}</style>
    </>
  );
}
