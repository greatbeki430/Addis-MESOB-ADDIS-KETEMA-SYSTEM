import { useState } from "react";
import { translations } from "./constants/translations";
import { C, F } from "./styles/theme";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import ForumReport from "./pages/ForumReport";
import Evaluation from "./pages/Evaluation";
import DailyReport from "./pages/DailyReport";
import Services from "./pages/Services";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// This component handles the authenticated app
function AuthenticatedApp() {
  const [tab, setTab] = useState("dashboard");
  const [lang, setLang] = useState("am");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null); // ✅ New state for selected team
  const t = translations[lang] || translations.am;
  const { isAdmin } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Handle forum tab - reset selected team when not on forum
  const handleSetTab = (newTab) => {
    setTab(newTab);
    if (newTab !== "forum") {
      setSelectedTeam(null); // Clear selected team when leaving forum
    }
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
        *{box-sizing:border-box;margin:0;}
        input:focus,textarea:focus,select:focus{border-color:#1a6b4a!important;outline:none;box-shadow:0 0 0 3px #1a6b4a22;}
        button{transition:opacity .15s,transform .15s;}
        button:hover{opacity:.88;transform:translateY(-1px);}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#f0f7f4;}
        ::-webkit-scrollbar-thumb{background:#a0d4b8;border-radius:3px;}

        /* Smooth scrolling for tables on mobile */
        .daily-report-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          margin: 0 -8px;
          padding: 0 8px;
        }
        
        /* Better touch targets on mobile */
        @media (max-width: 768px) {
          .services-search,
          .services-filter {
            min-height: 44px;
          }
          
          .service-card {
            cursor: pointer;
            transition: transform 0.2s ease;
          }
          
          .service-card:active {
            transform: scale(0.98);
            background-color: #f5f5f5;
          }
        }

        /* Improve select dropdown on mobile */
        @media (max-width: 480px) {
          select {
            font-size: 16px !important;
          }
        }

        /* Better touch scrolling */
        @media (max-width: 768px) {
          .daily-report-table-wrapper {
            margin: 0 -12px;
            padding: 0 12px;
          }
          
          input[type="number"] {
            min-height: 32px;
          }
        }
        
        /* ===== Header Responsive CSS ===== */
        @media (max-width: 600px) {
          .header-date {
            display: none !important;
          }
        }
        
        @media (max-width: 480px) {
          .header-appname {
            display: none !important;
          }
        }
        
        @media (max-width: 400px) {
          .header-lang-btn {
            padding: 2px 5px !important;
            font-size: 9px !important;
          }
        }
        
        @media (max-width: 550px) {
          header {
            gap: 6px !important;
          }
          header > div {
            gap: 6px !important;
          }
        }
      `}</style>

      <Sidebar
        tab={tab}
        setTab={handleSetTab}
        lang={lang}
        setLang={setLang}
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
        <Header tab={tab} t={t} lang={lang} setLang={setLang} />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0",
          }}
        >
          {tab === "dashboard" && <Dashboard t={t} />}
          {tab === "forum" && (
            <ForumReport
              t={t}
              lang={lang}
              selectedTeam={selectedTeam}
              onReportSaved={(teamId, reportData) => {
                // Optional: Handle report save if needed
                console.log("Report saved for team:", teamId, reportData);
              }}
            />
          )}
          {tab === "evaluation" && <Evaluation t={t} />}
          {tab === "report" && <DailyReport t={t} />}
          {tab === "services" && <Services t={t} />}
        </main>
      </div>

      {/* Admin-only Register Modal */}
      {isAdmin && showRegister && (
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
          }}
          onClick={() => setShowRegister(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Register onClose={() => setShowRegister(false)} />
          </div>
        </div>
      )}

      {/* Admin-only Add User Button */}
      {isAdmin && (
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
          }}
        >
          +
        </button>
      )}
    </div>
  );
}

// This component handles authentication state
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
          <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

// Main App component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
