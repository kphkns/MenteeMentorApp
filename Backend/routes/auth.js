const express = require('express');
const router = express.Router();
const db = require('../db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kupphu123@gmail.com',
    pass: 'frcomyamkfhctaim' // <-- Make sure this is your app password, no spaces
  }
});

// Generate 6-digit OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Send OTP email
const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    await transporter.sendMail({
      from: 'MentorDB <kupphu123@gmail.com>',
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>Dear ${name},</p>
          <p>Your OTP for password reset is:</p>
          <div style="font-size: 24px; font-weight: bold; margin: 20px 0;">${otp}</div>
          <p>This OTP is valid for 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ success: false, message: 'Email and role are required' });
  }

  const validRoles = ['student', 'faculty', 'admin'];
  if (!validRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Invalid role specified' });
  }

  try {
    const table = role.toLowerCase();
    const [users] = await db.promise().query(`SELECT * FROM ${table} WHERE email = ?`, [email]);

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 15 * 60000); // 15 minutes

    await db.promise().query(
      `UPDATE ${table} SET reset_token = ?, reset_token_expiry = ? WHERE email = ?`,
      [otp, expiry, email]
    );

    const emailSent = await sendOTPEmail(email, otp, users[0].Name);

    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'OTP generated but failed to send email' 
      });
    }

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  const { email, role, otp, newPassword } = req.body;

  if (!email || !role || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    const table = role.toLowerCase();
    const [users] = await db.promise().query(`SELECT * FROM ${table} WHERE email = ?`, [email]);

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    // Check OTP validity
    if (!user.reset_token || !user.reset_token_expiry) {
      return res.status(400).json({ success: false, message: 'OTP not requested' });
    }

    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    if (otp !== user.reset_token) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Update password
    await db.promise().query(
      `UPDATE ${table} SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?`,
      [newPassword, email]
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
