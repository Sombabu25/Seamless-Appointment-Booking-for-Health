const express = require("express");
const morgan = require("morgan");
const colors = require("colors");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");
// Custom Imports
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const doctorRouter = require("./routes/doctorRoutes");
const appointmentRouter = require("./routes/appointmentRoutes");

const corsOptions = {
  origin: "*",
  methods: "*",
  allowedHeaders: "*",
};

const app = express();

const projectRoot = path.resolve();
const uploadsPath = path.join(projectRoot, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));
app.use(cors(corsOptions));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json({ limit: "10kb" }));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/appointments", appointmentRouter);

// PRODUCTION SETUP
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(projectRoot, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(projectRoot, "../client/build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Doctor Appointment API is running...");
  });
}

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
