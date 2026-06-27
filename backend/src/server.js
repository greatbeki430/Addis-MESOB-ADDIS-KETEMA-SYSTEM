// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { corsOptions } = require("./middleware/cors");

const authRoutes = require("./routes/authRoutes");
const teamRoutes = require("./routes/teamRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const dailyReportRoutes = require("./routes/dailyReportRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");

const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// =============================================
// ✅ PROFESSIONAL CORS CONFIGURATION
// =============================================

// Allowed origins - from environment or defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "https://akmesob.vercel.app",
      "https://akmesob.vercel.app/",
      "https://addis-mesob-addis-ketema-system-production.up.railway.app",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5000",
    ];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies/tokens
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // 24 hours - cache preflight results
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS globally
app.use(cors(corsOptions));

// Handle preflight requests explicitly
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
        connectSrc: ["'self'", ...allowedOrigins],
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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));

// =============================================
// ✅ CORS LOGGING (for debugging)
// =============================================
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    console.log(`✅ CORS allowed: ${origin} → ${req.method} ${req.path}`);
  }
  next();
});

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

// =============================================
// ✅ HEALTH CHECK
// =============================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "🚀 Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    allowedOrigins: allowedOrigins,
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "✅ Acha Forum Backend API is running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      teams: "/api/teams",
      services: "/api/services",
      reports: "/api/reports",
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
      console.log(`🔗 Allowed Origins: ${allowedOrigins.join(", ")}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
