// src/components/golden-monday/PresenterStatusBadge.jsx
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import { C } from "../../styles/theme";

export default function PresenterStatusBadge({ session }) {
  if (!session) return null;

  const { presenterStatus, presenterConfirmed, presenterDeclineReason } =
    session;

  if (presenterStatus === "confirmed" && presenterConfirmed) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 12px",
          borderRadius: 999,
          background: "#d1fae5",
          color: "#065f46",
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <FiCheckCircle size={12} color="#10b981" />
        Confirmed
      </span>
    );
  }

  if (presenterStatus === "declined") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 12px",
          borderRadius: 999,
          background: "#fee2e2",
          color: "#991b1b",
          fontSize: 10,
          fontWeight: 600,
          title: presenterDeclineReason || "No reason provided",
        }}
      >
        <FiXCircle size={12} color="#ef4444" />
        Declined
        {presenterDeclineReason && (
          <span style={{ fontSize: 8, opacity: 0.7 }}>ⓘ</span>
        )}
      </span>
    );
  }

  if (
    session.availabilityResponseDeadline &&
    new Date(session.availabilityResponseDeadline) < new Date()
  ) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 12px",
          borderRadius: 999,
          background: "#fef3c7",
          color: "#92400e",
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <FiAlertCircle size={12} color="#f59e0b" />
        No Response
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 12px",
        borderRadius: 999,
        background: "#eff6ff",
        color: "#1e40af",
        fontSize: 10,
        fontWeight: 600,
      }}
    >
      <FiClock size={12} color={C.primary} />
      Awaiting Response
    </span>
  );
}
