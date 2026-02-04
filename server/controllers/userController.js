const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");
const moment = require("moment");
const Doctor = require("../models/doctorModel");

exports.verifyUser = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "User verified successfully.",
    data: req.user,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  const filteredUsers = users.map((user) => {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin,
      isDoctor: user.isDoctor,
    };
  });

  res.status(200).json({
    status: "success",
    message: "Users fetched successfully.",
    data: filteredUsers,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).json({
    status: "success",
    message: "User fetched successfully.",
    data: user,
  });
});

exports.bookAppointment = catchAsync(async (req, res, next) => {
  req.body.status = "pending";
  req.body.date = moment(req.body.date).startOf("day").toDate();
  req.body.time = moment(req.body.time).toDate();
  req.body.documents = req.body.documents || [];

  const newAppointment = new Appointment(req.body);
  await newAppointment.save();

  // Find doctor and send notification
  const user = await User.findById(req.body.doctorInfo.userId);
  user.unseenNotifications.push({
    type: "new-appointment-request",
    message: `A new appointment request has been made by ${req.body.userInfo.name}`,
    data: {
      name: req.body.userInfo.name,
    },
    onClickPath: "/doctor/appointments",
  });
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Appointment booked successfully.",
  });
});

exports.userAppointments = catchAsync(async (req, res, next) => {
  const appointments = await Appointment.find({
    userId: req.params.id,
  });

  res.status(200).json({
    status: "success",
    message: "Appointments fetched successfully.",
    data: appointments,
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  // 1) Find USer Delete User
  await User.findByIdAndDelete(userId);
  // 2) Delete Doctor
  await Doctor.findOneAndDelete({ userId });
  // 3) Delete associated appointments
  await Appointment.deleteMany({ doctorId: userId });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.notificationSeen = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const unseenNotifications = user.unseenNotifications;
  user.seenNotifications = unseenNotifications;

  user.unseenNotifications = [];

  const updatedUser = await user.save();
  updatedUser.password = undefined;

  res.status(200).send({
    status: true,
    message: "All notifications seen",
    data: updatedUser,
  });
});

exports.deleteNotifications = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  user.seenNotifications = [];
  user.unseenNotifications = [];

  const updatedUser = await user.save();
  updatedUser.password = undefined;

  res.status(200).send({
    status: true,
    message: "All notifications deleted",
    data: updatedUser,
  });
});

exports.uploadDocuments = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError("Please upload at least one document", 400));
  }

  const files = req.files.map((file) => ({
    originalName: file.originalname,
    fileName: file.filename,
    path: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
  }));

  res.status(200).json({
    status: "success",
    data: files,
  });
});

exports.cancelAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) return next(new AppError("Appointment not found", 404));

  if (appointment.userId !== req.user._id.toString()) {
    return next(new AppError("You are not allowed to cancel this booking", 403));
  }

  if (!["pending", "approved", "rescheduled"].includes(appointment.status)) {
    return next(new AppError("This appointment cannot be cancelled", 400));
  }

  appointment.status = "cancelled";
  await appointment.save();

  const doctorUser = await User.findById(appointment.doctorInfo?.userId);
  if (doctorUser) {
    doctorUser.unseenNotifications.push({
      type: "appointment-cancelled",
      message: `Appointment cancelled by ${appointment.userInfo?.name}`,
      data: {
        name: appointment.userInfo?.name,
      },
      onClickPath: "/doctor/appointments",
    });
    await doctorUser.save();
  }

  res.status(200).json({
    status: "success",
    message: "Appointment cancelled successfully.",
  });
});

exports.rescheduleAppointment = catchAsync(async (req, res, next) => {
  const { date, time } = req.body;

  if (!date || !time) {
    return next(new AppError("Please provide a new date and time", 400));
  }

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError("Appointment not found", 404));

  if (appointment.userId !== req.user._id.toString()) {
    return next(
      new AppError("You are not allowed to reschedule this booking", 403)
    );
  }

  if (!["pending", "approved", "rescheduled"].includes(appointment.status)) {
    return next(new AppError("This appointment cannot be rescheduled", 400));
  }

  appointment.date = moment(date).startOf("day").toDate();
  appointment.time = moment(time).toDate();
  appointment.status = "rescheduled";
  await appointment.save();

  const doctorUser = await User.findById(appointment.doctorInfo?.userId);
  if (doctorUser) {
    doctorUser.unseenNotifications.push({
      type: "appointment-rescheduled",
      message: `Appointment rescheduled by ${appointment.userInfo?.name}`,
      data: {
        name: appointment.userInfo?.name,
      },
      onClickPath: "/doctor/appointments",
    });
    await doctorUser.save();
  }

  res.status(200).json({
    status: "success",
    message: "Appointment rescheduled successfully.",
  });
});

exports.doctorStatus = catchAsync(async (req, res, next) => {
  const { doctorId, status, userId } = req.body;

  const doctor = await Doctor.findByIdAndUpdate(doctorId, { status });
  if (!doctor) return next(new AppError("Doctor not found", 404));

  // Send Notification To User
  const user = await User.findById(userId);
  const unseenNotifications = user.unseenNotifications;
  unseenNotifications.push({
    type: "new-doctor-request-changed",
    message: `Your doctor request has been ${status}`,
    data: {
      name: user.name,
      doctorId: user._id,
    },
    onClickPath: "/notifications",
  });
  user.isDoctor = status === "approved" ? true : false;
  await user.save();

  const doctors = await Doctor.find();

  res.status(200).send({
    status: true,
    message: "Doctor status changed successfully",
    data: doctors,
  });
});
