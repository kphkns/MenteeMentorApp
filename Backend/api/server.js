const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:19006', // Replace with your Expo or frontend dev URL
  credentials: true
}));
app.use(bodyParser.json());

// ✅ Serve uploaded files
app.use('/uploads', express.static('uploads'));


// Session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 2
  }
}));

// Routes
const loginRoute = require('../routes/Login');
app.use('/login', loginRoute);

const dashboardRoutes = require('../routes/Dashboard');
app.use('/', dashboardRoutes);

const logoutRoute = require('../routes/Logout');
app.use('/', logoutRoute);

const studentRoutes = require('../routes/StudentProfile');
app.use('/', studentRoutes);

const adminRoutes = require('../routes/AdminProfile');
app.use('/', adminRoutes);

const adminDepartmentRoutes = require('../routes/AdminManage/DepatmentManage');
app.use('/admin', adminDepartmentRoutes);

const facultyProfileRoutes = require('../routes/FacultyProfile');
app.use('/', facultyProfileRoutes);

const FacultyMentorcards = require('../routes/FacultyMentorcards');
app.use('/', FacultyMentorcards);

const mentorCardRoutes = require('../routes/MentorCard');
app.use('/mentor-card', mentorCardRoutes);

const studentMentorCardRoute = require('../routes/StudentMentorCard');
app.use('/api', studentMentorCardRoute);

const appointmentRoutes = require('../routes/Appointments');
app.use('/api/appointments', appointmentRoutes);

const facultyAppointmentsRoutes = require('../routes/FacultyAppointments');
app.use('/api/faculty', facultyAppointmentsRoutes);

const adminStudentStatusRoutes = require('../routes/AdminStudentStatus');
app.use('/admin', adminStudentStatusRoutes);

const authRoutes = require('../routes/auth');
app.use('/auth', authRoutes);



// const messageRoutes = require('./routes/messages');
// app.use('/api/messages', messageRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
