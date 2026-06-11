// ════════════════════════════════════════════════════════════
// pages/Services.jsx (Complete File)
// ════════════════════════════════════════════════════════════
import { useState } from "react";
import { card, C, F, inp } from "../styles/theme";
import { SERVICES } from "../constants/services";

export default function Services({ t, lang }) {
  const ts = t.services;
  const [search, setSearch] = useState("");

  // 1. Map localized rendering target strings dynamically
  const localizedServices = SERVICES.map((s) => ({
    ...s,
    displayName: lang === "en" ? s.nameEn : s.name,
    displayDept: lang === "en" ? s.deptEn : s.dept,
  }));

  // Resolve localized selection defaults
  const [filter, setFilter] = useState(ts.all);

  // Collect contextual unique departments based on active selection choice
  const depts = [
    ts.all,
    ...new Set(localizedServices.map((s) => s.displayDept)),
  ];

  // 2. Filter list matching dynamic content targets
  const filtered = localizedServices.filter(
    (s) =>
      (filter === ts.all || s.displayDept === filter) &&
      (s.displayName.toLowerCase().includes(search.toLowerCase()) ||
        s.displayDept.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.nameEn.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
      }}
    >
      {/* Header Grid */}
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
        <h1
          style={{
            fontSize: "clamp(16px, 5vw, 22px)",
            fontWeight: 900,
            color: C.dark,
            fontFamily: F.serif,
            margin: 0,
          }}
        >
          {ts.title}
        </h1>
        <span
          style={{
            background: C.primary,
            color: "#fff",
            padding: "clamp(2px, 1.5vw, 4px) clamp(8px, 3vw, 12px)",
            borderRadius: 20,
            fontSize: "clamp(10px, 3vw, 11px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {ts.catalogue}
        </span>
      </div>

      {/* Subtitle Metadata */}
      <p
        style={{
          color: "#555",
          marginBottom: "clamp(16px, 4vw, 22px)",
          fontSize: "clamp(12px, 3.5vw, 13px)",
          fontFamily: F.sans,
        }}
      >
        {ts.subtitle} · {SERVICES.length}
      </p>

      {/* Controls Container Card */}
      <div style={{ ...card, marginBottom: "clamp(16px, 4vw, 20px)" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "clamp(8px, 2.5vw, 12px)",
          }}
        >
          <input
            style={{
              ...inp,
              flex: "2 1 200px",
              padding: "clamp(8px, 2.5vw, 12px) clamp(10px, 3vw, 14px)",
              fontSize: "clamp(12px, 3.5vw, 14px)",
            }}
            placeholder={ts.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={{
              ...inp,
              width: "auto",
              flex: "1 1 120px",
              cursor: "pointer",
              padding: "clamp(8px, 2.5vw, 12px) clamp(10px, 3vw, 14px)",
              fontSize: "clamp(12px, 3.5vw, 14px)",
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

      {/* Services Grid Layout */}
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
              borderRadius: "clamp(8px, 2.5vw, 12px)",
              padding: "clamp(12px, 4vw, 18px)",
              boxShadow: "0 2px 10px #0002",
              border: "1px solid #e4ede8",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 10px #0002";
            }}
          >
            <div
              style={{
                fontSize: "clamp(18px, 5vw, 22px)",
                color: C.primary,
                marginBottom: "clamp(8px, 2.5vw, 10px)",
              }}
            >
              ◈
            </div>

            {/* Display main name matching chosen UI Language */}
            <div
              style={{
                fontSize: "clamp(11px, 3.5vw, 13px)",
                fontWeight: 700,
                fontFamily: F.sans,
                marginBottom: 4,
                color: "#1a1a1a",
                lineHeight: 1.3,
              }}
            >
              {s.displayName}
            </div>

            {/* Substring showing alternative language label hint */}
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

            {/* Display Sector/Department Name matched dynamically */}
            <div
              style={{
                fontSize: "clamp(10px, 2.5vw, 11px)",
                color: "#888",
                fontFamily: F.sans,
                marginBottom: "clamp(8px, 2.5vw, 10px)",
              }}
            >
              {s.displayDept}
            </div>

            {/* Badge Indicator Elements */}
            <span
              style={{
                background: s.active ? C.bg : "#ffeee8",
                color: s.active ? C.primary : C.orange,
                borderRadius: 9,
                padding: "clamp(3px, 1.5vw, 5px) clamp(8px, 2.5vw, 12px)",
                fontSize: "clamp(9px, 2.5vw, 10px)",
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              {s.active ? ts.active : ts.inactive}
            </span>
          </div>
        ))}
      </div>

      {/* Fallback View state */}
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "clamp(40px, 10vw, 60px) clamp(20px, 5vw, 40px)",
            color: "#999",
            fontFamily: F.sans,
          }}
        >
          <div
            style={{
              fontSize: "clamp(36px, 10vw, 48px)",
              marginBottom: "clamp(10px, 3vw, 16px)",
            }}
          >
            ◎
          </div>
          <p style={{ fontSize: "clamp(12px, 3.5vw, 14px)" }}>{ts.noneFound}</p>
        </div>
      )}
    </div>
  );
}
