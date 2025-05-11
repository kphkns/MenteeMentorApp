// routes/FacultyProfile.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// ⚙️ Multer Setup for Uploading Photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `faculty_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ✅ Get Faculty Profile
router.get('/faculty/profile', verifyToken, (req, res) => {
  const facultyId = req.user.id;

  db.query(
    'SELECT Faculty_id, Name, Email, photo, Dept_ID, mobile_no FROM faculty WHERE Faculty_id = ?',
    [facultyId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (results.length === 0) return res.status(404).json({ message: 'Faculty not found' });

      res.status(200).json({ profile: results[0] });
    }
  );
});

// ✅ Upload Faculty Photo
router.post('/faculty/upload-photo', verifyToken, upload.single('photo'), (req, res) => {
  const facultyId = req.user.id;
  const newFile = req.file.filename;

  db.query('SELECT photo FROM faculty WHERE Faculty_id = ?', [facultyId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking old photo' });

    const oldPhoto = results[0]?.photo;
    db.query('UPDATE faculty SET photo = ? WHERE Faculty_id = ?', [newFile, facultyId], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update photo' });

      if (oldPhoto && oldPhoto !== 'default-profile.png') {
        const oldPath = path.join(__dirname, '..', 'uploads', oldPhoto);
        fs.unlink(oldPath, (unlinkErr) => {
          if (unlinkErr) console.warn('Old photo not deleted:', unlinkErr.message);
        });
      }

      res.status(200).json({
        message: 'Photo updated successfully',
        file: newFile,
        photoURL: `${req.protocol}://${req.get('host')}/uploads/${newFile}`
      });
    });
  });
});

// ✅ Update Mobile Number
router.put('/faculty/update-mobile', verifyToken, (req, res) => {
  const facultyId = req.user.id;
  const { mobile_no } = req.body;

  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobile_no)) {
    return res.status(400).json({ message: 'Invalid mobile number format' });
  }

  db.query(
    'SELECT Faculty_id FROM faculty WHERE mobile_no = ? AND Faculty_id != ?',
    [mobile_no, facultyId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (results.length > 0) return res.status(409).json({ message: 'Mobile number already in use' });

      db.query(
        'UPDATE faculty SET mobile_no = ? WHERE Faculty_id = ?',
        [mobile_no, facultyId],
        (err) => {
          if (err) return res.status(500).json({ message: 'Failed to update mobile number' });
          res.status(200).json({ message: 'Mobile number updated successfully' });
        }
      );
    }
  );
});

// ✅ Change Password
router.post('/faculty/change-password', verifyToken, (req, res) => {
  const facultyId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Both passwords required' });
  }

  db.query('SELECT password FROM faculty WHERE Faculty_id = ?', [facultyId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Faculty not found' });

    const currentPassword = results[0].password;
    if (currentPassword !== oldPassword) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    db.query('UPDATE faculty SET password = ? WHERE Faculty_id = ?', [newPassword, facultyId], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to change password' });
      res.status(200).json({ message: 'Password updated successfully' });
    });
  });
});


module.exports = router;
