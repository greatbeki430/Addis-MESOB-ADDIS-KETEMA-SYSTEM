// frontend/src/components/ai/AISmartSearch.jsx
// AI-powered semantic search for documents with keyboard navigation

import { useState, useEffect, useRef, useCallback } from "react";
import { documentAPI } from "../../services/api";
import { C } from "../../styles/theme";

const AISmartSearch = ({
  onSelect,
  placeholder = "Search documents by name, reference, or keywords...",
  className = "",
  limit = 10,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  const wrapperRef = useRef(null);

  // Define performSearch before it's used in useEffect
  const performSearch = useCallback(
    async (searchQuery) => {
      setLoading(true);
      setError(null);
      try {
        const response = await documentAPI.getAll({
          search: searchQuery,
          limit,
        });
        setResults(response.data.documents || []);
        setShowResults(true);
      } catch (err) {
        setError("Search failed. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  // Debounced search - now uses the defined performSearch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Define handleSelect before it's used in keyboard navigation
  const handleSelect = useCallback(
    (doc) => {
      setQuery(doc.title);
      setShowResults(false);
      setSelectedIndex(-1);
      if (onSelect) onSelect(doc);
    },
    [onSelect],
  );

  // Keyboard navigation - now uses the defined handleSelect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showResults || results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showResults, results, selectedIndex, handleSelect]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 44px 10px 40px",
            border: `2px solid ${showResults ? C.primary : "#CBD5E1"}`,
            borderRadius: "10px",
            fontSize: "14px",
            outline: "none",
            transition: "all 0.3s ease",
            background: "#fff",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = C.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primary}22`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94A3B8",
            fontSize: "16px",
          }}
        >
          {loading ? (
            <span style={{ animation: "spin 1s linear infinite" }}>⚡</span>
          ) : (
            "🔍"
          )}
        </div>
        {query && (
          <button
            onClick={clearSearch}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            border: "1px solid #E2E8F0",
            maxHeight: "400px",
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {loading ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#94A3B8",
              }}
            >
              <span style={{ animation: "spin 1s linear infinite" }}>⚡</span>
              {" Searching..."}
            </div>
          ) : error ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#EF4444",
              }}
            >
              ⚠ {error}
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#94A3B8",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
              <p style={{ margin: 0, fontWeight: 500 }}>No documents found</p>
              <p style={{ fontSize: "13px", margin: "4px 0 0" }}>
                Try different keywords or check your spelling
              </p>
            </div>
          ) : (
            results.map((doc, index) => (
              <div
                key={doc._id}
                onClick={() => handleSelect(doc)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom:
                    index < results.length - 1 ? "1px solid #F1F5F9" : "none",
                  background:
                    index === selectedIndex ? "#F1F5F9" : "transparent",
                  transition: "background 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div
                  style={{
                    fontSize: "20px",
                    flexShrink: 0,
                  }}
                >
                  {doc.fileType === "pdf" ? "📄" : "📎"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "#0F172A",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "4px",
                    }}
                  >
                    {doc.referenceNumber && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748B",
                          background: "#F1F5F9",
                          padding: "1px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {doc.referenceNumber}
                      </span>
                    )}
                    {doc.documentType && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#1D4ED8",
                          background: "#DBEAFE",
                          padding: "1px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {doc.documentType.replace(/_/g, " ")}
                      </span>
                    )}
                    {doc.citizenName && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#475569",
                        }}
                      >
                        👤 {doc.citizenName}
                      </span>
                    )}
                  </div>
                  {doc.aiExtractedData?.summary && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748B",
                        marginTop: "4px",
                        fontStyle: "italic",
                      }}
                    >
                      🤖 {doc.aiExtractedData.summary}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    documentAPI.getDownloadUrl(doc._id).then((res) => {
                      window.open(res.data.fileUrl, "_blank");
                    });
                  }}
                  style={{
                    background: C.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AISmartSearch;
