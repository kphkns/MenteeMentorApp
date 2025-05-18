// routes/facultyAppointments.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

// Get all appointments for the logged-in faculty
// Get all appointments for the logged-in faculty (with message, duration, created_at, updated_at)
router.get('/appointments', verifyToken, (req, res) => {
  const { id, userType } = req.user;

  if (userType !== 'Faculty') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `
    SELECT 
      a.appointment_id, a.date, a.time, a.duration, a.status, a.message,
      a.meeting_mode, a.location, a.student_id, s.Name AS student_name,
      a.created_at, a.updated_at
    FROM appointment a
    JOIN student s ON a.student_id = s.Student_id
    WHERE a.faculty_id = ?
    ORDER BY a.date DESC, a.time DESC
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching faculty appointments:', err);
      return res.status(500).json({ message: 'Failed to fetch appointments' });
    }
    res.json(results);
  });
});


// Accept, cancel, or complete appointment by faculty (with cancel_reason if cancelled)
router.patch('/appointments/:id/status', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const { status, cancel_reason } = req.body;
  const facultyId = req.user.id;

  if (!['accepted', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  if (status === 'cancelled' && (!cancel_reason || cancel_reason.trim() === '')) {
    return res.status(400).json({ message: 'Cancellation reason is required.' });
  }

  if (status === 'completed') {
    const selectQuery = `
      SELECT date, time, duration, status
      FROM appointment
      WHERE appointment_id = ? AND faculty_id = ?
    `;

    db.query(selectQuery, [appointmentId, facultyId], (err, results) => {
      if (err) {
        console.error('DB error during select:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Appointment not found or unauthorized' });
      }

      const appointment = results[0];
      if (appointment.status !== 'accepted') {
        return res.status(400).json({ message: 'Only accepted appointments can be completed' });
      }

      const startDateTimeStr = `${appointment.date.toISOString().split('T')[0]}T${appointment.time}`;
      const startDateTime = new Date(startDateTimeStr);
      const endDateTime = new Date(startDateTime.getTime() + appointment.duration * 60000);
      const now = new Date();

      if (now < endDateTime) {
        return res.status(400).json({
          message: `Appointment is not yet over. It ends at ${endDateTime.toLocaleString()}`
        });
      }

      const updateQuery = `
        UPDATE appointment
        SET status = 'completed', updated_at = NOW()
        WHERE appointment_id = ? AND faculty_id = ?
      `;

      db.query(updateQuery, [appointmentId, facultyId], (updateErr) => {
        if (updateErr) {
          console.error('Failed to mark as completed:', updateErr);
          return res.status(500).json({ message: 'Failed to mark appointment as completed' });
        }
        return res.json({ message: 'Appointment marked as completed' });
      }); 
    });

  } else {
    // Accept or Cancel logic
    const updateQuery = `
      UPDATE appointment
      SET 
        status = ?,
        cancelled_by = IF(? = 'cancelled', 'faculty', NULL),
        cancel_reason = IF(? = 'cancelled', ?, NULL),
        updated_at = NOW()
      WHERE appointment_id = ? AND faculty_id = ?
    `;

    db.query(updateQuery, [status, status, status, cancel_reason, appointmentId, facultyId], (err, result) => {
      if (err) {
        console.error('Status update error:', err);
        return res.status(500).json({ message: 'Status update failed' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Appointment not found or not yours' });
      }

      return res.json({ message: `Appointment ${status} successfully.` });
    });
  }
});


// Faculty reschedule
router.patch('/appointments/:id/reschedule', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const facultyId = req.user.id;
  const { date, time, reschedule_reason } = req.body;

  if (!date || !time || !reschedule_reason) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newDateTime = new Date(`${date}T${time}`);
  if (newDateTime < new Date()) {
    return res.status(400).json({ message: 'Cannot reschedule to a past time' });
  }

  const checkQuery = `SELECT * FROM appointment WHERE appointment_id = ? AND faculty_id = ?`;
  db.query(checkQuery, [appointmentId, facultyId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(404).json({ message: 'Appointment not found' });

    const duration = results[0].duration;

    const conflictQuery = `
      SELECT * FROM appointment
      WHERE faculty_id = ? AND date = ? AND appointment_id != ? AND status != 'cancelled'
        AND (
          TIME(?) < ADDTIME(time, SEC_TO_TIME(duration * 60))
          AND TIME(?) >= time
        )
    `;
    db.query(conflictQuery, [facultyId, date, appointmentId, time, time], (err2, conflicts) => {
      if (err2) return res.status(500).json({ message: 'Conflict check failed' });
      if (conflicts.length > 0) {
        return res.status(409).json({ message: 'This time slot is already booked.' });
      }

      const updateQuery = `
        UPDATE appointment
        SET date = ?, time = ?, reschedule_reason = ?, status = 'pending', updated_at = NOW()
        WHERE appointment_id = ? AND faculty_id = ?
      `;
      db.query(updateQuery, [date, time, reschedule_reason, appointmentId, facultyId], (err3) => {
        if (err3) return res.status(500).json({ message: 'Reschedule failed' });
        res.json({ message: 'Rescheduled successfully' });
      });
    });
  });
});

// Get appointment history (cancelled or completed) for faculty
// Get appointment history (cancelled, completed, or failed) for faculty
router.get('/appointments/history', verifyToken, (req, res) => {
  const { id, userType } = req.user;

  if (userType !== 'Faculty') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `
    SELECT 
      a.appointment_id, a.date, a.time, a.duration, a.status,
      a.meeting_mode, a.location, a.message,
      a.cancelled_by, a.cancel_reason, a.reschedule_reason,
      a.created_at, a.updated_at,
      s.Name AS student_name
    FROM appointment a
    JOIN student s ON a.student_id = s.Student_id
    WHERE a.faculty_id = ? AND a.status IN ('cancelled', 'completed', 'failed')
    ORDER BY a.date DESC, a.time DESC
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching appointment history:', err);
      return res.status(500).json({ message: 'Failed to fetch appointment history' });
    }
    res.json(results);
  });
});

// PATCH /api/faculty/appointments/:id/fail
router.patch('/appointments/:id/fail', verifyToken, (req, res) => {
  const facultyId = req.user.id;
  const { id } = req.params;
  const { fail_reason } = req.body;

  if (!fail_reason || fail_reason.trim() === '') {
    return res.status(400).json({ message: 'Failure reason is required' });
  }

  const selectQuery = `SELECT status FROM appointment WHERE appointment_id = ? AND faculty_id = ?`;
  db.query(selectQuery, [id, facultyId], (err, results) => {
    if (err) {
      console.error('Database select error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointmentStatus = results[0].status;
    if (appointmentStatus !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted appointments can be marked as failed' });
    }

    const updateQuery = `
      UPDATE appointment
      SET status = 'failed', cancel_reason = ?, cancelled_by = 'faculty', updated_at = NOW()
      WHERE appointment_id = ? AND faculty_id = ?
    `;

    db.query(updateQuery, [fail_reason, id, facultyId], (updateErr) => {
      if (updateErr) {
        console.error('Error updating to failed:', updateErr);
        return res.status(500).json({ message: 'Failed to mark appointment as failed' });
      }

      return res.json({ message: 'Appointment marked as failed' });
    });
  });
});

module.exports = router;
