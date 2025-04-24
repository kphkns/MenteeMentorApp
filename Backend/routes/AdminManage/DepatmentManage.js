// routes/AdminManage.js
const express = require('express');
const router = express.Router();
const db = require('../../db');

//--------------------------------------------------//----------------------------------------------------------------------->
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




//--------------------------------------------------//----------------------------------------------------------------------->

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
//--------------------------------------------------//----------------------------------------------------------------------->
//------------------------ Batch Management ---------------

// ✅ Get all batches
router.get('/batches', (req, res) => {
  const query = 'SELECT Batch_id, batch_name FROM batch ORDER BY batch_name ASC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch batches' });
    res.status(200).json(results);
  });
});

// ✅ Add a new batch with duplicate check
router.post('/batches', (req, res) => {
  const { batch_name } = req.body;

  if (!batch_name || !/^\d{4}$/.test(batch_name)) {
    return res.status(400).json({ message: 'Batch name must be a 4-digit year' });
  }

  // Check duplicate
  db.query('SELECT * FROM batch WHERE batch_name = ?', [batch_name], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Batch name already exists' });
    }

    db.query('INSERT INTO batch (batch_name) VALUES (?)', [batch_name], (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to add batch' });
      res.status(201).json({ message: 'Batch added successfully', Batch_id: result.insertId });
    });
  });
});

// ✅ Update batch
router.put('/batches/:id', (req, res) => {
  const { id } = req.params;
  const { batch_name } = req.body;

  if (!batch_name || !/^\d{4}$/.test(batch_name)) {
    return res.status(400).json({ message: 'Batch name must be a 4-digit year' });
  }

  // Check for duplicate batch name excluding the current batch
  db.query('SELECT * FROM batch WHERE batch_name = ? AND Batch_id != ?', [batch_name, id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Batch name already exists' });
    }

    db.query('UPDATE batch SET batch_name = ? WHERE Batch_id = ?', [batch_name, id], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update batch' });
      res.status(200).json({ message: 'Batch updated successfully' });
    });
  });
});

// ✅ Delete batch
router.delete('/batches/:id', (req, res) => {
  db.query('DELETE FROM batch WHERE Batch_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to delete batch' });
    res.status(200).json({ message: 'Batch deleted successfully' });
  });
});
//---------------------------------------------------//---------------------------------------------------------------------->

//--------------------------------------------------//----------------------------------------------------------------------->

// Utility function to validate email format
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// ✅ Get all faculty members with department names
router.get('/faculty', (req, res) => {
  const query = `
    SELECT f.Faculty_id, f.Name, f.Email, f.Dept_ID, d.Dept_name
    FROM faculty f
    LEFT JOIN department d ON f.Dept_ID = d.Dept_id
    ORDER BY f.Name ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching faculty:', err);
      return res.status(500).json({ message: 'Failed to fetch faculty' });
    }
    res.status(200).json(results);
  });
});

// ✅ Add a new faculty member
router.post('/faculty', (req, res) => {
  const { Name, Email, Dept_ID, Password } = req.body;

  if (!Name || !Email || !Dept_ID || !Password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!isValidEmail(Email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Check for duplicate email
  db.query('SELECT * FROM faculty WHERE Email = ?', [Email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    db.query(
      'INSERT INTO faculty (Name, Email, Dept_ID, Password) VALUES (?, ?, ?, ?)',
      [Name, Email, Dept_ID, Password],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to add faculty' });
        res.status(201).json({ message: 'Faculty added successfully', Faculty_id: result.insertId });
      }
    );
  });
});

// ✅ Update faculty member
router.put('/faculty/:id', (req, res) => {
  const { id } = req.params;
  const { Name, Email, Dept_ID, Password } = req.body;

  if (!Name || !Email || !Dept_ID) {
    return res.status(400).json({ message: 'Name, Email, and Dept_ID are required' });
  }

  if (!isValidEmail(Email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Ensure email is not duplicated for another user
  db.query(
    'SELECT * FROM faculty WHERE Email = ? AND Faculty_id != ?',
    [Email, id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length > 0) {
        return res.status(409).json({ message: 'Email already in use by another faculty' });
      }

      // Prepare query to update faculty
      let updateQuery = 'UPDATE faculty SET Name = ?, Email = ?, Dept_ID = ?';
      let queryParams = [Name, Email, Dept_ID];

      // If password is provided, include it in the query
      if (Password) {
        updateQuery += ', Password = ?';
        queryParams.push(Password);
      }

      updateQuery += ' WHERE Faculty_id = ?';
      queryParams.push(id);

      db.query(updateQuery, queryParams, (err) => {
        if (err) return res.status(500).json({ message: 'Failed to update faculty' });
        res.status(200).json({ message: 'Faculty updated successfully' });
      });
    }
  );
});

// ✅ Delete faculty member
router.delete('/faculty/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM faculty WHERE Faculty_id = ?', [id], (err) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ message: 'Failed to delete faculty' });
    }
    res.status(200).json({ message: 'Faculty deleted successfully' });
  });
});


//--------------------------------------------------//----------------------------------------------------------------------->
// ✅ Get all students (UPDATE THIS QUERY)
router.get('/students', (req, res) => {
  const query = `
    SELECT s.Student_id, s.Name, s.Roll_no, s.Email, s.Batch, 
           s.Dept_ID, d.Dept_name, 
           s.Course_ID, c.Course_name, 
           s.Faculty_id, f.Name AS Faculty_name
    FROM student s
    LEFT JOIN department d ON s.Dept_ID = d.Dept_id
    LEFT JOIN course c ON s.Course_ID = c.Course_ID
    LEFT JOIN faculty f ON s.Faculty_id = f.Faculty_id
    ORDER BY s.Name ASC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch students' });
    res.status(200).json(results);
  });
});

