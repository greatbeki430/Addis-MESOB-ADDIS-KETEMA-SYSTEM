// function Section({ title, children }) {
//   return (
//     <div
//       style={{
//         marginBottom: 24,
//         paddingBottom: 18,
//         borderBottom: "1px solid #eee",
//       }}
//     >
//       <h3
//         style={{
//           fontSize: 14,
//           fontWeight: 800,
//           color: C.primary,
//           marginBottom: 12,
//           fontFamily: F.sans,
//         }}
//       >
//         {title}
//       </h3>
//       {children}
//     </div>
//   );
// }

// import { C, F } from "../../styles/theme";

// export default function Section({ title, children }) {
//   return (
//     <div
//       style={{
//         marginBottom: 24,
//         paddingBottom: 18,
//         borderBottom: "1px solid #eee",
//       }}
//     >
//       <h3
//         style={{
//           fontSize: 14,
//           fontWeight: 800,
//           color: C.primary,
//           marginBottom: 12,
//           fontFamily: F.sans,
//         }}
//       >
//         {title}
//       </h3>
//       {children}
//     </div>
//   );
// }

import { C, F } from "../../styles/theme";

export default function Section({ title, children }) {
  return (
    <div
      style={{
        marginBottom: "clamp(16px, 5vw, 24px)",
        paddingBottom: "clamp(12px, 3vw, 18px)",
        borderBottom: "1px solid #eee",
      }}
    >
      <h3
        style={{
          fontSize: "clamp(13px, 4vw, 15px)",
          fontWeight: 800,
          color: C.primary,
          marginBottom: "clamp(10px, 3vw, 14px)",
          fontFamily: F.sans,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
