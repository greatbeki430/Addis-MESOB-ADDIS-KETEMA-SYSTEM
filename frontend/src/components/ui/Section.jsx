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

import { C, F } from "../../styles/theme";

export default function Section({ title, children }) {
  return (
    <div
      style={{
        marginBottom: 24,
        paddingBottom: 18,
        borderBottom: "1px solid #eee",
      }}
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: C.primary,
          marginBottom: 12,
          fontFamily: F.sans,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}
