const express = require('express');
const router = express.Router();
const db = require('../db'); // Your MySQL connection

// Get all batches
router.get('/batchess', (req, res) => {
  const sql = 'SELECT Batch_id, batch_name FROM batch';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching batches:', err);
      return res.status(500).json({ message: 'Database query error' });
    }
    res.json(results);
  });
});

// Get all departments
router.get('/departmentss', (req, res) => {
  const sql = 'SELECT Dept_id, Dept_name FROM department';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching departments:', err);
      return res.status(500).json({ message: 'Database query error' });
    }
    res.json(results);
  });
});

router.get('/coursess', (req, res) => {
  const deptId = req.query.dept;

  let sql = 'SELECT Course_ID, Course_name, Dept_ID FROM course';
  const params = [];

  if (deptId) {
    sql += ' WHERE Dept_ID = ?';
    params.push(deptId);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching courses:', err);
      return res.status(500).json({ message: 'Database query error' });
    }
    res.json(results);
  });
});

// GET courses by department
router.get('/courses-by-dept/:deptId', (req, res) => {
  const { deptId } = req.params;
  const sql = 'SELECT Course_ID, Course_name FROM course WHERE Dept_ID = ?';
  db.query(sql, [deptId], (err, results) => {
    if (err) {
      console.error('Error fetching courses by department:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});



// Get students with optional filters batch, dept, course
router.get('/studentss', (req, res) => {
  const { batch, dept, course } = req.query;

  let sql = `
    SELECT 
      Student_id, Name, Roll_no, Email, mobile_no, password, Address, photo, 
      Batch, Dept_ID, Course_ID, Faculty_id, status, Last_login 
    FROM student 
    WHERE 1
  `;
  const params = [];

  if (batch) {
    sql += ' AND Batch = ?';
    params.push(batch);
  }

  if (dept) {
    sql += ' AND Dept_ID = ?';
    params.push(dept);
  }

  if (course) {
    sql += ' AND Course_ID = ?';
    params.push(course);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching students:', err);
      return res.status(500).json({ message: 'Database query error' });
    }
    res.json(results);
  });
});

// Update student status
router.put('/update-status', (req, res) => {
  const { studentIds, status } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0 || status === undefined) {
    return res.status(400).json({ success: false, message: 'Missing or invalid studentIds or status' });
  }

  const placeholders = studentIds.map(() => '?').join(',');
  const sql = `UPDATE student SET status = ? WHERE Student_id IN (${placeholders})`;

  db.query(sql, [status, ...studentIds], (err, result) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }

    res.json({ success: true, message: 'Status updated successfully' });
  });
});

module.exports = router;
