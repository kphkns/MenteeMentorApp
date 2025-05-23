const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust path if needed

// GET mentor card by student ID
router.get('/:student_id', (req, res) => {
  const { student_id } = req.params;

  const query = `SELECT * FROM mentor_card WHERE student_id = ?`;
  db.query(query, [student_id], (err, results) => {
    if (err) {
      console.error('Error fetching mentor card:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No mentor card found for this student.' });
    }

    res.json(results[0]);
  });
});

// GET monitoring sessions by student ID
router.get('/monitoring-session/:student_id', (req, res) => {
  const { student_id } = req.params;

  const query = `
    SELECT m_id, date_of_monitoring, high_points, student_id, faculty_id, appointment_id, created_at, updated_at
    FROM monitoring_session
    WHERE student_id = ?
  `;

  db.query(query, [student_id], (err, results) => {
    if (err) {
      console.error('Error fetching monitoring sessions:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No monitoring sessions found for this student.' });
    }

    res.json(results);
  });
});


// PUT update mentor card by student ID
router.put('/:student_id', (req, res) => {
  const { student_id } = req.params;
  const data = req.body;

  const query = `
    UPDATE mentor_card SET
      name_of_localgurdian = ?, moble_no_of_localgurdent = ?, mobile_no_of_parents = ?, 
      name_of_pareents = ?, present_address = ?, email_of_parents = ?, any_helthissue = ?,

      sgpa_sem1 = ?, sgpa_sem2 = ?, sgpa_sem3 = ?, sgpa_sem4 = ?, sgpa_sem5 = ?,
      sgpa_sem6 = ?, sgpa_sem7 = ?, sgpa_sem8 = ?, sgpa_sem9 = ?, sgpa_sem10 = ?,

      cgpa_sem1 = ?, cgpa_sem2 = ?, cgpa_sem3 = ?, cgpa_sem4 = ?, cgpa_sem5 = ?,
      cgpa_sem6 = ?, cgpa_sem7 = ?, cgpa_sem8 = ?, cgpa_sem9 = ?, cgpa_sem10 = ?,

      co_curricular_sem1 = ?, co_curricular_sem2 = ?, co_curricular_sem3 = ?, co_curricular_sem4 = ?, co_curricular_sem5 = ?,
      co_curricular_sem6 = ?, co_curricular_sem7 = ?, co_curricular_sem8 = ?, co_curricular_sem9 = ?, co_curricular_sem10 = ?,

      difficulty_faced_sem1 = ?, difficulty_faced_sem2 = ?, difficulty_faced_sem3 = ?, difficulty_faced_sem4 = ?, difficulty_faced_sem5 = ?,
      difficulty_faced_sem6 = ?, difficulty_faced_sem7 = ?, difficulty_faced_sem8 = ?, difficulty_faced_sem9 = ?, difficulty_faced_sem10 = ?,

      disciplinary_action_sem1 = ?, disciplinary_action_sem2 = ?, disciplinary_action_sem3 = ?, disciplinary_action_sem4 = ?, disciplinary_action_sem5 = ?,
      disciplinary_action_sem6 = ?, disciplinary_action_sem7 = ?, disciplinary_action_sem8 = ?, disciplinary_action_sem9 = ?, disciplinary_action_sem10 = ?

    WHERE student_id = ?`;

  const values = [
    data.name_of_localgurdian, data.moble_no_of_localgurdent, data.mobile_no_of_parents,
    data.name_of_pareents, data.present_address, data.email_of_parents, data.any_helthissue,

    data.sgpa_sem1, data.sgpa_sem2, data.sgpa_sem3, data.sgpa_sem4, data.sgpa_sem5,
    data.sgpa_sem6, data.sgpa_sem7, data.sgpa_sem8, data.sgpa_sem9, data.sgpa_sem10,

    data.cgpa_sem1, data.cgpa_sem2, data.cgpa_sem3, data.cgpa_sem4, data.cgpa_sem5,
    data.cgpa_sem6, data.cgpa_sem7, data.cgpa_sem8, data.cgpa_sem9, data.cgpa_sem10,

    data.co_curricular_sem1, data.co_curricular_sem2, data.co_curricular_sem3, data.co_curricular_sem4, data.co_curricular_sem5,
    data.co_curricular_sem6, data.co_curricular_sem7, data.co_curricular_sem8, data.co_curricular_sem9, data.co_curricular_sem10,

    data.difficulty_faced_sem1, data.difficulty_faced_sem2, data.difficulty_faced_sem3, data.difficulty_faced_sem4, data.difficulty_faced_sem5,
    data.difficulty_faced_sem6, data.difficulty_faced_sem7, data.difficulty_faced_sem8, data.difficulty_faced_sem9, data.difficulty_faced_sem10,

    data.disciplinary_action_sem1, data.disciplinary_action_sem2, data.disciplinary_action_sem3, data.disciplinary_action_sem4, data.disciplinary_action_sem5,
    data.disciplinary_action_sem6, data.disciplinary_action_sem7, data.disciplinary_action_sem8, data.disciplinary_action_sem9, data.disciplinary_action_sem10,

    student_id
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating mentor card:', err);
      return res.status(500).json({ message: 'Failed to update mentor card.' });
    }
    res.json({ message: 'Mentor card updated successfully.' });
  });
});


module.exports = router;
