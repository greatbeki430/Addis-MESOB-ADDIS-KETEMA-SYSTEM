// require("dotenv").config();
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

const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(helmet());
// app.use(cors());
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/daily-reports", dailyReportRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/auth/users", userRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "✅ Acha Forum Backend API is running" });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
