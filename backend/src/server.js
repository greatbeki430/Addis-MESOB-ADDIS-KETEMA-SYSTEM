// backend/src/server.js
require("dotenv").config();
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

// AI Features
const aiRoutes = require("./routes/aiRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const documentRoutes = require("./routes/documentRoutes");
const goldenMondayRoutes = require("./routes/goldenMondayRoutes");
const { startGoldenMondayScheduler } = require("./jobs/goldenMondayScheduler");

const { notFound, errorHandler } = require("./middleware/errorHandler");
const telegramRoutes = require("./routes/telegramRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

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
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      console.log("Blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
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
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Credentials",
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

// AI Features
app.use("/api/ai", aiRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/golden-monday", goldenMondayRoutes);
app.use("/api/telegram", telegramRoutes);
app.use("/api/upload", uploadRoutes);

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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✅ CORS enabled for: ${allowedOrigins.join(", ")}`);
      console.log(
        `🤖 AI routes: /api/ai, /api/chatbot, /api/documents, /api/golden-monday`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startGoldenMondayScheduler();
startServer();
