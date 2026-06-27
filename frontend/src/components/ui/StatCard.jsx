import { useState } from "react";
import { C, F } from "../../styles/theme";

export default function StatCard({
  label,
  value,
  icon,
  color,
  loading = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: C.white,
        padding: "18px 14px",
        borderRadius: 12,
        textAlign: "center",
        borderTop: `4px solid ${color}`,
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHovered
          ? "0 6px 24px rgba(0,0,0,0.12)"
          : "0 2px 12px rgba(0,0,0,0.08)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          fontSize: 22,
          marginBottom: 6,
          color,
          transition: "transform 0.3s ease",
          transform: isHovered
            ? "scale(1.2) rotate(5deg)"
            : "scale(1) rotate(0deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      {loading ? (
        <div
          style={{
            height: 32,
            width: "60%",
            margin: "0 auto",
            background: `linear-gradient(90deg, ${C.bg}, ${C.border}, ${C.bg})`,
            backgroundSize: "200% 100%",
            borderRadius: 4,
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      ) : (
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: C.dark,
            transition: "all 0.3s ease",
          }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      )}
      <div
        style={{
          fontSize: 12,
          color: C.muted,
          fontFamily: F.sans,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
