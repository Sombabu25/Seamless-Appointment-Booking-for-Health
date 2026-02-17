const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");

exports.getAllAppointments = catchAsync(async (req, res, next) => {
  const appointments = await Appointment.find()
    .populate("userId", "name email phoneNumber")
    .populate("doctorId", "prefix fullName email phoneNumber");

  res.status(200).json({
    status: "success",
    message: "Appointments fetched successfully.",
    data: appointments,
  });
});

exports.getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("userId", "name email phoneNumber")
    .populate("doctorId", "prefix fullName email phoneNumber");

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Appointment fetched successfully.",
    data: appointment,
  });
});

exports.createAppointment = catchAsync(async (req, res, next) => {
  const newAppointment = await Appointment.create(req.body);

  res.status(201).json({
    status: "success",
    message: "Appointment created successfully.",
    data: newAppointment,
  });
});

exports.updateAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Appointment updated successfully.",
    data: appointment,
  });
});

exports.deleteAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  res.status(204).json({
    status: "success",
    message: "Appointment deleted successfully.",
    data: null,
  });
});
