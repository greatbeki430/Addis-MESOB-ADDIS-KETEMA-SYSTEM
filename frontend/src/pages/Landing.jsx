// src/pages/Landing.jsx
// ════════════════════════════════════════════════════════════
// Public system-wide landing page for Addis MESOB.
// Shown to unauthenticated visitors at "/". Introduces the whole
// platform (not a single feature) and funnels into /login.
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../styles/theme";
import { useLanguage } from "../hooks/useLanguage";
import { LANGUAGES } from "../constants/translations/index";
import { publicAPI } from "../services/api";
import mesobLogo from "../assets/mesoblogo.png";

// Import modular components
import HeroSection from "../components/landing/HeroSection";
import DepartmentsMarquee from "../components/landing/DepartmentsMarquee";
import FeaturesGrid from "../components/landing/FeaturesGrid";
import ServicesSection from "../components/landing/ServicesSection";
import HowItWorks from "../components/landing/HowItWorks";
import GoldenMondayTeaser from "../components/landing/GoldenMondayTeaser";
import FAQSection from "../components/landing/FAQSection";
import SiteFooter from "../components/landing/SiteFooter";
import VisionMission from "../components/landing/VisionMission";

import {
  FiMenu,
  FiX,
  FiArrowUp,
  FiGrid,
  FiBarChart2,
  FiFileText,
  FiUsers,
  FiShield,
  FiCpu,
} from "react-icons/fi";

