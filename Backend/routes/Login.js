const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');

const JWT_SECRET = 'your_super_secret_key';

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
      const user = results[0];
      const payload = {
        id: user.id || user.Student_id || user.Faculty_id || user.Admin_id,
        email: user.Email,
        userType: userType,
      };

      // Sign token
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

      return res.status(200).json({
        message: `${userType} login successful`,
        token: token, // ⬅️ Send token
        user: payload
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  });
});

module.exports = router;
