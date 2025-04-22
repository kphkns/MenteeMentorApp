const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const port = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:19006', // or your Expo dev URL
  credentials: true
}));
app.use(bodyParser.json());

// ✅ Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Configure session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 2 // 2 hours
  }
}));

// Routes
//login
const loginRoute = require('./routes/Login');
app.use('/login', loginRoute);
//Dashbord
const dashboardRoutes = require('./routes/Dashboard');
app.use('/', dashboardRoutes);
//logout
const logoutRoute = require('./routes/Logout');
app.use('/', logoutRoute);
//student profile
const studentRoutes = require('../Backend/routes/StudentProfile');
app.use('/', studentRoutes);
//admin profile
const adminRoutes = require('./routes/AdminProfile');
app.use('/', adminRoutes);
//admin department management 
const adminDepartmentRoutes = require('./routes/AdminManage/DepatmentManage');
app.use('/admin', adminDepartmentRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
