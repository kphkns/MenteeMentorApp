const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000; // ✅ Use environment port

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:19006', // ✅ Use environment variable
  credentials: true
}));
app.use(bodyParser.json());

// ✅ Serve uploaded files with proper path
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key', // ✅ Use environment variable
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // ✅ Secure cookies in production
    maxAge: 1000 * 60 * 60 * 2
  }
}));

// Routes (✅ Fixed relative paths)
const loginRoute = require('./routes/Login');
app.use('/login', loginRoute);

const dashboardRoutes = require('./routes/Dashboard');
app.use('/', dashboardRoutes);

const logoutRoute = require('./routes/Logout');
app.use('/', logoutRoute);

const studentRoutes = require('./routes/StudentProfile');
app.use('/', studentRoutes);

const adminRoutes = require('./routes/AdminProfile');
app.use('/', adminRoutes);

const adminDepartmentRoutes = require('./routes/AdminManage/DepatmentManage');
app.use('/admin', adminDepartmentRoutes);

const facultyProfileRoutes = require('./routes/FacultyProfile');
app.use('/', facultyProfileRoutes);

const FacultyMentorcards = require('./routes/FacultyMentorcards');
app.use('/', FacultyMentorcards);

const mentorCardRoutes = require('./routes/MentorCard');
app.use('/mentor-card', mentorCardRoutes);

const studentMentorCardRoute = require('./routes/StudentMentorCard');
app.use('/api', studentMentorCardRoute);

const appointmentRoutes = require('./routes/Appointments');
app.use('/api/appointments', appointmentRoutes);

const facultyAppointmentsRoutes = require('./routes/FacultyAppointments');
app.use('/api/faculty', facultyAppointmentsRoutes);

const adminStudentStatusRoutes = require('./routes/AdminStudentStatus');
app.use('/admin', adminStudentStatusRoutes);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