// ─────────────────────────────────────────────────────────────
// MAIN LANDING COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Landing() {
  const { language, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [visible, setVisible] = useState({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [departments, setDepartments] = useState(["All"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);

  const sectionRefs = useRef({});
  const abortControllerRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const isInitialMount = useRef(true);

  // ─── Check if mobile ──────────────────────────────────────
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ─── Load services from database ──────────────────────────
  const loadServices = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await publicAPI.getServices({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        department: filterDept !== "All" ? filterDept : undefined,
      });

      if (response.data.success) {
        setServices(response.data.data);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      if (error.name !== "AbortError" && error.code !== "ERR_CANCELED") {
        console.error("Failed to load services:", error);
        setError(
          t("landing.servicesLoadError") ||
            "Failed to load services. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, filterDept, t]);

  // ─── Load departments ──────────────────────────────────────
  const loadDepartments = useCallback(async () => {
    try {
      const response = await publicAPI.getDepartments();
      if (response.data.success) {
        setDepartments(["All", ...response.data.data]);
      }
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  }, []);

  // ─── Initial load ──────────────────────────────────────────
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadInitialData = async () => {
      await loadDepartments();
      await loadServices();
    };

    loadInitialData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handle page, search, and filter changes ──────────────
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      loadServices();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, filterDept, loadServices]);

  // ─── Departments list for marquee ──────────────────────────
  const departmentsList = useMemo(() => {
    const seen = new Set();
    const list = [];
    (services || []).forEach((s) => {
      const dept = s.dept || s.deptEn;
      if (dept && !seen.has(dept)) {
        seen.add(dept);
        list.push(dept);
      }
    });
    return list;
  }, [services]);

  // ─── Get service icon ──────────────────────────────────────
  const getServiceIcon = (index) => {
    const icons = [
      <FiGrid size={isMobile ? 20 : 24} />,
      <FiBarChart2 size={isMobile ? 20 : 24} />,
      <FiFileText size={isMobile ? 20 : 24} />,
      <FiUsers size={isMobile ? 20 : 24} />,
      <FiShield size={isMobile ? 20 : 24} />,
      <FiCpu size={isMobile ? 20 : 24} />,
    ];
    return icons[index % icons.length];
  };

  // ─── Register refs ──────────────────────────────────────────
  const registerRef = useCallback(
    (key) => (el) => {
      if (el) sectionRefs.current[key] = el;
    },
    [],
  );

  // ─── Scroll observer ────────────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = entry.target.dataset.reveal;
          if (entry.isIntersecting) {
            setVisible((v) => ({ ...v, [key]: true }));
            if (key === "features" || key === "how") {
              setActiveSection(key);
            }
          }
        });
      },
      { threshold: 0.12, rootMargin: "-72px 0px -60% 0px" },
    );
    const currentRefs = { ...sectionRefs.current };
    const elements = Object.values(currentRefs).filter(Boolean);
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  // ─── Back-to-top ────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 640);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Mobile nav close ──────────────────────────────────────
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  const revealStyle = (key) => ({
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  });

  const goLogin = () => navigate("/login");
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // ─── Pagination handlers ──────────────────────────────────
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const gridElement = document.getElementById("services-grid");
      if (gridElement) {
        gridElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // ─── Define landing copy using t() ────────────────────────
  const LANDING_COPY = {
    eyebrow: t("landing.eyebrow") || "Digital Ethiopia · Addis MESOB Platform",
    heroTitle: t("landing.heroTitle") || "Every service, in one basket.",
    heroBody:
      t("landing.heroBody") ||
      "For generations, a mesob has meant many dishes served from one vessel. Addis MESOB carries that same idea into government service — registration, evaluation, reporting, documents, and AI assistance, gathered into one digital basket for staff and citizens alike.",
    ctaPrimary: t("landing.ctaPrimary") || "Sign in to your account",
    ctaSecondary: t("landing.ctaSecondary") || "See what's inside",
    statServices: t("landing.statServices") || "Services",
    statAgencies: t("landing.statAgencies") || "Agencies",
    statLanguages: t("landing.statLanguages") || "Languages",
    statAI: t("landing.statAI") || "AI-assisted",
    deptsEyebrow: t("landing.deptsEyebrow") || "One login, every department",
    featuresEyebrow: t("landing.featuresEyebrow") || "What's inside the basket",
    featuresTitle:
      t("landing.featuresTitle") ||
      "Everything your organization needs, in one place",
    featuresSub:
      t("landing.featuresSub") ||
      "Access adapts automatically to your role — employee, team leader, admin, or super admin.",
    howEyebrow: t("landing.howEyebrow") || "How it works",
    howTitle: t("landing.howTitle") || "Three steps from login to done",
    gmEyebrow: t("landing.gmEyebrow") || "The philosophy behind it",
    gmTitle: t("landing.gmTitle") || "Built on the Golden Monday mindset",
    gmBody:
      t("landing.gmBody") ||
      "Ethiopia's weekly Golden Monday (ወርቃማ ሰኞ) sessions push every employee toward multiskilling and peer-led learning. Addis MESOB carries that same drive for less friction into how citizens actually get things done — and the program itself now lives inside the platform for every signed-in team.",
    gmCta: t("landing.gmCta") || "Sign in to view this week's session",
    faqEyebrow: t("landing.faqEyebrow") || "Questions",
    faqTitle: t("landing.faqTitle") || "Frequently asked questions",
    footerTagline:
      t("landing.footerTagline") ||
      "A one-stop digital service platform for Digital Ethiopia.",
    footerPrivacy: t("landing.footerPrivacy") || "Privacy Policy",
    footerTerms: t("landing.footerTerms") || "Terms of Service",
    footerContact: t("landing.footerContact") || "Contact Us",
    skipToContent: t("landing.skipToContent") || "Skip to content",
    backToTop: t("landing.backToTop") || "Back to top",
  };

  return (
    <div
      style={{
        fontFamily: F.sans,
        background: "#fbfaf6",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700;800&family=Noto+Serif+Ethiopic:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; }

        @keyframes lp-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lp-skip-link {
          position: absolute;
          top: -48px;
          left: 12px;
          background: ${C.gold};
          color: ${C.dark};
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          text-decoration: none;
          z-index: 100;
          transition: top 0.2s ease;
        }
        .lp-skip-link:focus { top: 12px; }

        .lp-desktop-only { display: flex; }
        .lp-mobile-toggle { display: none; }

        @media (max-width: 768px) {
          .lp-desktop-only { display: none !important; }
          .lp-mobile-toggle { display: inline-flex !important; }
        }

        @media (max-width: 480px) {
          .lp-skip-link {
            font-size: 11px;
            padding: 8px 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
        }

        .lp-nav-link { transition: opacity 0.15s ease, color 0.15s ease; position: relative; }
        .lp-nav-link:hover { opacity: 0.72; }
        .lp-nav-link.active { color: ${C.gold} !important; }
        .lp-nav-link.active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -6px;
          height: 2px;
          background: ${C.gold};
          border-radius: 2px;
        }
        .lp-lang-btn { transition: opacity 0.15s ease, transform 0.15s ease; }
        .lp-lang-btn:hover { opacity: 0.85; }

        .lp-back-to-top { transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease; }
        .lp-back-to-top:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(6,11,46,0.35); }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .lp-back-to-top {
            bottom: 16px !important;
            right: 16px !important;
            width: 40px !important;
            height: 40px !important;
          }
          .lp-back-to-top svg {
            width: 16px !important;
            height: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .lp-back-to-top {
            bottom: 12px !important;
            right: 12px !important;
            width: 36px !important;
            height: 36px !important;
          }
          .lp-back-to-top svg {
            width: 14px !important;
            height: 14px !important;
          }
        }

        /* Smooth scroll for mobile */
        @media (max-width: 768px) {
          html {
            scroll-behavior: smooth;
          }
        }

        /* Prevent horizontal scroll on mobile */
        #root, #main-content {
          overflow-x: hidden;
          max-width: 100vw;
        }

        /* Touch-friendly button sizes */
        @media (max-width: 768px) {
          button, 
          .lp-cta,
          .lp-lang-btn,
          .lp-mobile-toggle {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>

      {/* ── SKIP LINK ───────────────────────────────────── */}
      <a href="#main-content" className="lp-skip-link">
        {LANDING_COPY.skipToContent}
      </a>

      {/* ── TOP NAV ─────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(6,11,46,0.9)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: isMobile
            ? "10px clamp(12px, 4vw, 16px)"
            : "12px clamp(16px, 5vw, 48px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isMobile ? 8 : 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isMobile ? 8 : 10,
          }}
        >
          <img
            src={mesobLogo}
            alt="Addis MESOB"
            style={{
              width: isMobile ? 28 : 34,
              height: isMobile ? 28 : 34,
              borderRadius: 8,
            }}
          />
          <span
            style={{
              fontFamily: F.serif,
              fontWeight: 800,
              fontSize: isMobile ? 14 : 18,
              color: "#fff",
            }}
          >
            Addis MESOB
          </span>
        </div>

        <div
          className="lp-desktop-only"
          style={{ alignItems: "center", gap: isMobile ? 12 : 20 }}
        >
          <a
            href="#features"
            className={`lp-nav-link${activeSection === "features" ? " active" : ""}`}
            style={{
              color: activeSection === "features" ? C.gold : "#c9d0f0",
              textDecoration: "none",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
            }}
          >
            Features
          </a>
          <a
            href="#services"
            className="lp-nav-link"
            style={{
              color: "#c9d0f0",
              textDecoration: "none",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
            }}
          >
            Services
          </a>
          <a
            href="#how"
            className={`lp-nav-link${activeSection === "how" ? " active" : ""}`}
            style={{
              color: activeSection === "how" ? C.gold : "#c9d0f0",
              textDecoration: "none",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
            }}
          >
            How it works
          </a>
          <a
            href="#faq"
            className="lp-nav-link"
            style={{
              color: "#c9d0f0",
              textDecoration: "none",
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
            }}
          >
            FAQ
          </a>
          <div style={{ display: "flex", gap: isMobile ? 2 : 4 }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className="lp-lang-btn"
                onClick={() => changeLanguage(l.code)}
                title={l.label}
                style={{
                  background:
                    language === l.code ? C.gold : "rgba(255,255,255,0.08)",
                  color: language === l.code ? C.dark : "#c9d0f0",
                  border: "none",
                  borderRadius: 6,
                  padding: isMobile ? "4px 6px" : "5px 9px",
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: F.sans,
                }}
              >
                {l.flag}
              </button>
            ))}
          </div>
          <button
            onClick={goLogin}
            className="lp-cta"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minWidth: isMobile ? "120px" : "clamp(140px, 15vw, 180px)",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
              color: C.dark,
              border: "none",
              borderRadius: 8,
              padding: isMobile ? "8px 14px" : "9px 16px",
              fontWeight: 800,
              fontSize: isMobile ? 12 : 13,
              cursor: "pointer",
              fontFamily: F.sans,
              whiteSpace: "nowrap",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 28px rgba(245,197,24,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FiMenu size={isMobile ? 12 : 14} />
            {LANDING_COPY.ctaPrimary}
          </button>
        </div>

        <button
          className="lp-mobile-toggle"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label="Toggle menu"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 8,
            width: isMobile ? 36 : 38,
            height: isMobile ? 36 : 38,
            color: "#fff",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
          }}
        >
          {mobileNavOpen ? (
            <FiX size={isMobile ? 16 : 18} />
          ) : (
            <FiMenu size={isMobile ? 16 : 18} />
          )}
        </button>
      </header>

      {/* ── MOBILE NAV ────────────────────────────────────── */}
      {mobileNavOpen && (
        <div
          style={{
            background: "#081d17",
            padding: isMobile
              ? "12px clamp(12px, 4vw, 16px) 20px"
              : "16px clamp(16px, 5vw, 48px) 24px",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 12 : 14,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            animation: "lp-fade-in 0.2s ease",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <a
            href="#features"
            style={{
              color: "#c9d0f0",
              fontSize: isMobile ? 13 : 14,
              fontWeight: 600,
            }}
            onClick={() => setMobileNavOpen(false)}
          >
            Features
          </a>
          <a
            href="#services"
            style={{
              color: "#c9d0f0",
              fontSize: isMobile ? 13 : 14,
              fontWeight: 600,
            }}
            onClick={() => setMobileNavOpen(false)}
          >
            Services
          </a>
          <a
            href="#how"
            style={{
              color: "#c9d0f0",
              fontSize: isMobile ? 13 : 14,
              fontWeight: 600,
            }}
            onClick={() => setMobileNavOpen(false)}
          >
            How it works
          </a>
          <a
            href="#faq"
            style={{
              color: "#c9d0f0",
              fontSize: isMobile ? 13 : 14,
              fontWeight: 600,
            }}
            onClick={() => setMobileNavOpen(false)}
          >
            FAQ
          </a>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                style={{
                  background:
                    language === l.code ? C.gold : "rgba(255,255,255,0.08)",
                  color: language === l.code ? C.dark : "#c9d0f0",
                  border: "none",
                  borderRadius: 6,
                  padding: isMobile ? "6px 10px" : "6px 10px",
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 44,
                  minWidth: 44,
                }}
              >
                {l.flag}
              </button>
            ))}
          </div>
          <button
            onClick={goLogin}
            style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
              color: C.dark,
              border: "none",
              borderRadius: 8,
              padding: isMobile ? "12px 16px" : "10px 16px",
              fontWeight: 800,
              fontSize: isMobile ? 14 : 13,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            {LANDING_COPY.ctaPrimary}
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────── */}
      <div id="main-content" style={{ overflowX: "hidden", maxWidth: "100vw" }}>
        {/* Hero Section */}
        <HeroSection t={t} onLogin={goLogin} />

        {/* ✨ Vision & Mission Section */}
        <VisionMission t={t} language={language} />

        {/* Departments Marquee */}
        <DepartmentsMarquee
          departments={departmentsList}
          loading={loading}
          label={LANDING_COPY.deptsEyebrow}
        />

        {/* Features Grid */}
        <FeaturesGrid
          ref={registerRef("features")}
          data-reveal="features"
          style={revealStyle("features")}
          t={t}
          copy={{
            eyebrow: LANDING_COPY.featuresEyebrow,
            title: LANDING_COPY.featuresTitle,
            sub: LANDING_COPY.featuresSub,
          }}
        />

        {/* Services Section */}
        <ServicesSection
          ref={registerRef("services")}
          data-reveal="services"
          style={revealStyle("services")}
          t={t}
          services={services}
          loading={loading}
          error={error}
          departments={departments}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterDept={filterDept}
          onFilterChange={(val) => {
            setFilterDept(val);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={goToPage}
          copy={{
            searchPlaceholder:
              t("landing.searchServices") || "Search services...",
            showing: t("landing.showingServices") || "Showing",
            of: t("landing.of") || "of",
            services: t("landing.services") || "services",
            page: t("landing.page") || "Page",
            previous: t("landing.previous") || "Previous",
            next: t("landing.next") || "Next",
            active: t("landing.active") || "Active",
            inactive: t("landing.inactive") || "Inactive",
            loading: t("landing.loadingServices") || "Loading services...",
            noServices: t("landing.noServicesFound") || "No services found",
            service: t("landing.service") || "service",
            available: t("landing.available") || "available",
          }}
          getServiceIcon={getServiceIcon}
          language={language}
        />

        {/* How It Works */}
        <HowItWorks
          ref={registerRef("how")}
          data-reveal="how"
          style={revealStyle("how")}
          t={t}
          copy={{
            eyebrow: LANDING_COPY.howEyebrow,
            title: LANDING_COPY.howTitle,
          }}
        />

        {/* Golden Monday Teaser */}
        <GoldenMondayTeaser
          ref={registerRef("gm")}
          data-reveal="gm"
          style={revealStyle("gm")}
          t={t}
          copy={{
            eyebrow: LANDING_COPY.gmEyebrow,
            title: LANDING_COPY.gmTitle,
            body: LANDING_COPY.gmBody,
            cta: LANDING_COPY.gmCta,
          }}
          onLogin={goLogin}
        />

        {/* FAQ Section */}
        <FAQSection
          ref={registerRef("faq")}
          data-reveal="faq"
          style={revealStyle("faq")}
          t={t}
          copy={{
            eyebrow: LANDING_COPY.faqEyebrow,
            title: LANDING_COPY.faqTitle,
          }}
          language={language}
        />
      </div>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <SiteFooter
        tagline={LANDING_COPY.footerTagline}
        privacyLabel={LANDING_COPY.footerPrivacy}
        termsLabel={LANDING_COPY.footerTerms}
        contactLabel={LANDING_COPY.footerContact}
      />

      {/* ── BACK TO TOP ──────────────────────────────────── */}
      <button
        onClick={scrollToTop}
        aria-label={LANDING_COPY.backToTop}
        className="lp-back-to-top"
        style={{
          position: "fixed",
          bottom: isMobile ? 16 : 24,
          right: isMobile ? 16 : 24,
          width: isMobile ? 40 : 44,
          height: isMobile ? 40 : 44,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
          color: C.dark,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 18px rgba(6,11,46,0.3)",
          zIndex: 40,
          opacity: showBackToTop ? 1 : 0,
          pointerEvents: showBackToTop ? "auto" : "none",
          transition:
            "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 10px 24px rgba(6,11,46,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 18px rgba(6,11,46,0.3)";
        }}
      >
        <FiArrowUp size={isMobile ? 16 : 18} />
      </button>
    </div>
  );
}
