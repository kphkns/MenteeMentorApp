const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const db = require('../db');


router.get('/student/dashboard', verifyToken, (req, res) => {
  const userId = req.user.id;

  // Example: Fetch student data using id
  db.query('SELECT * FROM student WHERE Student_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    return res.status(200).json({ student: results[0] });
  });
});

module.exports = router;
