// app.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// MongoDB connection
mongoose.connect('mongodb+srv://ayesha20231853:JevNZPu4IoWtr9C7@cluster1.zibbe.mongodb.net/meditrack?retryWrites=true&w=majority&appName=Cluster1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema definitions
const appointmentSchema = new mongoose.Schema({
  doctorName: String,
  patientName: String,
  date: String,
  timeSlot: String,
  symptoms: [String], // List of symptoms reported by the patient
  specialty: String,  // Doctor's specialization
}, { collection: 'appointments' });

const aggregatedDataSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  appointmentsPerDoctor: Object, // { doctorName: count }
  appointmentsOverTime: Object, // { date: count }
  symptomsBySpecialty: Object,  // { specialty: { symptom: count } }
}, { collection: 'aggregated_data' });

const Appointment = mongoose.model('Appointment', appointmentSchema);
const AggregatedData = mongoose.model('AggregatedData', aggregatedDataSchema);

// Aggregation function
async function aggregateData() {
  console.log('Running data aggregation...');

  try {
    // Count appointments per doctor
    const appointmentsPerDoctor = await Appointment.aggregate([
      { $group: { _id: "$doctorName", count: { $sum: 1 } } }
    ]);

    // Count appointments over time
    const appointmentsOverTime = await Appointment.aggregate([
      { $group: { _id: "$date", count: { $sum: 1 } } }
    ]);

    // Count common symptoms by specialty
    const symptomsBySpecialty = await Appointment.aggregate([
      { $unwind: "$symptoms" },
      { $group: { _id: { specialty: "$specialty", symptom: "$symptoms" }, count: { $sum: 1 } } },
      { $group: {
        _id: "$_id.specialty",
        symptoms: { $push: { symptom: "$_id.symptom", count: "$count" } }
      }}
    ]);

    // Transform data for storage
    const formattedAppointmentsPerDoctor = {};
    appointmentsPerDoctor.forEach(item => {
      formattedAppointmentsPerDoctor[item._id] = item.count;
    });

    const formattedAppointmentsOverTime = {};
    appointmentsOverTime.forEach(item => {
      formattedAppointmentsOverTime[item._id] = item.count;
    });

    const formattedSymptomsBySpecialty = {};
    symptomsBySpecialty.forEach(item => {
      formattedSymptomsBySpecialty[item._id] = {};
      item.symptoms.forEach(symptomData => {
        formattedSymptomsBySpecialty[item._id][symptomData.symptom] = symptomData.count;
      });
    });

    // Save aggregated data to the database
    const aggregatedData = new AggregatedData({
      appointmentsPerDoctor: formattedAppointmentsPerDoctor,
      appointmentsOverTime: formattedAppointmentsOverTime,
      symptomsBySpecialty: formattedSymptomsBySpecialty,
    });

    await aggregatedData.save();
    console.log('Data aggregation completed and saved.');
  } catch (error) {
    console.error('Error during data aggregation:', error);
  }
}

// Route to trigger aggregation manually
app.post('/run-aggregation', async (req, res) => {
  console.log('Received request to run aggregation.');
  await aggregateData();
  res.send({ message: 'Aggregation job completed.' });
});

// Route to fetch the latest aggregated data
app.get('/aggregated-data', async (req, res) => {
  const data = await AggregatedData.find().sort({ timestamp: -1 }).limit(1); // Fetch the latest aggregated data
  res.send(data);
});

// Start server
app.listen(6000, () => console.log('Aggregator Service running on port 6000'));
