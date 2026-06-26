// src/App.jsx
import { useState, useEffect } from "react";
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
import Report from "./pages/Report";
import { setToastFunction } from "./utils/toastHelper";
import { ToastContainer } from "./components/ui/Modal";
import { useToast } from "./hooks/useToast";
import { LanguageProvider } from "./context/LanguageProvider";
import { useLanguage } from "./hooks/useLanguage";

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
          {t.appName}
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
          {t.appSub}
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
  const [tab, setTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { showToast, toasts, removeToast } = useToast();
  const {
    user,
    isAdmin,
    isSuperAdmin,
    isLeader,
    isEmployee,
    isAdminOrSuperAdmin,
    isLeaderOrAbove,
  } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    setToastFunction(showToast);
  }, [showToast]);

  const handleSetTab = (newTab) => {
    setTab(newTab);
    if (newTab !== "forum") {
      setSelectedTeam(null);
    }
  };

  const getRoleDisplay = () => {
    if (isSuperAdmin) return "Super Admin 👑";
    if (isAdmin) return "Admin ⚙️";
    if (isLeader) return "Team Leader ⭐";
    return "Employee 👤";
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserRoleName = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isAdmin) return "Admin";
    if (isLeader) return "Leader";
    if (isEmployee) return "Employee";
    return "User";
  };

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
          50% { box-shadow: 0 0 40px ${C.primary}88; }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .page-enter {
          animation: fadeInUp 0.4s ease forwards;
        }
        
        input:focus, textarea:focus, select:focus {
          border-color: #1a6b4a !important;
          outline: none;
          box-shadow: 0 0 0 3px #1a6b4a22;
        }
        
        button {
          transition: opacity 0.15s, transform 0.15s;
        }
        button:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f0f7f4; }
        ::-webkit-scrollbar-thumb { background: #a0d4b8; border-radius: 3px; }
        
        .daily-report-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          margin: 0 -8px;
          padding: 0 8px;
        }
        
        @media (max-width: 768px) {
          .services-search, .services-filter { min-height: 44px; }
          .service-card:active { transform: scale(0.98); }
        }
        
        @media (max-width: 480px) {
          select { font-size: 16px !important; }
          input[type="number"] { min-height: 32px; }
        }
        
        @media (max-width: 600px) {
          .header-date { display: none !important; }
        }
        @media (max-width: 480px) {
          .header-appname { display: none !important; }
        }
        @media (max-width: 400px) {
          .header-lang-btn { padding: 2px 5px !important; font-size: 9px !important; }
        }
        @media (max-width: 550px) {
          header { gap: 6px !important; }
          header > div { gap: 6px !important; }
        }
      `}</style>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Sidebar
        tab={tab}
        setTab={handleSetTab}
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
        <Header tab={tab} t={t} lang={language} setLang={changeLanguage} />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0",
          }}
        >
          <div className="page-enter">
            {tab === "dashboard" && <Dashboard t={t} lang={language} />}
            {tab === "forum" && (
              <ForumReport
                t={t}
                lang={language}
                selectedTeam={selectedTeam}
                onReportSaved={(teamId, reportData) =>
                  console.log("Report saved:", teamId, reportData)
                }
              />
            )}
            {tab === "evaluation" && <Evaluation t={t} lang={language} />}
            {tab === "report" && isLeaderOrAbove && (
              <DailyReport t={t} lang={language} />
            )}
            {tab === "services" && isAdminOrSuperAdmin && (
              <Services t={t} lang={language} />
            )}
            {tab === "users" && isAdminOrSuperAdmin && (
              <UserManagement
                t={t}
                isSuperAdmin={isSuperAdmin}
                isAdmin={isAdmin}
                lang={language}
              />
            )}
            {tab === "teams" && isSuperAdmin && (
              <TeamManagement
                t={t}
                isSuperAdmin={isSuperAdmin}
                lang={language}
              />
            )}
            {tab === "analytics" && isLeaderOrAbove && (
              <Report t={t} lang={language} />
            )}
          </div>
        </main>
      </div>

      {/* Floating User Badge */}
      <div
        style={{
          position: "fixed",
          bottom: 80,
          right: 20,
          background: C.white,
          borderRadius: 12,
          padding: "10px 16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontSize: 11,
          zIndex: 99,
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: `1px solid ${C.border}`,
          animation: "fadeInUp 0.5s ease",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: `linear-gradient(135deg, ${C.primary}, ${C.light})`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {getUserInitials()}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: C.dark, fontSize: 12 }}>
            {user?.name || "User"}
          </div>
          <div style={{ color: C.muted, fontSize: 10 }}>
            {getRoleDisplay()} • {getUserRoleName()}
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {isAdminOrSuperAdmin && showRegister && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            animation: "fadeIn 0.3s ease",
          }}
          onClick={() => setShowRegister(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Register onClose={() => setShowRegister(false)} t={t} />
          </div>
        </div>
      )}

      {/* Add User Button */}
      {isAdminOrSuperAdmin && (
        <button
          onClick={() => setShowRegister(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 56,
            height: 56,
            fontSize: 24,
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
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,107,74,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
          }}
        >
          +
        </button>
      )}
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

  if (!isAuthenticated) {
    return <Login />;
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
