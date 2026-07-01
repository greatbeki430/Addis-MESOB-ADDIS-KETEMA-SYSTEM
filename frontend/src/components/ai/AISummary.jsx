// frontend/src/components/ai/AISummary.jsx
// Reusable component to display AI-generated insights on any page.
// Usage: <AISummary fetchFn={requestDailyInsight} args={[reportId]} label="Daily Insight" />

import { useState } from "react";

export default function AISummary({
  fetchFn,
  args = [],
  label = "AI Analysis",
}) {
  const [insight, setInsight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetchFn(...args);
      // The response field may be insight, summary, digest, or minutes
      const content =
        res.data.insight ||
        res.data.summary ||
        res.data.digest ||
        res.data.minutes ||
        "No content returned";
      setInsight(content);
      setGenerated(true);
    } catch (err) {
      setError(err.response?.data?.message || "AI service unavailable");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
        border: "1px solid #BFDBFE",
        borderRadius: "12px",
        padding: "16px 20px",
        marginTop: "16px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: generated ? "12px" : "0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>✨</span>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#1D4ED8" }}>
            {label}
          </span>
          <span
            style={{
              background: "#DBEAFE",
              color: "#1D4ED8",
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "99px",
              fontWeight: 500,
            }}
          >
            AI Generated
          </span>
        </div>

        {!generated && (
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            style={{
              background: isLoading ? "#93C5FD" : "#2563EB",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "7px 16px",
              cursor: isLoading ? "default" : "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {isLoading ? "Generating…" : "Generate"}
          </button>
        )}

        {generated && (
          <button
            onClick={() => {
              setGenerated(false);
              setInsight("");
            }}
            style={{
              background: "transparent",
              color: "#6B7280",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Regenerate
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "#DC2626", fontSize: "13px", margin: "8px 0 0" }}>
          ⚠ {error}
        </p>
      )}

      {insight && (
        <div
          style={{
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#1E293B",
            whiteSpace: "pre-wrap",
          }}
        >
          {insight}
        </div>
      )}
    </div>
  );
}