// ✅ Add a new student
router.post('/students', (req, res) => {
  const { Name, Roll_no, Email, Password, Batch, Dept_ID, Course_ID, Faculty_id } = req.body;

  if (!Name || !Roll_no || !Email || !Password || !Batch || !Dept_ID || !Course_ID || !Faculty_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!isValidEmail(Email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Check duplicate email
  db.query('SELECT * FROM student WHERE Email = ?', [Email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const query = `
      INSERT INTO student (Name, Roll_no, Email, Password, Batch, Dept_ID, Course_ID, Faculty_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [Name, Roll_no, Email, Password, Batch, Dept_ID, Course_ID, Faculty_id], (err, result) => {
      if (err) return res.status(500).json({ message: 'Failed to add student' });
      res.status(201).json({ message: 'Student added successfully', Student_id: result.insertId });
    });
  });
});

// ✅ Update student
router.put('/students/:id', (req, res) => {
  const { id } = req.params;
  const { Name, Roll_no, Email, Password, Batch, Dept_ID, Course_ID, Faculty_id } = req.body;

  if (!Name || !Roll_no || !Email || !Batch || !Dept_ID || !Course_ID || !Faculty_id) {
      return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!isValidEmail(Email)) {
      return res.status(400).json({ message: 'Invalid email format' });
  }

  db.query('SELECT * FROM student WHERE Email = ? AND Student_id != ?', [Email, id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Database error' });
      if (results.length > 0) {
          return res.status(409).json({ message: 'Email already in use' });
      }

      let updateQuery = `
          UPDATE student 
          SET Name = ?, Roll_no = ?, Email = ?, Batch = ?, Dept_ID = ?, Course_ID = ?, Faculty_id = ?
      `;
      const params = [Name, Roll_no, Email, Batch, Dept_ID, Course_ID, Faculty_id];

      // If Password is provided, add it to the update query
      if (Password) {
          updateQuery += ', Password = ?';
          params.push(Password);
      }

      updateQuery += ' WHERE Student_id = ?';
      params.push(id);

      db.query(updateQuery, params, (err) => {
          if (err) return res.status(500).json({ message: 'Failed to update student' });
          res.status(200).json({ message: 'Student updated successfully' });
      });
  });
});
// ✅ Delete student
router.delete('/students/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM student WHERE Student_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Failed to delete student' });
    res.status(200).json({ message: 'Student deleted successfully' });
  });
});
//---------------------------------------------------------------------------------//----------------------------->

module.exports = router;