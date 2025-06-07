const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key'; // ✅ Use environment variable

router.post('/', (req, res) => {
  const { email, password, userType } = req.body;

  // ✅ Better validation
  if (!email || !password || !userType) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing credentials',
      error: 'Email, password, and user type are required'
    });
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
    return res.status(400).json({ 
      success: false,
      message: 'Invalid user type',
      error: 'User type must be Student, Faculty, or Admin'
    });
  }

  const query = `SELECT * FROM ${table} WHERE Email = ? AND password = ?`;

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Server error',
        error: 'Database connection failed'
      });
    }

    if (results.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password',
        error: 'Authentication failed'
      });
    }

    const user = results[0];
    const userId = user[idField];

    const payload = {
      id: userId,
      email: user.Email,
      userType: userTypeNormalized.charAt(0).toUpperCase() + userTypeNormalized.slice(1),
    };

    // ✅ Update Last_login for all user types
    const updateQuery = `UPDATE ${table} SET Last_login = NOW() WHERE ${idField} = ?`;
    db.query(updateQuery, [userId], (updateErr) => {
      if (updateErr) {
        console.error(`Error updating last login for ${userType}:`, updateErr);
      }
    });

    try {
      // ✅ Create JWT with error handling
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
      
      console.log('Login successful for:', payload.email); // ✅ Debug log

      return res.status(200).json({
        success: true,
        message: `${payload.userType} login successful`,
        token: token, // ✅ Ensure token is included
        user: payload,
      });
    } catch (jwtError) {
      console.error('JWT creation error:', jwtError);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: 'Token generation failed'
      });
    }
  });
});

module.exports = router;
