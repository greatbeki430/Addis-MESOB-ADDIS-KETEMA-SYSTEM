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

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [lang, setLang] = useState("am");
  const [collapsed, setCollapsed] = useState(false);
  const t = translations[lang] || translations.am;

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
        
        /* ===== Header Responsive CSS ===== */
        /* Hide date on screens smaller than 600px */
        @media (max-width: 600px) {
          .header-date {
            display: none !important;
          }
        }
        
        /* Hide app name on screens smaller than 480px */
        @media (max-width: 480px) {
          .header-appname {
            display: none !important;
          }
        }
        
        /* Make language buttons smaller on very small screens */
        @media (max-width: 400px) {
          .header-lang-btn {
            padding: 2px 5px !important;
            font-size: 9px !important;
          }
        }
        
        /* Reduce header gap on mobile */
        @media (max-width: 550px) {
          header {
            gap: 6px !important;
          }
          header > div {
            gap: 6px !important;
          }
        }
          /* Responsive Header CSS */
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
    padding: 2px 4px !important;
    font-size: 8px !important;
    min-width: 22px !important;
  }
}
      `}</style>

      <Sidebar
        tab={tab}
        setTab={setTab}
        lang={lang}
        setLang={setLang}
        t={t}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Right side container - fixed height for proper scrolling */}
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

        {/* Scrollable main content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0",
          }}
        >
          {tab === "dashboard" && <Dashboard t={t} />}
          {tab === "forum" && <ForumReport t={t} />}
          {tab === "evaluation" && <Evaluation t={t} />}
          {tab === "report" && <DailyReport t={t} />}
          {tab === "services" && <Services t={t} />}
        </main>
      </div>
    </div>
  );
}
