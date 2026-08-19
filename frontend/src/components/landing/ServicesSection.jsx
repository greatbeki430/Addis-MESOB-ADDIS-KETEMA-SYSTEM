// src/components/landing/ServicesSection.jsx
// Services catalog with search, filter, and pagination

import { forwardRef } from "react";
import { C, F } from "../../styles/theme";
import {
  FiSearch,
  FiPackage,
  FiLoader,
  FiCheck,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
} from "react-icons/fi";

const ServicesSection = forwardRef(
  (
    {
      t,
      services,
      loading,
      error,
      departments,
      searchTerm,
      onSearchChange,
      filterDept,
      onFilterChange,
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      startIndex,
      endIndex,
      onPageChange,
      copy,
      getServiceIcon,
      language,
      ...props
    },
    ref,
  ) => {
    const SectionHeading = ({ eyebrow, title, sub, center }) => (
      <div style={{ textAlign: center ? "center" : "left" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: C.primary,
            marginBottom: 12,
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: F.serif,
            fontSize: "clamp(24px, 4vw, 34px)",
            fontWeight: 800,
            letterSpacing: "-0.01em",
            margin: 0,
            color: C.dark,
          }}
        >
          {title}
        </h2>
        {sub && (
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              lineHeight: 1.65,
              color: C.muted,
              maxWidth: 580,
              margin: center ? "12px auto 0" : "12px 0 0",
            }}
          >
            {sub}
          </p>
        )}
      </div>
    );

    return (
      <section
        ref={ref}
        {...props}
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "clamp(56px, 8vw, 84px) clamp(20px, 6vw, 40px) 12px",
          ...props.style,
        }}
      >
        <SectionHeading
          eyebrow={
            <>
              <FiGrid size={14} style={{ marginRight: 4 }} />
              {t("landing.servicesAvailable") || "Available Services"}
            </>
          }
          title={t("landing.servicesTitle") || "Browse our service catalogue"}
          sub={
            t("landing.servicesSub") ||
            "Explore all available services. Login to access full features and management."
          }
          center
        />

        <div
          id="lp-search-filter"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: 12,
            marginTop: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: C.muted,
              }}
            >
              <FiSearch size={18} />
            </span>
            <input
              type="text"
              placeholder={copy.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px 10px 42px",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 14,
                background: C.white,
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 14px",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 14,
              background: C.white,
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {!loading && !error && services.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span
              style={{ fontSize: "clamp(12px, 3vw, 13px)", color: C.muted }}
            >
              {copy.showing} {startIndex + 1}–{endIndex} {copy.of} {totalItems}{" "}
              {copy.services}
            </span>
            <span
              style={{ fontSize: "clamp(12px, 3vw, 13px)", color: C.muted }}
            >
              {copy.page} {currentPage} {copy.of} {totalPages}
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: 8,
              marginBottom: 16,
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚠️</span>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
            <FiLoader
              size={32}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p>{copy.loading}</p>
          </div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
            <FiPackage size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p>{copy.noServices}</p>
          </div>
        ) : (
          <>
            <div
              id="services-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
                gap: 16,
              }}
            >
              {services.map((s, i) => (
                <div
                  key={s._id || i}
                  style={{
                    background: C.white,
                    borderRadius: 12,
                    padding: "16px 18px",
                    border: `1px solid ${C.border}`,
                    transition: "all 0.3s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(0,0,0,0.1)";
                    e.currentTarget.style.borderColor = C.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  <div
                    style={{ fontSize: 28, color: C.primary, marginBottom: 8 }}
                  >
                    {getServiceIcon(i)}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: C.dark,
                      marginBottom: 2,
                    }}
                  >
                    {language === "en" ? s.nameEn || s.name : s.name}
                  </div>
                  {s.nameEn && language === "en" && (
                    <div
                      style={{ fontSize: 11, color: "#bbb", marginBottom: 4 }}
                    >
                      {s.name}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: "#888",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 8,
                    }}
                  >
                    <FiBriefcase size={12} />
                    {language === "en" ? s.deptEn || s.dept : s.dept}
                  </div>
                  <span
                    style={{
                      background: s.active ? C.bg : "#ffeee8",
                      color: s.active ? C.primary : C.orange,
                      borderRadius: 12,
                      padding: "2px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {s.active ? (
                      <>
                        <FiCheck size={10} /> {copy.active}
                      </>
                    ) : (
                      copy.inactive
                    )}
                  </span>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "clamp(6px, 2vw, 12px)",
                  marginTop: "clamp(20px, 4vw, 32px)",
                  padding: "16px 0",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    background: currentPage === 1 ? "#e5e7eb" : C.primary,
                    color: currentPage === 1 ? "#999" : "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: "clamp(12px, 3vw, 14px)",
                    fontWeight: 600,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: currentPage === 1 ? 0.6 : 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  <FiChevronLeft size={16} />
                  {copy.previous}
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: "clamp(4px, 1.5vw, 8px)",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2;

                      if (!showPage) {
                        if (page === 2 || page === totalPages - 1) {
                          return (
                            <span
                              key={page}
                              style={{
                                padding: "8px 6px",
                                color: "#999",
                                fontSize: "clamp(12px, 3vw, 14px)",
                              }}
                            >
                              …
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => onPageChange(page)}
                          style={{
                            background:
                              currentPage === page ? C.primary : "#f3f4f6",
                            color: currentPage === page ? "#fff" : "#555",
                            border:
                              currentPage === page
                                ? `2px solid ${C.primary}`
                                : "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "8px 14px",
                            minWidth: "40px",
                            fontSize: "clamp(12px, 3vw, 14px)",
                            fontWeight: currentPage === page ? 700 : 500,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                        >
                          {page}
                        </button>
                      );
                    },
                  )}
                </div>

                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    background:
                      currentPage === totalPages ? "#e5e7eb" : C.primary,
                    color: currentPage === totalPages ? "#999" : "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: "clamp(12px, 3vw, 14px)",
                    fontWeight: 600,
                    cursor:
                      currentPage === totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: currentPage === totalPages ? 0.6 : 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  {copy.next}
                  <FiChevronRight size={16} />
                </button>
              </div>
            )}

            {totalItems > 0 && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "clamp(8px, 2vw, 12px)",
                  fontSize: "clamp(11px, 2.5vw, 12px)",
                  color: C.muted,
                  padding: "8px 0",
                }}
              >
                {totalItems} {totalItems === 1 ? copy.service : copy.services}{" "}
                {copy.available}
              </div>
            )}
          </>
        )}

        <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          #lp-search-filter { grid-template-columns: 1fr !important; }
        }
      `}</style>
      </section>
    );
  },
);

export default ServicesSection;
