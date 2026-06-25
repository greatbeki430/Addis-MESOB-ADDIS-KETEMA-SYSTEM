import { useState, useEffect } from "react";
import { card, C, F, inp } from "../styles/theme";
import { SERVICES } from "../constants/services";
import { serviceAPI } from "../services/api";

export default function Services({ t, lang }) {
  const ts = t.services;
  const [search, setSearch] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const response = await serviceAPI.getAll();
        setServices(response.data || SERVICES);
      } catch (error) {
        console.error("Failed to load services:", error);
        setServices(SERVICES);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  // Map localized names
  const localizedServices = services.map((s) => ({
    ...s,
    displayName: lang === "en" ? s.nameEn : s.name,
    displayDept: lang === "en" ? s.deptEn : s.dept,
  }));

  // Get unique departments
  const depts = [
    ts.all || "All",
    ...new Set(localizedServices.map((s) => s.displayDept)),
  ];

  // Filter services
  const filtered = localizedServices.filter(
    (s) =>
      (filter === (ts.all || "All") || s.displayDept === filter) &&
      (s.displayName.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        s.displayDept.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
        animation: "fadeInUp 0.5s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px, 3vw, 14px)",
          marginBottom: "clamp(12px, 3vw, 20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "clamp(28px, 7vw, 36px)" }}>🔧</span>
          <div>
            <h1
              style={{
                fontSize: "clamp(18px, 5vw, 24px)",
                fontWeight: 900,
                color: C.dark,
                fontFamily: F.serif,
                margin: 0,
                background: `linear-gradient(90deg, ${C.dark}, ${C.primary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {ts.title}
            </h1>
            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                margin: "2px 0 0",
              }}
            >
              {ts.subtitle}
            </p>
          </div>
        </div>
        <span
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
            color: "#fff",
            padding: "clamp(4px, 1.5vw, 6px) clamp(12px, 3vw, 18px)",
            borderRadius: 20,
            fontSize: "clamp(11px, 3vw, 13px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: `0 4px 15px ${C.primary}44`,
            animation: "pulseGlow 3s ease-in-out infinite",
          }}
        >
          {ts.catalogue} • {services.length}
        </span>
      </div>

      {/* Controls */}
      <div
        style={{
          ...card,
          marginBottom: "clamp(16px, 4vw, 20px)",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "clamp(8px, 2.5vw, 12px)",
          }}
        >
          <div style={{ flex: "2 1 200px", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "clamp(12px, 3vw, 14px)",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "clamp(14px, 3.5vw, 16px)",
                color: C.muted,
                opacity: searchFocused ? 0.3 : 0.6,
                transition: "opacity 0.3s ease",
              }}
            >
              🔍
            </span>
            <input
              style={{
                ...inp,
                width: "100%",
                padding:
                  "clamp(10px, 2.5vw, 14px) clamp(10px, 3vw, 14px) clamp(10px, 2.5vw, 14px) clamp(40px, 8vw, 50px)",
                fontSize: "clamp(13px, 3.5vw, 14px)",
                borderColor: searchFocused ? C.primary : C.border,
                boxShadow: searchFocused ? `0 0 0 3px ${C.primary}22` : "none",
                transition: "all 0.3s ease",
              }}
              placeholder={ts.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
          <select
            style={{
              ...inp,
              flex: "1 1 120px",
              cursor: "pointer",
              padding: "clamp(10px, 2.5vw, 14px) clamp(14px, 3vw, 18px)",
              fontSize: "clamp(13px, 3.5vw, 14px)",
              background: C.white,
              transition: "all 0.3s ease",
              borderColor: filter !== (ts.all || "All") ? C.primary : C.border,
            }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {depts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
            gap: "clamp(12px, 3vw, 16px)",
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                background: C.white,
                borderRadius: "clamp(8px, 2.5vw, 12px)",
                padding: "clamp(12px, 4vw, 18px)",
                border: `1px solid ${C.border}`,
                animation: "shimmer 1.5s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  height: 20,
                  width: "60%",
                  background: C.bg,
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 14,
                  width: "80%",
                  background: C.bg,
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "40%",
                  background: C.bg,
                  borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Services Grid */}
      {!loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
            gap: "clamp(12px, 3vw, 16px)",
          }}
        >
          {filtered.map((s, i) => (
            <div
              key={i}
              style={{
                background: C.white,
                borderRadius: "clamp(10px, 2.5vw, 14px)",
                padding: "clamp(14px, 4vw, 20px)",
                boxShadow:
                  hoveredCard === i
                    ? "0 8px 30px rgba(0,0,0,0.12)"
                    : "0 2px 10px rgba(0,0,0,0.06)",
                border: `1px solid ${hoveredCard === i ? C.primary : C.border}`,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                transform:
                  hoveredCard === i ? "translateY(-4px)" : "translateY(0)",
                animation: `fadeInUp ${0.2 + i * 0.05}s ease`,
              }}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                style={{
                  fontSize: "clamp(22px, 6vw, 28px)",
                  color: C.primary,
                  marginBottom: "clamp(8px, 2.5vw, 10px)",
                  transition: "transform 0.3s ease",
                  transform:
                    hoveredCard === i
                      ? "scale(1.2) rotate(10deg)"
                      : "scale(1) rotate(0deg)",
                }}
              >
                ◈
              </div>

              <div
                style={{
                  fontSize: "clamp(12px, 3.5vw, 14px)",
                  fontWeight: 700,
                  fontFamily: F.sans,
                  marginBottom: 4,
                  color: C.dark,
                  lineHeight: 1.3,
                }}
              >
                {s.displayName}
              </div>

              <div
                style={{
                  fontSize: "clamp(9px, 2.5vw, 10px)",
                  color: "#bbb",
                  fontFamily: F.sans,
                  marginBottom: 4,
                  wordBreak: "break-word",
                }}
              >
                {lang === "en" ? s.name : s.nameEn}
              </div>

              <div
                style={{
                  fontSize: "clamp(10px, 2.5vw, 11px)",
                  color: "#888",
                  fontFamily: F.sans,
                  marginBottom: "clamp(8px, 2.5vw, 12px)",
                }}
              >
                {s.displayDept}
              </div>

              <span
                style={{
                  background: s.active ? C.bg : "#ffeee8",
                  color: s.active ? C.primary : C.orange,
                  borderRadius: 12,
                  padding: "clamp(3px, 1.5vw, 5px) clamp(10px, 2.5vw, 14px)",
                  fontSize: "clamp(9px, 2.5vw, 10px)",
                  fontWeight: 700,
                  display: "inline-block",
                  transition: "all 0.3s ease",
                  transform: hoveredCard === i ? "scale(1.05)" : "scale(1)",
                }}
              >
                {s.active ? ts.active : ts.inactive}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "clamp(40px, 10vw, 60px) clamp(20px, 5vw, 40px)",
            color: "#999",
            fontFamily: F.sans,
            animation: "fadeInUp 0.4s ease",
          }}
        >
          <div
            style={{
              fontSize: "clamp(40px, 10vw, 56px)",
              marginBottom: "clamp(12px, 3vw, 16px)",
              opacity: 0.5,
            }}
          >
            ◎
          </div>
          <p style={{ fontSize: "clamp(14px, 3.5vw, 16px)" }}>{ts.noneFound}</p>
          <p
            style={{
              fontSize: "clamp(12px, 3vw, 13px)",
              color: "#bbb",
              marginTop: 8,
            }}
          >
            {t.common?.tryAdjusting || "Try adjusting your search or filter"}
          </p>
        </div>
      )}
    </div>
  );
}
