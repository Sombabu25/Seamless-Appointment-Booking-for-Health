// 3rd Party Imports
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// Custom Imports
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();

const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// AUTH CONTROLLER
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// USER ConTROLLER
router.get("/", userController.getAllUsers);

router.use(authController.protect);

router
  .route("/:id")
  .get(userController.getUser)
  .delete(userController.deleteUser);
router.get("/verify-user/:id", userController.verifyUser);
router.post("/book-appointment", userController.bookAppointment);
router.post(
  "/upload-document",
  upload.array("documents", 5),
  userController.uploadDocuments
);
router.get("/user-appointments/:id", userController.userAppointments);
router.patch("/appointments/:id/cancel", userController.cancelAppointment);
router.patch("/appointments/:id/reschedule", userController.rescheduleAppointment);
// NOTIFICATIONS
router.post("/mark-all-notification-as-seen", userController.notificationSeen);
router.post("/delete-all-notifications", userController.deleteNotifications);
// ADMIN
router.post("/change-doctor-status", userController.doctorStatus);

module.exports = router;
