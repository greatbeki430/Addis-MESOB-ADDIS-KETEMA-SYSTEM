import { useState, useEffect, useMemo } from "react";
import { card, C, F, inp } from "../styles/theme";
import { SERVICES } from "../constants/services";
import { serviceAPI } from "../services/api";
import {
  FiSearch,
  FiGrid,
  FiTool,
  FiPackage,
  FiBox,
  FiCheck,
  FiX,
  FiSettings,
  FiStar,
  FiAward,
  FiBriefcase,
  FiUsers,
  FiUser,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight,
  // FiLoader,
} from "react-icons/fi";

export default function Services({ t, lang }) {
  const safeT = t || {};
  const ts = safeT.services || {};
  const safeCommon = safeT.common || {};

  const [search, setSearch] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await serviceAPI.getAll();

        let serviceData = [];

        if (response) {
          if (Array.isArray(response)) {
            serviceData = response;
          } else if (response.data && Array.isArray(response.data)) {
            serviceData = response.data;
          } else if (
            response.data &&
            response.data.data &&
            Array.isArray(response.data.data)
          ) {
            serviceData = response.data.data;
          } else if (response.services && Array.isArray(response.services)) {
            serviceData = response.services;
          } else if (
            response.data &&
            response.data.services &&
            Array.isArray(response.data.services)
          ) {
            serviceData = response.data.services;
          } else if (typeof response === "object") {
            for (const key in response) {
              if (Array.isArray(response[key]) && response[key].length > 0) {
                const firstItem = response[key][0];
                if (firstItem && (firstItem.name || firstItem.dept)) {
                  serviceData = response[key];
                  break;
                }
              }
            }
          }
        }

        if (serviceData.length > 0) {
          setServices(serviceData);
        } else {
          console.warn("⚠️ No services found in response, using fallback");
          setServices(SERVICES);
        }
      } catch (error) {
        console.error("❌ Failed to load services:", error);
        setError(error.message || "Failed to load services");
        setServices(SERVICES);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  // Map localized names
  const localizedServices = services.map((s) => ({
    ...s,
    displayName:
      lang === "en"
        ? s.nameEn || s.name || "Unnamed Service"
        : s.name || "Unnamed Service",
    displayDept:
      lang === "en"
        ? s.deptEn || s.dept || "Uncategorized"
        : s.dept || "Uncategorized",
  }));

  // ✅ Get unique departments
  const depts = [
    "All",
    ...new Set(localizedServices.map((s) => s.displayDept).filter(Boolean)),
  ];

  // ✅ Filter services using useMemo to avoid unnecessary recalculations
  const filtered = useMemo(() => {
    return localizedServices.filter((s) => {
      const matchesDept = filter === "All" || s.displayDept === filter;
      const matchesSearch =
        s.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
        s.displayDept?.toLowerCase().includes(search.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [localizedServices, filter, search]);

  // ✅ Pagination calculations
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  // ✅ Reset page when filter or search changes (in the handlers)
  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const getServiceIcon = (index) => {
    const icons = [
      <FiTool size={24} />,
      <FiPackage size={24} />,
      <FiBox size={24} />,
      <FiSettings size={24} />,
      <FiStar size={24} />,
      <FiAward size={24} />,
      <FiBriefcase size={24} />,
      <FiUsers size={24} />,
      <FiUser size={24} />,
      <FiClock size={24} />,
      <FiCalendar size={24} />,
      <FiMapPin size={24} />,
      <FiPhone size={24} />,
      <FiMail size={24} />,
      <FiGlobe size={24} />,
    ];
    return icons[index % icons.length];
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const gridElement = document.getElementById("services-grid");
      if (gridElement) {
        gridElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "clamp(16px, 4vw, 28px) clamp(12px, 4vw, 20px)",
        animation: "fadeInUp 0.5s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "clamp(8px, 3vw, 14px)",
          marginBottom: "clamp(12px, 3vw, 20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "clamp(28px, 7vw, 36px)" }}>
            <FiTool size={36} color={C.primary} />
          </span>
          <div>
            <h1
              style={{
                fontSize: "clamp(18px, 5vw, 24px)",
                fontWeight: 900,
                color: C.dark,
                fontFamily: F.serif,
                margin: 0,
                background: `linear-gradient(90deg, ${C.dark}, ${C.primary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {ts.title || "Addis Messob · Services"}
            </h1>
            <p
              style={{
                fontSize: "clamp(12px, 3vw, 13px)",
                color: C.muted,
                margin: "2px 0 0",
              }}
            >
              {ts.subtitle || "Digital One-Stop · Services"}
            </p>
          </div>
        </div>
        <span
          style={{
            background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
            color: "#fff",
            padding: "clamp(4px, 1.5vw, 6px) clamp(12px, 3vw, 18px)",
            borderRadius: 20,
            fontSize: "clamp(11px, 3vw, 13px)",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: `0 4px 15px ${C.primary}44`,
            animation: "pulseGlow 3s ease-in-out infinite",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FiGrid size={14} />
          {ts.catalogue || "Service Catalogue"} • {services.length}
        </span>
      </div>

      {/* Controls */}
      <div
        style={{
          ...card,
          marginBottom: "clamp(16px, 4vw, 20px)",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "clamp(8px, 2.5vw, 12px)",
          }}
        >
          <div style={{ flex: "2 1 200px", position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "clamp(12px, 3vw, 14px)",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "clamp(14px, 3.5vw, 16px)",
                color: C.muted,
                opacity: searchFocused ? 0.3 : 0.6,
                transition: "opacity 0.3s ease",
              }}
            >
              <FiSearch size={18} />
            </span>
            <input
              style={{
                ...inp,
                width: "100%",
                padding:
                  "clamp(10px, 2.5vw, 14px) clamp(10px, 3vw, 14px) clamp(10px, 2.5vw, 14px) clamp(40px, 8vw, 50px)",
                fontSize: "clamp(13px, 3.5vw, 14px)",
                borderColor: searchFocused ? C.primary : C.border,
                boxShadow: searchFocused ? `0 0 0 3px ${C.primary}22` : "none",
                transition: "all 0.3s ease",
              }}
              placeholder={ts.search || "Search services..."}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
          <select
            style={{
              ...inp,
              flex: "1 1 120px",
              cursor: "pointer",
              padding: "clamp(10px, 2.5vw, 14px) clamp(14px, 3vw, 18px)",
              fontSize: "clamp(13px, 3.5vw, 14px)",
              background: C.white,
              transition: "all 0.3s ease",
              borderColor: filter !== "All" ? C.primary : C.border,
            }}
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            {depts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && filtered.length > 0 && (
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
          <span style={{ fontSize: "clamp(12px, 3vw, 13px)", color: C.muted }}>
            Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of{" "}
            {totalItems} services
          </span>
          <span style={{ fontSize: "clamp(12px, 3vw, 13px)", color: C.muted }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Error State */}
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

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
            gap: "clamp(12px, 3vw, 16px)",
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                background: C.white,
                borderRadius: "clamp(8px, 2.5vw, 12px)",
                padding: "clamp(12px, 4vw, 18px)",
                border: `1px solid ${C.border}`,
                animation: "shimmer 1.5s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  height: 20,
                  width: "60%",
                  background: C.bg,
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 14,
                  width: "80%",
                  background: C.bg,
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "40%",
                  background: C.bg,
                  borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Services Grid */}
      {!loading && !error && (
        <div id="services-grid">
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
              gap: "clamp(12px, 3vw, 16px)",
            }}
          >
            {currentItems.length > 0 ? (
              currentItems.map((s, i) => (
                <div
                  key={s._id || i}
                  style={{
                    background: C.white,
                    borderRadius: "clamp(10px, 2.5vw, 14px)",
                    padding: "clamp(14px, 4vw, 20px)",
                    boxShadow:
                      hoveredCard === i
                        ? "0 8px 30px rgba(0,0,0,0.12)"
                        : "0 2px 10px rgba(0,0,0,0.06)",
                    border: `1px solid ${hoveredCard === i ? C.primary : C.border}`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    transform:
                      hoveredCard === i ? "translateY(-4px)" : "translateY(0)",
                    animation: `fadeInUp ${0.2 + i * 0.05}s ease`,
                  }}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    style={{
                      fontSize: "clamp(22px, 6vw, 28px)",
                      color: C.primary,
                      marginBottom: "clamp(8px, 2.5vw, 10px)",
                      transition: "transform 0.3s ease",
                      transform:
                        hoveredCard === i
                          ? "scale(1.2) rotate(10deg)"
                          : "scale(1) rotate(0deg)",
                    }}
                  >
                    {getServiceIcon(i)}
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(12px, 3.5vw, 14px)",
                      fontWeight: 700,
                      fontFamily: F.sans,
                      marginBottom: 4,
                      color: C.dark,
                      lineHeight: 1.3,
                    }}
                  >
                    {s.displayName || s.name || "Unnamed Service"}
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(9px, 2.5vw, 10px)",
                      color: "#bbb",
                      fontFamily: F.sans,
                      marginBottom: 4,
                      wordBreak: "break-word",
                    }}
                  >
                    {lang === "en" ? s.name || s.nameEn : s.nameEn || s.name}
                  </div>

                  <div
                    style={{
                      fontSize: "clamp(10px, 2.5vw, 11px)",
                      color: "#888",
                      fontFamily: F.sans,
                      marginBottom: "clamp(8px, 2.5vw, 12px)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FiBriefcase size={12} />
                    {s.displayDept || s.dept || "Uncategorized"}
                  </div>

                  <span
                    style={{
                      background: s.active ? C.bg : "#ffeee8",
                      color: s.active ? C.primary : C.orange,
                      borderRadius: 12,
                      padding:
                        "clamp(3px, 1.5vw, 5px) clamp(10px, 2.5vw, 14px)",
                      fontSize: "clamp(9px, 2.5vw, 10px)",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.3s ease",
                      transform: hoveredCard === i ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {s.active ? (
                      <>
                        <FiCheck size={10} />
                        {ts.active || "Active"}
                      </>
                    ) : (
                      <>
                        <FiX size={10} />
                        {ts.inactive || "Inactive"}
                      </>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "clamp(40px, 10vw, 60px) clamp(20px, 5vw, 40px)",
                  color: "#999",
                  fontFamily: F.sans,
                  animation: "fadeInUp 0.4s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(40px, 10vw, 56px)",
                    marginBottom: "clamp(12px, 3vw, 16px)",
                    opacity: 0.5,
                  }}
                >
                  <FiPackage
                    size={56}
                    color={C.muted}
                    style={{ display: "block", margin: "0 auto" }}
                  />
                </div>
                <p style={{ fontSize: "clamp(14px, 3.5vw, 16px)" }}>
                  {ts.noneFound || "No services found"}
                </p>
                <p
                  style={{
                    fontSize: "clamp(12px, 3vw, 13px)",
                    color: "#bbb",
                    marginTop: 8,
                  }}
                >
                  {safeCommon.tryAdjusting ||
                    "Try adjusting your search or filter"}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
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
                onClick={() => goToPage(currentPage - 1)}
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
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}44`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <FiChevronLeft size={16} />
                Previous
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
                        onClick={() => goToPage(page)}
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
                        onMouseEnter={(e) => {
                          if (currentPage !== page) {
                            e.currentTarget.style.background = "#e5e7eb";
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== page) {
                            e.currentTarget.style.background = "#f3f4f6";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        {page}
                      </button>
                    );
                  },
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
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
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${C.primary}44`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Next
                <FiChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Show total count at bottom */}
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
              {totalItems} {totalItems === 1 ? "service" : "services"} available
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 4px 15px ${C.primary}44; }
          50% { box-shadow: 0 4px 30px ${C.primary}88; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
