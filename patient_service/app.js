// app.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// MongoDB connection
mongoose.connect('mongodb+srv://ayesha20231853:JevNZPu4IoWtr9C7@cluster1.zibbe.mongodb.net/meditrack?retryWrites=true&w=majority&appName=Cluster1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema definition
const patientSchema = new mongoose.Schema({
  phone_number : Number, 
  name: String,
  age: Number,
  medicalHistory: Array,
},{ collection: 'patient_records' });

const Patient = mongoose.model('Patient', patientSchema);

// Routes
app.use(express.json());

app.post('/patients', async (req, res) => {
  const patient = new Patient(req.body);
  await patient.save();
  res.status(201).send(patient);
});

app.get('/patients/:phone_number', async (req, res) => {
  const patients = await Patient.find({ phone_number: req.params.phone_number });
  res.send(patients);
});

// Start server
app.listen(3000, () => console.log('Patient service running on port 3000'));
