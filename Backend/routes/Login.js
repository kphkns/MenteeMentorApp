const express = require('express');
const router = express.Router();
const db = require('../db'); // 👈 Importing the shared db

router.post('/', (req, res) => {
  const { email, password, userType } = req.body;

  let table;
  if (userType === 'Student') table = 'student';
  else if (userType === 'Faculty') table = 'faculty';
  else if (userType === 'Admin') table = 'admin';
  else return res.status(400).json({ message: 'Invalid user type' });

  const query = `SELECT * FROM ${table} WHERE Email = ? AND password = ?`;

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      return res.status(200).json({
        message: `${userType} login successful`,
        user: results[0]
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  });
});

module.exports = router;
