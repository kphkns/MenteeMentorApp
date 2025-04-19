// server.js
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

// Configure session
app.use(session({
  secret: 'your-secret-key', // 🔒 Use env variable in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true only if using HTTPS
    maxAge: 1000 * 60 * 60 * 2 // 2 hours
  }
}));

// Routes
const loginRoute = require('./routes/Login');
app.use('/login', loginRoute);

const dashboardRoutes = require('./routes/Dashboard');
app.use('/', dashboardRoutes);

const logoutRoute = require('./routes/Logout');
app.use('/', logoutRoute);


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
