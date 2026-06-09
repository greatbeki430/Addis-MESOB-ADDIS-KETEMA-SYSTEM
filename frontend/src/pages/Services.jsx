// ════════════════════════════════════════════════════════════
// pages/Services
// ════════════════════════════════════════════════════════════

import { useState } from "react";
import { card, C, F, inp } from "../styles/theme";
import { SERVICES } from "../constants/services";
export default function Services({ t }) {
  const ts = t.services;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(ts.all);
  const depts = [ts.all, ...new Set(SERVICES.map((s) => s.dept))];
  const filtered = SERVICES.filter(
    (s) =>
      (filter === ts.all || s.dept === filter) &&
      (s.name.includes(search) ||
        s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        s.dept.includes(search)),
  );
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 6,
        }}
      >
        <h1
          style={{
            fontSize: 24,
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
            padding: "3px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {ts.catalogue}
        </span>
      </div>
      <p
        style={{
          color: "#555",
          marginBottom: 22,
          fontSize: 13,
          fontFamily: F.sans,
        }}
      >
        {ts.subtitle} · {SERVICES.length}
      </p>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            style={{ ...inp, flex: 1 }}
            placeholder={ts.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            style={{ ...inp, width: "auto", cursor: "pointer" }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {depts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))",
          gap: 14,
        }}
      >
        {filtered.map((s, i) => (
          <div
            key={i}
            style={{
              background: C.white,
              borderRadius: 10,
              padding: 16,
              boxShadow: "0 2px 10px #0002",
              border: "1px solid #e4ede8",
            }}
          >
            <div style={{ fontSize: 20, color: C.primary, marginBottom: 6 }}>
              ◈
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: F.sans,
                marginBottom: 2,
                color: "#1a1a1a",
              }}
            >
              {s.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#bbb",
                fontFamily: F.sans,
                marginBottom: 3,
              }}
            >
              {s.nameEn}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#888",
                fontFamily: F.sans,
                marginBottom: 8,
              }}
            >
              {s.dept}
            </div>
            <span
              style={
                s.active
                  ? {
                      background: C.bg,
                      color: C.primary,
                      borderRadius: 9,
                      padding: "2px 9px",
                      fontSize: 10,
                      fontWeight: 700,
                    }
                  : {
                      background: "#ffeee8",
                      color: C.orange,
                      borderRadius: 9,
                      padding: "2px 9px",
                      fontSize: 10,
                      fontWeight: 700,
                    }
              }
            >
              {s.active ? ts.active : ts.inactive}
            </span>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "#999",
            fontFamily: F.sans,
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 10 }}>◎</div>
          <p>{ts.noneFound}</p>
        </div>
      )}
    </div>
  );
}
