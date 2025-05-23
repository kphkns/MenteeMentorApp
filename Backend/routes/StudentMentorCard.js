const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

// GET student mentor card with student info + faculty + course
router.get('/student-mentor-card', verifyToken, (req, res) => {
  const studentId = req.user.id;

  const query = `
    SELECT 
      s.Name AS student_name,
      s.Roll_no,
      s.Email,
      s.mobile_no,
      s.Address,
      c.Course_name AS course_name,
      f.Name AS faculty_name,
      f.Email AS faculty_email,
      f.mobile_no AS faculty_mobile,
      m.*
    FROM student s
    LEFT JOIN mentor_card m ON s.Student_id = m.student_id
    LEFT JOIN course c ON s.Course_ID = c.Course_ID
    LEFT JOIN faculty f ON s.Faculty_id = f.Faculty_id
    WHERE s.Student_id = ?
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Data not found' });
    }

    res.json(results[0]);
  });
});

// GET monitoring sessions for the logged-in student
router.get('/student-monitoring-sessions', verifyToken, (req, res) => {
  const studentId = req.user.id;

  const query = `
    SELECT 
      m_id, 
      date_of_monitoring, 
      high_points, 
      student_id, 
      faculty_id, 
      appointment_id, 
      created_at, 
      updated_at 
    FROM monitoring_session 
    WHERE student_id = ?
    ORDER BY date_of_monitoring DESC
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching monitoring sessions:', err);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to fetch monitoring sessions' 
      });
    }

    // Return empty array if no sessions found (not a 404 error)
    res.json(results);
  });
});

module.exports = router;
