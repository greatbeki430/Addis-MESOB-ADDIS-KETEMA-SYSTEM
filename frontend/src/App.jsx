// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { initPDFFonts } from "./utils/pdf/fontPreloader";
import { C, F } from "./styles/theme";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import ForumReport from "./pages/ForumReport";
import Evaluation from "./pages/Evaluation";
import DailyReport from "./pages/DailyReport";
import Services from "./pages/Services";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserManagement from "./pages/admin/UserManagement";
import TeamManagement from "./pages/admin/TeamManagement";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import Report from "./pages/Report";
import { setToastFunction } from "./utils/toastHelper";
import { ToastContainer } from "./components/ui/Modal";
import { useToast } from "./hooks/useToast";
import { LanguageProvider } from "./context/LanguageProvider";
import { useLanguage } from "./hooks/useLanguage";
import AdminServiceManager from "./pages/admin/AdminServiceManager";

// AI Feature imports
import ChatbotWidget from "./components/chatbot/ChatbotWidget";
import DocumentVault from "./pages/documents/DocumentVault";
import GoldenMonday from "./pages/GoldenMonday";

// Landing Page import
import Landing from "./pages/Landing";

// Profile & Settings imports
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Attendance & Alerts imports
import DigitalAttendance from "./components/DigitalAttendance";
import AttendanceManagement from "./pages/admin/AttendanceManagement";
import AlertsManagement from "./pages/admin/AlertsManagement";

