import { C, F } from "../../styles/theme";

export default function StatCard({ label, value, icon, color }) {
  return (
    <div
      style={{
        background: C.white,
        padding: "18px 14px",
        borderRadius: 12,
        textAlign: "center",
        boxShadow: "0 2px 12px #0002",
        borderTop: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 6, color }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: C.dark }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.muted, fontFamily: F.sans }}>
        {label}
      </div>
    </div>
  );
}
