// src/components/landing/DepartmentsMarquee.jsx
// Department scrolling marquee

const DepartmentsMarquee = ({ departments, loading, label }) => {
  return (
    <section
      style={{
        background: "#081d17",
        padding: "18px 0",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: "clamp(10px, 2vw, 10.5px)",
          fontWeight: 800,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "#f5c518",
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        className="lp-marquee-desktop"
        style={{
          display: "flex",
          overflow: "hidden",
          width: "100%",
          position: "relative",
        }}
      >
        <div
          className="lp-marquee-track"
          style={{
            display: "flex",
            gap: "clamp(24px, 4vw, 48px)",
            paddingRight: "clamp(24px, 4vw, 48px)",
            animation: "marquee-scroll 40s linear infinite",
            whiteSpace: "nowrap",
            flexShrink: 0,
            minWidth: "max-content",
          }}
        >
          {departments.length > 0
            ? [
                ...departments,
                ...departments,
                ...departments,
                ...departments,
              ].map((d, i) => (
                <span
                  key={i}
                  style={{
                    color: "#c9d0f0",
                    fontSize: "clamp(13px, 2vw, 16px)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                >
                  {d}
                </span>
              ))
            : [
                "Trade",
                "Ethiotelecom",
                "Labor & Skills",
                "Federal Document",
                "Traffic",
                "Digital Services",
              ].map((d, i) => (
                <span
                  key={i}
                  style={{
                    color: "#c9d0f0",
                    fontSize: "clamp(13px, 2vw, 16px)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    flexShrink: 0,
                    opacity: loading ? 0.6 : 0.4,
                  }}
                >
                  {loading ? "Loading..." : d}
                </span>
              ))}
        </div>
      </div>

      <div
        className="lp-marquee-mobile"
        style={{
          display: "none",
          flexDirection: "column",
          gap: "8px",
          overflow: "hidden",
          width: "100%",
          padding: "4px 0",
        }}
      >
        <div style={{ overflow: "hidden", width: "100%" }}>
          <div
            className="lp-marquee-row-1"
            style={{
              display: "flex",
              gap: "clamp(16px, 3vw, 24px)",
              animation: "marquee-scroll-right 25s linear infinite",
              whiteSpace: "nowrap",
              width: "max-content",
            }}
          >
            {departments.length > 0
              ? [...departments, ...departments, ...departments].map((d, i) => (
                  <span
                    key={i}
                    style={{
                      color: "#c9d0f0",
                      fontSize: "clamp(11px, 2.5vw, 13px)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      display: "inline-block",
                      flexShrink: 0,
                      padding: "4px 8px",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {d}
                  </span>
                ))
              : [
                  "Trade",
                  "Ethiotelecom",
                  "Labor & Skills",
                  "Federal Document",
                ].map((d, i) => (
                  <span
                    key={i}
                    style={{
                      color: "#c9d0f0",
                      fontSize: "clamp(11px, 2.5vw, 13px)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      display: "inline-block",
                      flexShrink: 0,
                      padding: "4px 8px",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      opacity: loading ? 0.6 : 0.4,
                    }}
                  >
                    {loading ? "Loading..." : d}
                  </span>
                ))}
          </div>
        </div>

        <div style={{ overflow: "hidden", width: "100%" }}>
          <div
            className="lp-marquee-row-2"
            style={{
              display: "flex",
              gap: "clamp(16px, 3vw, 24px)",
              animation: "marquee-scroll-left 25s linear infinite",
              whiteSpace: "nowrap",
              width: "max-content",
            }}
          >
            {departments.length > 0
              ? [...departments, ...departments, ...departments]
                  .reverse()
                  .map((d, i) => (
                    <span
                      key={i}
                      style={{
                        color: "#c9d0f0",
                        fontSize: "clamp(11px, 2.5vw, 13px)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        display: "inline-block",
                        flexShrink: 0,
                        padding: "4px 8px",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "20px",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {d}
                    </span>
                  ))
              : ["Traffic", "Digital Services", "Ethiotelecom", "Trade"]
                  .reverse()
                  .map((d, i) => (
                    <span
                      key={i}
                      style={{
                        color: "#c9d0f0",
                        fontSize: "clamp(11px, 2.5vw, 13px)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        display: "inline-block",
                        flexShrink: 0,
                        padding: "4px 8px",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "20px",
                        border: "1px solid rgba(255,255,255,0.06)",
                        opacity: loading ? 0.6 : 0.4,
                      }}
                    >
                      {loading ? "Loading..." : d}
                    </span>
                  ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marquee-scroll-right {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-scroll-left {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .lp-marquee-desktop { display: none !important; }
          .lp-marquee-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .lp-marquee-desktop { display: flex !important; }
          .lp-marquee-mobile { display: none !important; }
        }
        @media (max-width: 480px) {
          .lp-marquee-row-1 { animation-duration: 20s !important; gap: 12px !important; }
          .lp-marquee-row-2 { animation-duration: 20s !important; gap: 12px !important; }
          .lp-marquee-mobile span { font-size: 10px !important; padding: 3px 6px !important; }
        }
        @media (max-width: 360px) {
          .lp-marquee-row-1 { animation-duration: 16s !important; gap: 10px !important; }
          .lp-marquee-row-2 { animation-duration: 16s !important; gap: 10px !important; }
          .lp-marquee-mobile span { font-size: 9px !important; padding: 2px 5px !important; }
        }
        .lp-marquee-row-1:hover,
        .lp-marquee-row-2:hover {
          animation-play-state: paused;
        }
        .lp-marquee-track:hover { animation-play-state: paused; }
      `}</style>
    </section>
  );
};

export default DepartmentsMarquee;
