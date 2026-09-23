// frontend/src/pages/admin/ForumReportManagement.jsx
import { useState } from "react";
import { FiMessageSquare, FiAward } from "react-icons/fi";
import AdminDataManagement from "./AdminDataManagement";
import Leaderboard from "../Leaderboard";
import { C, F, FONT_SIZES, radius } from "../../styles/theme";

const ForumReportManagement = () => {
  const [tab, setTab] = useState("data");

  return (
    <div style={{ padding: 8 }}>
      <div
        style={{
          display: "flex",
          gap: 4,
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          borderRadius: radius.lg,
          padding: 4,
          marginBottom: 12,
          maxWidth: 480,
          fontFamily: F.sans,
        }}
      >
        {[
          { key: "data", label: "Data", icon: <FiMessageSquare size={14} /> },
          { key: "rankings", label: "Rankings", icon: <FiAward size={14} /> },
        ].map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: radius.md,
                border: "none",
                background: active ? "#fff" : "transparent",
                color: active ? C.dark : C.muted,
                fontWeight: active ? 700 : 500,
                fontSize: FONT_SIZES.small,
                cursor: "pointer",
                boxShadow: active ? "0 1px 4px rgba(13,26,94,0.08)" : "none",
              }}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {tab === "data" ? (
        <AdminDataManagement dataType="forum-reports" />
      ) : (
        <Leaderboard />
      )}
    </div>
  );
};

export default ForumReportManagement;
