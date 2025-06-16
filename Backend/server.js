const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:19006',
  credentials: true
}));
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 2
  }
}));

// Routes
app.use('/login', require('./routes/Login'));
app.use('/', require('./routes/Dashboard'));
app.use('/', require('./routes/Logout'));
app.use('/', require('./routes/StudentProfile'));
app.use('/', require('./routes/FacultyProfile'));
app.use('/', require('./routes/FacultyMentorcards'));
app.use('/mentor-card', require('./routes/MentorCard'));
app.use('/api', require('./routes/StudentMentorCard'));
app.use('/api/appointments', require('./routes/Appointments'));
app.use('/api/faculty', require('./routes/FacultyAppointments'));
app.use('/admin', require('./routes/AdminProfile'));
app.use('/admin', require('./routes/AdminManage/DepatmentManage'));
app.use('/admin', require('./routes/AdminStudentStatus'));
app.use('/auth', require('./routes/auth'));

// Optional DB test route
const db = require('./db');
app.get('/test-db', (req, res) => {
  db.query('SELECT NOW() AS current_time', (err, result) => {
    if (err) return res.status(500).send('❌ DB Error');
    res.send(`✅ DB Time: ${result[0].current_time}`);
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
