import { C, F } from "../../styles/theme";

export default function Section({ title, children, icon }) {
  return (
    <div
      style={{
        marginBottom: "clamp(20px, 5vw, 28px)",
        paddingBottom: "clamp(14px, 3vw, 20px)",
        borderBottom: "2px solid #f0f0f0",
        animation: "fadeInUp 0.4s ease",
      }}
    >
      <h3
        style={{
          fontSize: "clamp(14px, 4vw, 16px)",
          fontWeight: 800,
          color: C.primary,
          marginBottom: "clamp(12px, 3vw, 16px)",
          fontFamily: F.sans,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {icon && (
          <span style={{ fontSize: "clamp(18px, 4.5vw, 22px)" }}>{icon}</span>
        )}
        {title}
      </h3>
      {children}
    </div>
  );
}
