// app.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const nodemailer = require('nodemailer');

// MongoDB connection
mongoose.connect('mongodb+srv://ayesha20231853:JevNZPu4IoWtr9C7@cluster1.zibbe.mongodb.net/meditrack?retryWrites=true&w=majority&appName=Cluster1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema definitions
const appointmentSchema = new mongoose.Schema({
  doctorName: String,
  patientName: String,
  patientEmail: String,
  patientPhone: String,
  date: String,
  timeSlot: String,
  reminderSent: { type: Boolean, default: false },
}, { collection: 'appointments' });

const reminderSchema = new mongoose.Schema({
  appointmentId: mongoose.Schema.Types.ObjectId,
  patientName: String,
  patientEmail: String,
  reminderTime: Date,
  status: { type: String, enum: ['Sent', 'Failed'], default: 'Sent' },
  errorMessage: { type: String, default: null },
}, { collection: 'reminders' });

const Appointment = mongoose.model('Appointment', appointmentSchema);
const Reminder = mongoose.model('Reminder', reminderSchema);

// Middleware
app.use(express.json());

// SMTP configuration for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'meditrack@gmail.com', 
    pass: 'ABX@123', 
  },
});

// Endpoint to send reminders for upcoming appointments
app.post('/notifications/reminders', async (req, res) => {
  const { date } = req.body;

  // Fetch appointments for the given date where reminders haven't been sent
  const appointments = await Appointment.find({ date, reminderSent: false });
  if (appointments.length === 0) {
    return res.status(404).send({ message: 'No appointments found for reminders' });
  }

  // Send reminders to patients
  for (const appointment of appointments) {
    const mailOptions = {
      from: 'meditrack@gmail.com',
      to: appointment.patientEmail,
      subject: 'Appointment Reminder',
      text: `Dear ${appointment.patientName},\n\nThis is a reminder for your appointment with Dr. ${appointment.doctorName} on ${appointment.date} at ${appointment.timeSlot}.\n\nThank you!`,
    };

    let reminderStatus = 'Sent';
    let errorMessage = null;

    try {
      await transporter.sendMail(mailOptions);
      appointment.reminderSent = true; // Mark reminder as sent
      await appointment.save();
      console.log(`Reminder sent to ${appointment.patientName}`);
    } catch (error) {
      reminderStatus = 'Failed';
      errorMessage = error.message;
      console.error(`Failed to send reminder to ${appointment.patientName}:`, error);
    }

    // Save reminder details
    const reminder = new Reminder({
      appointmentId: appointment._id,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      reminderTime: new Date(),
      status: reminderStatus,
      errorMessage: errorMessage,
    });
    await reminder.save();
  }

  res.status(200).send({ message: 'Reminders processed' });
});

// Endpoint to get all reminders
app.get('/reminders', async (req, res) => {
  const reminders = await Reminder.find();
  res.send(reminders);
});

// Endpoint to add a new appointment (for testing purposes)
app.post('/appointments', async (req, res) => {
  const appointment = new Appointment(req.body);
  await appointment.save();
  res.status(201).send(appointment);
});

// Start server
app.listen(4000, () => console.log('Notification Service running on port 5000'));
