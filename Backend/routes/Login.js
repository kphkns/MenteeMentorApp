const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');

const JWT_SECRET = 'your_super_secret_key';

router.post('/', (req, res) => {
  const { email, password, userType } = req.body;

  if (!email || !password || !userType) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  // Normalize user type
  const userTypeNormalized = userType.toLowerCase();
  let table, idField;

  if (userTypeNormalized === 'student') {
    table = 'student';
    idField = 'Student_id';
  } else if (userTypeNormalized === 'faculty') {
    table = 'faculty';
    idField = 'Faculty_id';
  } else if (userTypeNormalized === 'admin') {
    table = 'admin';
    idField = 'Admin_id';
  } else {
    return res.status(400).json({ message: 'Invalid user type' });
  }

  const query = `SELECT * FROM ${table} WHERE Email = ? AND password = ?`;

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const userId = user[idField];

    const payload = {
      id: userId,
      email: user.Email,
      userType: userTypeNormalized.charAt(0).toUpperCase() + userTypeNormalized.slice(1),
    };

    // ✅ Update Last_login for student or admin
    if (userTypeNormalized === 'student' || userTypeNormalized === 'admin') {
      const updateQuery = `UPDATE ${table} SET Last_login = NOW() WHERE ${idField} = ?`;
      db.query(updateQuery, [userId], (updateErr) => {
        if (updateErr) {
          console.error(`Error updating last login for ${userType}:`, updateErr);
          // Just log error, don't block login
        }
      });
    }

    // ✅ Create and return JWT
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });

    return res.status(200).json({
      message: `${payload.userType} login successful`,
      token,
      user: payload
    });
  });
});

module.exports = router;