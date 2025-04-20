const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/verifyToken');

// ⚙️ Multer Setup for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `student_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ✅ Student Login (with Last_login update)
router.post('/student/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM student WHERE Email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const student = results[0];
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.query(
      'UPDATE student SET Last_login = ? WHERE Student_id = ?',
      [now, student.Student_id],
      () => {}
    );

    const token = jwt.sign({ id: student.Student_id }, 'your_secret_key', { expiresIn: '1d' });
    res.status(200).json({ message: 'Login successful', token });
  });
});

// ✅ Get Student Profile
router.get('/student/profile', verifyToken, (req, res) => {
  const studentId = req.user.id;

  const query = `
    SELECT 
      s.Student_id, s.Name, s.Roll_no, s.Email, s.mobile_no,
      s.Address, s.photo, b.batch_name AS Batch,
      d.Dept_name AS Department, c.Course_name AS Course,
      s.Faculty_id, s.Last_login
    FROM student s
    LEFT JOIN department d ON s.Dept_ID = d.Dept_id
    LEFT JOIN course c ON s.Course_ID = c.Course_ID
    LEFT JOIN batch b ON s.Batch = b.Batch_id
    WHERE s.Student_id = ?
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length > 0) return res.status(200).json({ profile: results[0] });
    res.status(404).json({ message: 'Student not found' });
  });
});

// ✅ Upload Student Photo (delete old photo)
router.post('/student/upload-photo', verifyToken, upload.single('photo'), (req, res) => {
  const studentId = req.user.id;
  const newFilePath = req.file.filename;

  db.query('SELECT photo FROM student WHERE Student_id = ?', [studentId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking old photo' });

    const oldPhoto = results[0]?.photo;

    db.query(
      'UPDATE student SET photo = ? WHERE Student_id = ?',
      [newFilePath, studentId],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ message: 'Photo upload failed' });

        if (oldPhoto && oldPhoto !== 'default-profile.png') {
          const oldFilePath = path.join(__dirname, '..', 'uploads', oldPhoto);
          fs.unlink(oldFilePath, (unlinkErr) => {
            if (unlinkErr) console.warn('Failed to delete old photo:', unlinkErr.message);
          });
        }

        res.status(200).json({
          message: 'Photo updated successfully',
          file: newFilePath,
          photoURL: `${req.protocol}://${req.get('host')}/uploads/${newFilePath}`
        });
      }
    );
  });
});

// ✅ Update Mobile Number (with validation and uniqueness)
router.put('/student/update-mobile', verifyToken, (req, res) => {
  const studentId = req.user.id;
  const { mobile_no } = req.body;

  // 📞 Validate format (Indian 10-digit number)
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobile_no)) {
    return res.status(400).json({ message: 'Invalid mobile number format' });
  }

  // 🔍 Check if number is already in use by another student
  db.query(
    'SELECT Student_id FROM student WHERE mobile_no = ? AND Student_id != ?',
    [mobile_no, studentId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      if (results.length > 0) {
        return res.status(409).json({ message: 'Mobile number already in use' });
      }

      // ✅ Update if valid and unique
      db.query(
        'UPDATE student SET mobile_no = ? WHERE Student_id = ?',
        [mobile_no, studentId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating mobile number:', updateErr);
            return res.status(500).json({ message: 'Mobile number update failed' });
          }

          res.status(200).json({ message: 'Mobile number updated successfully' });
        }
      );
    }
  );
});

// ✅ Change Password
router.post('/student/change-password', verifyToken, (req, res) => {
  const studentId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both old and new passwords' });
  }

  // 1. Check old password
  db.query('SELECT password FROM student WHERE Student_id = ?', [studentId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ message: 'Student not found' });
    }

    if (results[0].password !== oldPassword) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    // 2. Update new password
    db.query('UPDATE student SET password = ? WHERE Student_id = ?', [newPassword, studentId], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to update password' });
      }
      res.status(200).json({ message: 'Password changed successfully' });
    });
  });
});


module.exports = router;
