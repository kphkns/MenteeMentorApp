const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(bodyParser.json());

// Routes
const loginRoute = require('./routes/Login');
app.use('/login', loginRoute);

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
