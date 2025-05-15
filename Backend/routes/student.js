const express = require('express');
const router = express.Router();
const db = require('../db'); // your db connection

// GET /api/student/:id
router.get('/:id', async (req, res) => {
  const studentId = req.params.id;

  try {
    const [rows] = await db.query(
      'SELECT Student_id, Name, Faculty_id FROM student WHERE Student_id = ?',
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
