// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { initPDFFonts } from "./utils/pdf/fontPreloader";
import { C, F } from "./styles/theme";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header"; // ✅ RESTORED: Header with dropdown

import Dashboard from "./pages/Dashboard";
import ForumReport from "./pages/ForumReport";
import Evaluation from "./pages/Evaluation";
import DailyReport from "./pages/DailyReport";
import Services from "./pages/Services";
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

// Admin Data Management
import AdminDataManagement from "./pages/admin/AdminDataManagement";
import ChangePassword from "./pages/ChangePassword";

import { FiUserPlus } from "react-icons/fi";

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

  // Initialize PDF fonts when app loads
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
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
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
        
        .fab-button {
          width: 48px !important;
          height: 48px !important;
          min-width: 48px !important;
          min-height: 48px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 20px !important;
          line-height: 1 !important;
          padding: 0 !important;
        }
        
        @media (max-width: 768px) {
          .fab-button {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            font-size: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .fab-button {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            font-size: 14px !important;
          }
        }
      `}</style>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* ✅ Sidebar - Navigation only (NO header elements) */}
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

      {/* ✅ Main Content Area with Header */}
      <div
        className="main-content"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          minWidth: 0,
          width: collapsed ? "calc(100% - 60px)" : "calc(100% - 240px)",
          maxWidth: "100%",
          transition: "width 0.3s ease, max-width 0.3s ease",
        }}
      >
        {/* ✅ Header - Top bar with user dropdown, language, date */}
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
            maxWidth: "100%",
            width: "100%",
          }}
        >
          <div
            className="page-enter"
            style={{ maxWidth: "100%", overflowX: "hidden" }}
          >
            <Routes>
              {/* ✅ FIX: logged-in users hitting "/" now go straight to
                  the dashboard instead of rendering the public marketing
                  Landing page inside the authenticated Sidebar/Header
                  shell (which duplicated navigation and looked broken). */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={<Dashboard t={t} lang={language} />}
              />
              <Route
                path="/golden-monday"
                element={<GoldenMonday lang={language} />}
              />
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
              <Route
                path="/evaluation"
                element={<Evaluation t={t} lang={language} />}
              />
              <Route
                path="/report"
                element={<DailyReport t={t} lang={language} />}
              />
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
              <Route path="/documents" element={<DocumentVault />} />
              <Route
                path="/digital-attendance"
                element={<DigitalAttendance />}
              />
              <Route
                path="/admin-attendance"
                element={
                  isAdminOrSuperAdmin ? (
                    <AttendanceManagement isDigitalView={false} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/admin-digital-attendance"
                element={
                  isSuperAdmin ? (
                    <AttendanceManagement isDigitalView={true} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
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
              <Route
                path="/admin-evaluations"
                element={
                  isAdminOrSuperAdmin ? (
                    <AdminDataManagement dataType="evaluations" />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/admin-daily-reports"
                element={
                  isAdminOrSuperAdmin ? (
                    <AdminDataManagement dataType="daily-reports" />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/admin-forum-reports"
                element={
                  isAdminOrSuperAdmin ? (
                    <AdminDataManagement dataType="forum-reports" />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/admin-requests"
                element={
                  isAdminOrSuperAdmin ? (
                    <AdminDataManagement dataType="requests" />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/profile"
                element={<Profile t={t} lang={language} />}
              />
              <Route
                path="/settings"
                element={<Settings t={t} lang={language} />}
              />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>

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

      {isAdminOrSuperAdmin && (
        <button
          onClick={() => setShowRegister(true)}
          className="fab-button"
          style={{
            position: "fixed",
            bottom: "clamp(80px, 12vh, 100px)",
            right: "clamp(12px, 2vw, 20px)",
            background: C.primary,
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 48,
            height: 48,
            minWidth: 48,
            minHeight: 48,
            fontSize: 20,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            lineHeight: 1,
            padding: 0,
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
          <FiUserPlus size={20} />
        </button>
      )}

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

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
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
  return <AppRouter />;
}