// =============================================
// ANIMATED A-MESOB TITLE COMPONENT
// =============================================
export const AnimatedTitle = ({ t, collapsed }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (collapsed) {
    return (
      <div
        style={{
          width: 38,
          height: 38,
          minWidth: 38,
          background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 900,
          color: "#fff",
          fontFamily: F.serif,
          animation: "pulseGlow 2s ease-in-out infinite",
        }}
      >
        አ
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 12 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          width: 42,
          height: 42,
          minWidth: 42,
          background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 900,
          color: "#fff",
          fontFamily: F.serif,
          transform: isHovered
            ? `rotate(${rotation}deg) scale(1.1)`
            : "rotate(0deg) scale(1)",
          transition: "transform 0.3s ease",
          boxShadow: isHovered ? `0 0 30px ${C.primary}66` : "none",
        }}
      >
        አ
      </div>
      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: C.light,
            fontFamily: F.serif,
            background: `linear-gradient(90deg, ${C.light}, ${C.primary})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            transition: "all 0.3s ease",
            letterSpacing: isHovered ? "2px" : "0px",
          }}
        >
          {t?.("appName") || "A-MESOB"}
        </div>
        <div
          style={{
            fontSize: 9,
            color: "#6aaa88",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            opacity: isHovered ? 1 : 0.7,
            transition: "opacity 0.3s ease",
          }}
        >
          {t?.("appSub") || "One-Stop"}
        </div>
      </div>
    </div>
  );
};

// =============================================
// AUTHENTICATED APP
// =============================================
function AuthenticatedApp() {
  const { language, t, changeLanguage } = useLanguage();
  const { showToast, toasts, removeToast } = useToast();
  const location = useLocation();
  const { isAdmin, isSuperAdmin, isAdminOrSuperAdmin, isLeaderOrAbove } =
    useAuth();

  const currentTab = location.pathname.replace("/", "") || "dashboard";
  const [collapsed, setCollapsed] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  // ✅ Initialize PDF fonts when app loads
  useEffect(() => {
    const initializePDF = async () => {
      try {
        console.log("📄 Initializing PDF system...");
        const success = await initPDFFonts();
        if (success) {
          console.log("✅ PDF system ready with full font support");
          setPdfReady(true);
        } else {
          console.warn("⚠️ PDF system running with fallback fonts");
          setPdfReady(true);
        }
      } catch (error) {
        console.error("❌ PDF initialization failed:", error);
        setPdfReady(true);
      }
    };

    initializePDF();
  }, []);

  useEffect(() => {
    setToastFunction(showToast);
  }, [showToast]);

  if (!t || typeof t !== "function") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: C.gray,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
          <p style={{ color: C.muted }}>Loading translations...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.gray,
        fontFamily: F.sans,
        display: "flex",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700;800&family=Noto+Serif+Ethiopic:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px ${C.primary}44; }
          50%       { box-shadow: 0 0 40px ${C.primary}88; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .page-enter { animation: fadeInUp 0.4s ease forwards; }

        input:focus, textarea:focus, select:focus {
          border-color: ${C.primary} !important;
          outline: none;
          box-shadow: 0 0 0 3px ${C.primary}22;
        }
        button { transition: opacity 0.15s, transform 0.15s; }
        button:hover { opacity: 0.88; transform: translateY(-1px); }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f0f7f4; }
        ::-webkit-scrollbar-thumb { background: #a0d4b8; border-radius: 3px; }

        .daily-report-table-wrapper {
          overflow-x: auto; -webkit-overflow-scrolling: touch;
          scrollbar-width: thin; margin: 0 -8px; padding: 0 8px;
        }

        @media (max-width: 768px) {
          .services-search, .services-filter { min-height: 44px; }
          .service-card:active { transform: scale(0.98); }
        }
        @media (max-width: 480px) {
          select { font-size: 16px !important; }
          input[type="number"] { min-height: 32px; }
        }
        @media (max-width: 600px) { .header-date    { display: none !important; } }
        @media (max-width: 480px) { .header-appname { display: none !important; } }
        @media (max-width: 400px) {
          .header-lang-btn { padding: 2px 5px !important; font-size: 9px !important; }
        }
        @media (max-width: 550px) {
          header       { gap: 6px !important; }
          header > div { gap: 6px !important; }
        }

        /* PDF Status Indicator */
        .pdf-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 12px;
          background: ${pdfReady ? "#e8f5e9" : "#fff3e0"};
          color: ${pdfReady ? "#2e7d32" : "#e65100"};
          margin-left: 8px;
        }
        .pdf-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${pdfReady ? "#4caf50" : "#ff9800"};
          animation: ${pdfReady ? "pulseGlow 2s ease-in-out infinite" : "none"};
        }
      `}</style>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Sidebar
        tab={currentTab}
        lang={language}
        setLang={changeLanguage}
        t={t}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        selectedTeam={selectedTeam}
        setSelectedTeam={setSelectedTeam}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Header
          tab={currentTab}
          t={t}
          lang={language}
          setLang={changeLanguage}
          onAddUserClick={() => setShowRegister(true)}
        />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: 0,
          }}
        >
          <div className="page-enter">
            <Routes>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route
                path="/dashboard"
                element={<Dashboard t={t} lang={language} />}
              />

              {/* Golden Monday */}
              <Route
                path="/golden-monday"
                element={<GoldenMonday lang={language} />}
              />

              {/* Forum Report */}
              <Route
                path="/forum"
                element={
                  <ForumReport
                    t={t}
                    lang={language}
                    selectedTeam={selectedTeam}
                    setSelectedTeam={setSelectedTeam}
                    onReportSaved={(teamId, data) =>
                      console.log("Report saved:", teamId, data)
                    }
                  />
                }
              />

              {/* Evaluation */}
              <Route
                path="/evaluation"
                element={<Evaluation t={t} lang={language} />}
              />

              {/* Daily Report - Only Team Leaders and above */}
              <Route
                path="/report"
                element={
                  isLeaderOrAbove ? (
                    <DailyReport t={t} lang={language} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Services - Only Admins and Super Admins */}
              <Route
                path="/services"
                element={
                  isAdminOrSuperAdmin ? (
                    <Services t={t} lang={language} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Admin Service Manager - Only Super Admins */}
              <Route
                path="/admin/services"
                element={
                  isSuperAdmin ? (
                    <AdminServiceManager t={t} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* User Management - Only Admins and Super Admins */}
              <Route
                path="/users"
                element={
                  isAdminOrSuperAdmin ? (
                    <UserManagement
                      t={t}
                      isSuperAdmin={isSuperAdmin}
                      isAdmin={isAdmin}
                      lang={language}
                    />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Team Management - Only Super Admins */}
              <Route
                path="/teams"
                element={
                  isSuperAdmin ? (
                    <TeamManagement
                      t={t}
                      isSuperAdmin={isSuperAdmin}
                      lang={language}
                    />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Employee Management - Only Admins and Super Admins */}
              <Route
                path="/employees"
                element={
                  isAdminOrSuperAdmin ? (
                    <EmployeeManagement t={t} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Analytics - Only Team Leaders and above */}
              <Route
                path="/analytics"
                element={
                  isLeaderOrAbove ? (
                    <Report t={t} lang={language} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Document Vault - All authenticated users */}
              <Route path="/documents" element={<DocumentVault />} />

              {/* Digital Attendance - All authenticated users */}
              <Route
                path="/digital-attendance"
                element={<DigitalAttendance />}
              />

              {/* Attendance Management - Admins and Super Admins */}
              <Route
                path="/admin-attendance"
                element={
                  isAdminOrSuperAdmin ? (
                    <AttendanceManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Digital Attendance Logs - Super Admins only */}
              <Route
                path="/admin-digital-attendance"
                element={
                  isSuperAdmin ? (
                    <AttendanceManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Alerts & Notifications - Admins and Super Admins */}
              <Route
                path="/admin-alerts"
                element={
                  isAdminOrSuperAdmin ? (
                    <AlertsManagement />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />

              {/* Profile - All authenticated users */}
              <Route
                path="/profile"
                element={<Profile t={t} lang={language} />}
              />

              {/* Settings - All authenticated users */}
              <Route
                path="/settings"
                element={<Settings t={t} lang={language} />}
              />

              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Register Modal - with higher z-index than chatbot to prevent overlap */}
      {isAdminOrSuperAdmin && showRegister && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            animation: "fadeIn 0.3s ease",
          }}
          onClick={() => setShowRegister(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Register onClose={() => setShowRegister(false)} t={t} />
          </div>
        </div>
      )}

      {/* Add User FAB - positioned above chatbot, smaller on all devices */}
      {isAdminOrSuperAdmin && (
        <button
          onClick={() => setShowRegister(true)}
          style={{
            position: "fixed",
            bottom: "clamp(80px, 12vh, 100px)",
            right: "clamp(12px, 2vw, 20px)",
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "clamp(40px, 6vw, 52px)",
            height: "clamp(40px, 6vw, 52px)",
            fontSize: "clamp(18px, 3vw, 24px)",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = `0 6px 20px ${C.primary}66`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
          }}
        >
          +
        </button>
      )}

      {/* AI Chatbot Widget - smaller on all devices, hidden when register modal is open */}
      {!showRegister && <ChatbotWidget />}
    </div>
  );
}

// =============================================
// APP ROUTER
// =============================================
function AppRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.gray,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 32,
              marginBottom: 10,
              animation: "pulseGlow 1.5s ease-in-out infinite",
            }}
          >
            ⏳
          </div>
          <p style={{ color: C.muted }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show Landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Redirect all other routes to landing for unauthenticated users */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return <AuthenticatedApp />;
}

// =============================================
// MAIN APP
// =============================================
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppRouter />
      </LanguageProvider>
    </AuthProvider>
  );
}
