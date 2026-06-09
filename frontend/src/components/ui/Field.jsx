// function Field({ label, value, onChange, type = "text", placeholder }) {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
//       <label
//         style={{
//           fontSize: 11,
//           fontWeight: 600,
//           color: "#555",
//           fontFamily: F.sans,
//         }}
//       >
//         {label}
//       </label>
//       <input
//         style={inp}
//         type={type}
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={placeholder}
//       />
//     </div>
//   );
// }

import { inp, F } from "../../styles/theme";

export default function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#555",
          fontFamily: F.sans,
        }}
      >
        {label}
      </label>
      <input
        style={inp}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
