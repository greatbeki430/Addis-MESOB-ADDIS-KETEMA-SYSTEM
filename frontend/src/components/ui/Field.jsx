import { inp, F } from "../../styles/theme";

export default function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "clamp(4px, 1.5vw, 6px)",
      }}
    >
      <label
        style={{
          fontSize: "clamp(10px, 3vw, 11px)",
          fontWeight: 600,
          color: "#555",
          fontFamily: F.sans,
        }}
      >
        {label}
      </label>
      <input
        style={{
          ...inp,
          padding: "clamp(6px, 2vw, 9px) clamp(8px, 2.5vw, 12px)",
          fontSize: "clamp(11px, 3vw, 13px)",
        }}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
