// frontend/src/components/chatbot/ChatbotWidget.jsx
// Floating AI chatbot widget — mounts globally in App.jsx
// Works for all authenticated users in Amharic or English

import { useState, useEffect, useRef } from "react";
// import {
//   sendChatMessage,
//   getChatHistory,
//   clearChatSession,
// } from "../../services/aiApi";
import { useAuth } from "../../hooks/useAuth";
import { chatbotAPI } from "../../services/api";
const sendChatMessage = (msg) => chatbotAPI.sendMessage(msg);
const getChatHistory = () => chatbotAPI.getHistory();
const clearChatSession = () => chatbotAPI.clearSession();

// ─── Individual message bubble ───────────────────────────────
const ChatMessage = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser ? "#2563EB" : "#F1F5F9",
          color: isUser ? "#ffffff" : "#1E293B",
          fontSize: "13px",
          lineHeight: "1.5",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
};

// ─── Main Chatbot Widget ──────────────────────────────────────
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Load chat history when widget opens for the first time
  useEffect(() => {
    if (isOpen && !sessionLoaded && user) {
      getChatHistory()
        .then((res) => {
          if (res.data.messages?.length > 0) {
            setMessages(res.data.messages);
          } else {
            // Welcome message
            setMessages([
              {
                role: "assistant",
                content: user?.name
                  ? `Hello ${user.name}! I'm your Addis MESOB assistant. How can I help you today?\n\nሰላም ${user.name}! እኔ የ Addis MESOB ረዳትዎ ነኝ። ዛሬ እንዴት ልረዳዎ?`
                  : "Hello! I'm your Addis MESOB assistant. Ask me anything about the system, services, or your reports.",
              },
            ]);
          }
          setSessionLoaded(true);
        })
        .catch(() => setSessionLoaded(true));
    }
  }, [isOpen, sessionLoaded, user]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again.\n\nይቅርታ፣ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    await clearChatSession().catch(() => {});
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. How can I help you?\n\nውይይቱ ተጠርጓል። ምን ልረዳዎ?",
      },
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ─── Floating button ─── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open AI chatbot"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#2563EB",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          zIndex: 1000,
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* ─── Chat panel ─── */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "92px",
            right: "24px",
            width: "360px",
            maxWidth: "calc(100vw - 48px)",
            height: "480px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 999,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#2563EB",
              padding: "14px 16px",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🤖</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>
                  MESOB Assistant
                </div>
                <div style={{ fontSize: "11px", opacity: 0.8 }}>
                  AI-powered · Amharic & English
                </div>
              </div>
            </div>
            <button
              onClick={handleClear}
              title="Clear chat"
              style={{
                background: "rgba(255,255,255,0.2)",
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

          {/* Messages */}
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
                  justifyContent: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    background: "#F1F5F9",
                    padding: "10px 14px",
                    borderRadius: "18px 18px 18px 4px",
                    fontSize: "13px",
                    color: "#64748B",
                  }}
                >
                  <span style={{ animation: "pulse 1s infinite" }}>
                    Thinking…
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              gap: "8px",
              background: "#fff",
            }}
          >
            <textarea
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
                lineHeight: "1.4",
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                background: input.trim() && !isLoading ? "#2563EB" : "#CBD5E1",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "0 14px",
                cursor: input.trim() && !isLoading ? "pointer" : "default",
                fontSize: "18px",
                transition: "background 0.2s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
