// 3rd Party Imports
const express = require("express");
// Custom Imports
const authController = require("../controllers/authController");
const appointmentController = require("../controllers/appointmentController");

const router = express.Router();

// PROTECT ALL ROUTES
router.use(authController.protect);

// APPOINTMENT CONTROLLER
router.get("/", appointmentController.getAllAppointments);
router.get("/:id", appointmentController.getAppointment);
router.post("/", appointmentController.createAppointment);
router.patch("/:id", appointmentController.updateAppointment);
router.delete("/:id", appointmentController.deleteAppointment);

module.exports = router;
