const express = require('express');
const mongoose = require('mongoose');
const app = express();

// MongoDB connection
mongoose.connect('mongodb+srv://ayesha20231853:JevNZPu4IoWtr9C7@cluster1.zibbe.mongodb.net/meditrack?retryWrites=true&w=majority&appName=Cluster1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema definitions
const doctorSchema = new mongoose.Schema({
  name: String,
  specialization: String,
  availability: [
    {
      date: String,
      slots: [String], // Time slots available for appointments
    },
  ],
}, { collection: 'doctor_availability' });

const appointmentSchema = new mongoose.Schema({
  doctorName: String,
  patientName: String,
  patientPhone: String,
  date: String,
  timeSlot: String,
}, { collection: 'appointments' });

const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Routes
app.use(express.json());

// Add a new doctor with availability
app.post('/doctors', async (req, res) => {
  const doctor = new Doctor(req.body);
  await doctor.save();
  res.status(201).send(doctor);
});

// Get available time slots for a doctor by name
app.get('/doctors/:name/availability', async (req, res) => {
  const doctor = await Doctor.findOne({ name: req.params.name });
  if (!doctor) return res.status(404).send({ error: 'Doctor not found' });
  res.send(doctor.availability);
});

// Book an appointment for a doctor by name
app.post('/appointments', async (req, res) => {
  const { doctorName, date, timeSlot, patientName, patientPhone } = req.body;

  // Check doctor availability for the selected time slot
  const doctor = await Doctor.findOne({ name: doctorName });
  if (!doctor) return res.status(404).send({ error: 'Doctor not found' });

  const dayAvailability = doctor.availability.find(avail => avail.date === date);
  if (!dayAvailability || !dayAvailability.slots.includes(timeSlot)) {
    return res.status(400).send({ error: 'Time slot not available' });
  }

  // Create and save the appointment
  const appointment = new Appointment({ doctorName, patientName, patientPhone, date, timeSlot });
  await appointment.save();

  // Update doctor availability by removing the booked time slot
  dayAvailability.slots = dayAvailability.slots.filter(slot => slot !== timeSlot);
  await doctor.save();

  res.status(201).send(appointment);
});

// Get all appointments for a specific doctor by name
app.get('/appointments/doctor/:name', async (req, res) => {
  const appointments = await Appointment.find({ doctorName: req.params.name });
  res.send(appointments);
});

// Start server
app.listen(5000, () => console.log('Appointment Scheduling Service running on port 5000'));
