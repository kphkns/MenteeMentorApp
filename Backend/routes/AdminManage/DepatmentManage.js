// routes/AdminManage.js
const express = require('express');
const router = express.Router();
const db = require('../../db');


//------------------------Add a department ---------------
// ✅ Get all departments
router.get('/departments', (req, res) => {
  const query = 'SELECT Dept_id, Dept_name FROM department';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    res.status(200).json(results);
  });
});

// ✅ Add a department
router.post('/departments', (req, res) => {
  const { Dept_name } = req.body;
  if (!Dept_name) return res.status(400).json({ message: 'Department name required' });

  const query = 'INSERT INTO department (Dept_name) VALUES (?)';
  db.query(query, [Dept_name], (err, result) => {
    if (err) return res.status(500).json({ message: 'Failed to add department' });
    res.status(201).json({ message: 'Department added successfully', id: result.insertId });
  });
});

// ✅ Update a department
router.put('/departments/:id', (req, res) => {
  const { id } = req.params;
  const { Dept_name } = req.body;
  if (!Dept_name) return res.status(400).json({ message: 'New name required' });

  const query = 'UPDATE department SET Dept_name = ? WHERE Dept_id = ?';
  db.query(query, [Dept_name, id], (err) => {
    if (err) return res.status(500).json({ message: 'Update failed' });
    res.status(200).json({ message: 'Department updated successfully' });
  });
});

// ✅ Delete a department
router.delete('/departments/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM department WHERE Dept_id = ?';

  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ message: 'Delete failed' });
    res.status(200).json({ message: 'Department deleted successfully' });
  });
});




//---------------------------------------------------//--------------------------

// ✅ Add a course to a department

// ✅ GET all courses
router.get('/courses', (req, res) => {
  const query = 'SELECT Course_ID, Course_name, Dept_ID FROM course';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(200).json(results);
  });
});

// ✅ GET all departments (for dropdown)
router.get('/departments', (req, res) => {
  db.query('SELECT Dept_id, Dept_name FROM department', (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(200).json(results);
  });
});

// ✅ ADD new course
router.post('/courses', (req, res) => {
  const { Course_name, Dept_ID } = req.body;
  if (!Course_name || !Dept_ID) return res.status(400).json({ message: 'Missing fields' });

  db.query(
    'INSERT INTO course (Course_name, Dept_ID) VALUES (?, ?)',
    [Course_name, Dept_ID],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to add course' });
      res.status(201).json({ message: 'Course added successfully', id: result.insertId });
    }
  );
});

// ✅ UPDATE course
router.put('/courses/:id', (req, res) => {
  const { id } = req.params;
  const { Course_name, Dept_ID } = req.body;

  if (!Course_name || !Dept_ID) return res.status(400).json({ message: 'Missing fields' });

  db.query(
    'UPDATE course SET Course_name = ?, Dept_ID = ? WHERE Course_ID = ?',
    [Course_name, Dept_ID, id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update course' });
      res.status(200).json({ message: 'Course updated successfully' });
    }
  );
});

// ✅ DELETE course
router.delete('/courses/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM course WHERE Course_ID = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to delete course' });
    res.status(200).json({ message: 'Course deleted successfully' });
  });
});

//------------------------ Batch Management ---------------

module.exports = router;