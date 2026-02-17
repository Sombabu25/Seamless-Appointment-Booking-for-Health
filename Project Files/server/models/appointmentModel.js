const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "Please provide User Id"],
    },
    doctorId: {
      type: String,
      required: [true, "Please provide Doctor Id"],
    },
    userInfo: {
      type: Object,
      required: [true, "Please provide User details"],
    },
    doctorInfo: {
      type: Object,
      required: [true, "Please provide Doctor details"],
    },
    date: {
      type: Date,
      required: [true, "Please provide date"],
    },
    time: {
      type: Date,
      required: [true, "Please provide time"],
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    documents: [
      {
        originalName: String,
        fileName: String,
        path: String,
        mimetype: String,
        size: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Appointment = new mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
