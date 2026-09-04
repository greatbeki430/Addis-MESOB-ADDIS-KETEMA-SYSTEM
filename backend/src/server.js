// backend/src/server.js
// require("dotenv").config();
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const dailyReportRoutes = require("./routes/dailyReportRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

// AI Features
const aiRoutes = require("./routes/aiRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const documentRoutes = require("./routes/documentRoutes");
const goldenMondayRoutes = require("./routes/goldenMondayRoutes");
// ✅ FIX: this router (multer-based, actually parses the multipart
// upload ResourceLibrary.jsx sends) existed in the repo but was never
// require()'d or mounted anywhere — goldenMondayRoutes.js used to have
// its own broken inline stand-in for these same paths (removed in the
// last fix), so /resources/session/:sessionId had no working handler
// at all. Mounting it here is what actually wires it up.
const goldenMondayResourceRoutes = require("./routes/goldenMondayResourceRoutes");
const { startGoldenMondayScheduler } = require("./jobs/goldenMondayScheduler");

// Departments — NEW
const departmentRoutes = require("./routes/departmentRoutes");

// ✅ NOTIFICATIONS — NEW
const notificationRoutes = require("./routes/notificationRoutes");

const { notFound, errorHandler } = require("./middleware/errorHandler");
const telegramRoutes = require("./routes/telegramRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const registrationRoutes = require("./routes/registrationRoutes");

// =============================================
// IMPORT TELEGRAM SERVICE FOR PERSISTENT MENU
// =============================================
const { setupPersistentMenu } = require("./services/telegramService");
const feedRoutes = require("./routes/feedRoutes");

const app = express();

// =============================================
// ✅ CORS CONFIGURATION - FIXED
// =============================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://akmesob.vercel.app",
  "https://addis-mesob-frontend.vercel.app",
  "https://akmesob-git-main.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Allow all vercel.app subdomains
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin.includes("localhost")) {
      return callback(null, true);
    }

    // Check against specific allowed origins (with and without trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, ""); // Remove trailing slash
    const normalizedAllowed = allowedOrigins.map((o) => o.replace(/\/$/, ""));

    if (normalizedAllowed.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.log("Blocked origin:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// =============================================
// ✅ HELMET WITH CORS-FRIENDLY CONFIG
// =============================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://akmesob.vercel.app",
          "https://addis-mesob-frontend.vercel.app",
          "http://localhost:5173",
          "http://localhost:3000",
          "https://api.anthropic.com",
        ],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
      },
    },
  }),
);

// =============================================
// ✅ MIDDLEWARE
// =============================================
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(morgan("dev"));

// =============================================
// ✅ ROUTES
// =============================================
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/daily-reports", dailyReportRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/auth/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/public", publicRoutes);

// AI Features
app.use("/api/ai", aiRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/golden-monday", goldenMondayRoutes);
// ✅ FIX: mounted AFTER goldenMondayRoutes so it still sits behind the
// same "/api/golden-monday" prefix at the more specific
// "/api/golden-monday/resources" path — matches exactly what
// ResourceLibrary.jsx / api.js call
// (`/golden-monday/resources/session/${sessionId}`, etc.). Since
// goldenMondayRoutes.js no longer defines any /resources/* routes of
// its own, there's no shadowing: requests fall through to this router.
app.use("/api/golden-monday/resources", goldenMondayResourceRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/registrations", registrationRoutes);

// Departments — NEW
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/feed", feedRoutes);

// ✅ NOTIFICATIONS — NEW
app.use("/api/notifications", notificationRoutes);

// =============================================
// ✅ HEALTH CHECK
// =============================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "🚀 Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "✅ Addis MESOB Backend API is running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      teams: "/api/teams",
      services: "/api/services",
      reports: "/api/reports",
      ai: "/api/ai",
      chatbot: "/api/chatbot",
      documents: "/api/documents",
      "golden-monday": "/api/golden-monday",
      departments: "/api/departments",
      notifications: "/api/notifications",
      "telegram-webhook": "/api/telegram/webhook",
    },
  });
});

// =============================================
// ✅ ERROR HANDLING
// =============================================
app.use(notFound);
app.use(errorHandler);

// =============================================
// ✅ START SERVER
// =============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");

    // =============================================
    // 🚀 SETUP PERSISTENT MENU (Grid icon in input bar)
    // =============================================
    console.log("🔧 Setting up Telegram persistent menu...");
    console.log("📌 The menu button (⊞) will appear INSIDE the input bar");
    console.log("📌 Position: [⊞] [📎] [😊] Type a message...");

    try {
      await setupPersistentMenu();
      console.log("✅ Persistent menu setup complete!");
      console.log("ℹ️ Users will see the grid icon (⊞) in their input bar");
      console.log("ℹ️ The menu NEVER gets hidden as conversations grow");
    } catch (menuError) {
      console.error("❌ Failed to setup persistent menu:", menuError.message);
      console.log(
        "ℹ️ The bot will still work, but the menu button may not appear",
      );
    }

    // =============================================
    // 🚀 WEBHOOK MODE - Polling disabled
    // =============================================
    console.log("🤖 Telegram bot configured for WEBHOOK mode");
    console.log(
      `🔗 Webhook endpoint: https://your-app.onrender.com/api/telegram/webhook`,
    );
    console.log("ℹ️ To set the webhook, call POST /api/telegram/set-webhook");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✅ CORS enabled for: ${allowedOrigins.join(", ")}`);
      console.log(
        `🤖 AI routes: /api/ai, /api/chatbot, /api/documents, /api/golden-monday`,
      );
      console.log(`📨 Telegram webhook ready at /api/telegram/webhook`);
      console.log(`📌 Bot menu button (⊞) is now INSIDE the input bar!`);
      console.log(`🔔 Notification routes mounted at /api/notifications`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startGoldenMondayScheduler();
startServer();
