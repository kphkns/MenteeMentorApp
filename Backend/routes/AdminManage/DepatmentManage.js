// routes/AdminManage.js
const express = require('express');
const router = express.Router();
const db = require('../../db');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');


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

// ✅ Add a new student and create mentor card
router.post('/students', (req, res) => {
  const { Name, Roll_no, Email, Password, Batch, Dept_ID, Course_ID, Faculty_id } = req.body;

  if (!Name || !Roll_no || !Email || !Password || !Batch || !Dept_ID || !Course_ID || !Faculty_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!isValidEmail(Email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Check for duplicate email
  db.query('SELECT * FROM student WHERE Email = ?', [Email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Insert student
    const insertStudentQuery = `
      INSERT INTO student (Name, Roll_no, Email, Password, Batch, Dept_ID, Course_ID, Faculty_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      insertStudentQuery,
      [Name, Roll_no, Email, Password, Batch, Dept_ID, Course_ID, Faculty_id],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to add student' });

        const studentId = result.insertId;

        // ✅ Create mentor card
        const insertMentorCardQuery = `
          INSERT INTO mentor_card (Student_id, Faculty_id)
          VALUES (?, ?)
        `;
        db.query(insertMentorCardQuery, [studentId, Faculty_id], (err) => {
          if (err) {
            return res.status(500).json({
              message: 'Student added, but failed to create mentor card',
              Student_id: studentId,
            });
          }

          res.status(201).json({
            message: 'Student and mentor card added successfully',
            Student_id: studentId,
          });
        });
      }
    );
  });
});


// ✅ Update student and ensure mentor_card exists or is updated
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

    if (Password) {
      updateQuery += ', Password = ?';
      params.push(Password);
    }

    updateQuery += ' WHERE Student_id = ?';
    params.push(id);

    db.query(updateQuery, params, (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update student' });

      // ✅ Handle mentor_card creation or update
      const checkMentorCardQuery = 'SELECT * FROM mentor_card WHERE student_id = ?';
      db.query(checkMentorCardQuery, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Error checking mentor card' });

        if (results.length === 0) {
          // No mentor card exists → Insert new one
          const insertQuery = `
            INSERT INTO mentor_card (student_id, faculty_id) VALUES (?, ?)
          `;
          db.query(insertQuery, [id, Faculty_id], (err) => {
            if (err) return res.status(500).json({ message: 'Failed to create mentor card' });
            return res.status(200).json({ message: 'Student and mentor card created successfully' });
          });
        } else {
          // Mentor card exists → Check if faculty_id needs updating
          const existingFacultyId = results[0].faculty_id;
          if (existingFacultyId !== Faculty_id) {
            const updateCardQuery = `
              UPDATE mentor_card SET faculty_id = ? WHERE student_id = ?
            `;
            db.query(updateCardQuery, [Faculty_id, id], (err) => {
              if (err) return res.status(500).json({ message: 'Failed to update mentor card' });
              return res.status(200).json({ message: 'Student and mentor card updated successfully' });
            });
          } else {
            // No change needed
            return res.status(200).json({ message: 'Student updated successfully' });
          }
        }
      });
    });
  });
});

// ✅ Delete student with transaction (all or nothing)
router.delete('/students/:id', (req, res) => {
  const { id } = req.params;

  // Start transaction
  db.beginTransaction((beginErr) => {
    if (beginErr) {
      console.error('Error starting transaction:', beginErr);
      return res.status(500).json({ message: 'Failed to start transaction' });
    }

    // Delete monitoring sessions
    db.query('DELETE FROM monitoring_session WHERE student_id = ?', [id], (monitoringErr) => {
      if (monitoringErr) {
        return db.rollback(() => {
          console.error('Failed to delete monitoring sessions:', monitoringErr);
          res.status(500).json({ message: 'Failed to delete monitoring sessions' });
        });
      }

      // Delete appointments
      db.query('DELETE FROM appointment WHERE student_id = ?', [id], (appointmentErr) => {
        if (appointmentErr) {
          return db.rollback(() => {
            console.error('Failed to delete appointments:', appointmentErr);
            res.status(500).json({ message: 'Failed to delete appointments' });
          });
        }

        // Delete mentor card
        db.query('DELETE FROM mentor_card WHERE student_id = ?', [id], (mentorErr) => {
          if (mentorErr) {
            return db.rollback(() => {
              console.error('Failed to delete mentor card:', mentorErr);
              res.status(500).json({ message: 'Failed to delete mentor card' });
            });
          }

          // Delete student
          db.query('DELETE FROM student WHERE Student_id = ?', [id], (studentErr) => {
            if (studentErr) {
              return db.rollback(() => {
                console.error('Failed to delete student:', studentErr);
                res.status(500).json({ message: 'Failed to delete student' });
              });
            }

            // Commit if all successful
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  console.error('Error committing transaction:', commitErr);
                  res.status(500).json({ message: 'Failed to complete transaction' });
                });
              }

              res.status(200).json({ 
                message: 'Student and all related data deleted successfully' 
              });
            });
          });
        });
      });
    });
  });
});

//---------------------------------------------------------------------------------//----------------------------->



// Bulk insert students with duplicate handling
router.post('/students/bulk-insert', (req, res) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: 'No student data provided.' });
  }

  // Validate required fields except password
  for (const student of students) {
    if (!student.Name || !student.Roll_no || !student.Email || !student.Batch || !student.Dept_ID || !student.Course_ID) {
      return res.status(400).json({ message: 'Missing required fields in one or more student entries.' });
    }
  }

  const values = students.map(s => [
    s.Name,
    s.Roll_no,
    s.Email,
    null,                      // mobile_no
    s.password || 'Pass1234', // default password
    '',                      // Address
    '',                      // photo
    s.Batch,
    s.Dept_ID,
    s.Course_ID,
    null,                    // Faculty_id
    null                     // Last_login
  ]);

  const sql = `
    INSERT INTO student 
    (Name, Roll_no, Email, mobile_no, password, Address, photo, Batch, Dept_ID, Course_ID, Faculty_id, Last_login)
    VALUES ?
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Bulk insert error:', err);

      // Handle duplicate entry errors
      if (err.code === 'ER_DUP_ENTRY') {
        const match = err.sqlMessage.match(/Duplicate entry '(.+)' for key '(.+)'/);
        if (match) {
          const duplicateValue = match[1];
          const key = match[2];

          let fieldName = '';
          if (key.includes('Email')) {
            fieldName = 'Email';
          } else if (key.includes('Roll_no')) {
            fieldName = 'Roll number';
          } else {
            fieldName = key;
          }

          return res.status(400).json({
            message: `Duplicate ${fieldName}: ${duplicateValue}. Please fix the conflict and try again.`,
          });
        }

        return res.status(400).json({ message: 'Duplicate entry found. Check data.' });
      }

      return res.status(500).json({ message: 'Server error while inserting students.' });
    }

    res.json({ message: `${result.affectedRows} students inserted successfully.` });
  });
});


// ✅ Route: Download Excel Template
router.get('/admin/students/template', (req, res) => {
  const filePath = path.join(__dirname, '../../templates/student_upload_format.xlsx');
  res.download(filePath, 'student_upload_format.xlsx', (err) => {
    if (err) {
      console.error('Error sending template:', err);
      res.status(500).json({ message: 'Could not download template file' });
    }
  });
});

module.exports = router;