const mongoose = require("mongoose");
require("dotenv").config();
require("colors");
// Custom Imports
const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);

  process.exit(1);
});

const dbURI = process.env.DATABASE;
if (!dbURI) {
  console.error("Missing required env var: DATABASE");
  process.exit(1);
}

let server;

const startServer = async () => {
  try {
    await mongoose.connect(dbURI);

    const db = mongoose.connection;
    db.on("error", (error) => {
      console.error("Connection error:", error);
    });

    db.once("open", () => {
      console.log("Connected to MongoDB".cyan.underline.bold);
      console.log("Environment:", `${process.env.NODE_ENV}`.yellow);
    });

    const port = process.env.PORT || 8000;
    server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Shutting down...");
  console.log(err.name, err.message);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
