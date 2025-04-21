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
    cb(null, `admin_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ✅ Get Admin Profile
router.get('/admin/profile', verifyToken, (req, res) => {
  const adminId = req.user.id;

  db.query(
    'SELECT Admin_id, Name, Email, photo, mobile_no, Last_login FROM admin WHERE Admin_id = ?',
    [adminId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (results.length === 0) return res.status(404).json({ message: 'Admin not found' });

      res.status(200).json({ profile: results[0] });
    }
  );
});

// ✅ Upload Admin Photo
router.post('/admin/upload-photo', verifyToken, upload.single('photo'), (req, res) => {
  const adminId = req.user.id;
  const newFile = req.file.filename;

  db.query('SELECT photo FROM admin WHERE Admin_id = ?', [adminId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking old photo' });

    const oldPhoto = results[0]?.photo;
    db.query('UPDATE admin SET photo = ? WHERE Admin_id = ?', [newFile, adminId], (err) => {
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
router.put('/admin/update-mobile', verifyToken, (req, res) => {
  const adminId = req.user.id;
  const { mobile_no } = req.body;

  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobile_no)) {
    return res.status(400).json({ message: 'Invalid mobile number format' });
  }

  db.query(
    'SELECT Admin_id FROM admin WHERE mobile_no = ? AND Admin_id != ?',
    [mobile_no, adminId],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (results.length > 0) return res.status(409).json({ message: 'Mobile number already in use' });

      db.query(
        'UPDATE admin SET mobile_no = ? WHERE Admin_id = ?',
        [mobile_no, adminId],
        (err) => {
          if (err) return res.status(500).json({ message: 'Failed to update mobile number' });
          res.status(200).json({ message: 'Mobile number updated successfully' });
        }
      );
    }
  );
});

// ✅ Change Password
router.post('/admin/change-password', verifyToken, (req, res) => {
  const adminId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Both passwords required' });
  }

  db.query('SELECT password FROM admin WHERE Admin_id = ?', [adminId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Admin not found' });

    const currentPassword = results[0].password;
    if (currentPassword !== oldPassword) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    db.query('UPDATE admin SET password = ? WHERE Admin_id = ?', [newPassword, adminId], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to change password' });
      res.status(200).json({ message: 'Password updated successfully' });
    });
  });
});

module.exports = router;
