// src/components/landing/SiteFooter.jsx
// Site footer

import mesobLogo from "../../assets/mesoblogo.png";
import { FiMail } from "react-icons/fi";

const SiteFooter = ({ tagline, privacyLabel, termsLabel, contactLabel }) => {
  return (
    <footer
      style={{
        background: "#04081f",
        color: "#8892c0",
        padding: "40px clamp(20px, 6vw, 40px) 28px",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 24,
          paddingBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={mesobLogo}
              alt="Addis MESOB"
              style={{ width: 28, height: 28, borderRadius: 6 }}
            />
            <span
              style={{
                fontFamily: "'Noto Serif Ethiopic', serif",
                fontWeight: 800,
                color: "#fff",
                fontSize: 15,
              }}
            >
              Addis MESOB
            </span>
          </div>
          <p style={{ fontSize: 12.5, margin: "12px 0 0" }}>{tagline}</p>
        </div>
        <nav
          aria-label="Footer"
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            fontSize: 12.5,
          }}
        >
          <a
            href="/privacy"
            style={{ color: "#8892c0", textDecoration: "none" }}
          >
            {privacyLabel}
          </a>
          <a href="/terms" style={{ color: "#8892c0", textDecoration: "none" }}>
            {termsLabel}
          </a>
          <a
            href="mailto:support@addismesob.example"
            style={{
              color: "#8892c0",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <FiMail size={12} />
            {contactLabel}
          </a>
        </nav>
      </div>
      <p style={{ fontSize: 11, margin: "18px 0 0", textAlign: "center" }}>
        © {new Date().getFullYear()} Digital Ethiopia · Addis MESOB
      </p>
    </footer>
  );
};

export default SiteFooter;
