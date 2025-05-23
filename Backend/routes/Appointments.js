const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

// ✅ Get student profile using token (called as /api/appointments/me)
// Get student profile
router.get('/me', verifyToken, (req, res) => {
  const { id, userType } = req.user;
  if (userType !== 'Student') return res.status(403).json({ message: 'Access denied' });

  const query = 'SELECT Student_id, Name, Email, Faculty_id FROM student WHERE Student_id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(404).json({ message: 'Student not found' });

    const student = results[0];
    res.json({
      studentId: student.Student_id,
      name: student.Name,
      email: student.Email,
      facultyId: student.Faculty_id
    });
  });
});
//............................//........................//.........//.............................
// Book appointment
router.post('/', verifyToken, (req, res) => {
  const { faculty_id, date, time, duration, meeting_mode, location, message } = req.body;
  const student_id = req.user.id;

  // Validate required fields
  if (!faculty_id || !date || !time || !duration || !meeting_mode || !location) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Check if appointment is in the past
  const now = new Date();
  const appointmentDateTime = new Date(`${date}T${time}`);
  if (appointmentDateTime < now) {
    return res.status(400).json({ message: 'Cannot book past date or time.' });
  }

  // Check student status
  const statusCheckQuery = `SELECT status FROM student WHERE Student_id = ?`;
  db.query(statusCheckQuery, [student_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Server error (status check)' });
    if (result.length === 0) return res.status(404).json({ message: 'Student not found.' });

    const studentStatus = result[0].status;
    if (studentStatus === 0) {
      return res.status(403).json({ message: 'Inactive student accounts cannot book appointments.' });
    }

    // Check if student already has an active appointment
    const activeCheck = `
      SELECT * FROM appointment
      WHERE student_id = ? AND status IN ('pending', 'accepted')
    `;
    db.query(activeCheck, [student_id], (err, activeAppointments) => {
      if (err) return res.status(500).json({ message: 'Server error (active check)' });
      if (activeAppointments.length > 0) {
        return res.status(403).json({ message: 'You already have an active appointment.' });
      }

      // Check for faculty conflict (excluding completed, failed, cancelled)
      const conflictQuery = `
        SELECT * FROM appointment
        WHERE faculty_id = ?
          AND date = ?
          AND status NOT IN ('failed', 'cancelled', 'completed') -- ✅ updated
          AND (
            TIME(?) < ADDTIME(time, SEC_TO_TIME(duration * 60))
            AND TIME(?) >= time
          )
      `;
      db.query(conflictQuery, [faculty_id, date, time, time], (err2, conflicts) => {
        if (err2) return res.status(500).json({ message: 'Conflict check failed' });

        if (conflicts.length > 0) {
          return res.status(409).json({ message: 'This time slot is already booked with your mentor.' });
        }

        // Insert new appointment
        const insertQuery = `
          INSERT INTO appointment (
            faculty_id, student_id, date, time, duration, meeting_mode,
            location, status, message, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())
        `;
        db.query(insertQuery, [
          faculty_id, student_id, date, time, duration, meeting_mode, location, message
        ], (err3, result) => {
          if (err3) {
            console.error('Insert error:', err3);
            return res.status(500).json({ message: 'Error creating appointment' });
          }

          res.status(201).json({
            message: 'Appointment created successfully',
            appointment_id: result.insertId
          });
        });
      });
    });
  });
});



//...........................//............................//............................../

// Get all appointments for the logged-in student
router.get('/mine', verifyToken, (req, res) => {
  const { id, userType } = req.user;

  if (userType !== 'Student') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = `
    SELECT 
      a.appointment_id, 
      a.faculty_id, 
      f.Name AS faculty_name,
      a.date, 
      a.time, 
      a.duration, 
      a.meeting_mode,
      a.location, 
      a.status, 
      a.message,
      a.reschedule_reason,
      a.cancel_reason,
      a.cancelled_by,
      a.created_at,
      a.updated_at
    FROM appointment a
    JOIN faculty f ON a.faculty_id = f.Faculty_id
    WHERE a.student_id = ?
    ORDER BY a.date DESC, a.time DESC
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      return res.status(500).json({ message: 'Failed to fetch appointments' });
    }

    res.json(results);
  });
});

// Appointment history with optional filters
router.get('/history', verifyToken, (req, res) => {
  const { id, userType } = req.user;

  if (userType !== 'Student') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { status, date } = req.query; // optional query filters

  let baseQuery = `
    SELECT 
      a.appointment_id, 
      a.faculty_id,
      f.Name AS faculty_name,
      a.date, 
      a.time, 
      a.duration, 
      a.meeting_mode,
      a.location, 
      a.status, 
      a.message
    FROM appointment a
    JOIN faculty f ON a.faculty_id = f.Faculty_id
    WHERE a.student_id = ? AND a.status IN ('cancelled', 'completed')
  `;

  const params = [id];

  if (status && ['cancelled', 'completed'].includes(status)) {
    baseQuery += ' AND a.status = ?';
    params.push(status);
  }

  if (date) {
    baseQuery += ' AND a.date = ?';
    params.push(date);
  }

  baseQuery += ' ORDER BY a.date DESC, a.time DESC';

  db.query(baseQuery, params, (err, results) => {
    if (err) {
      console.error('Error fetching appointment history:', err);
      return res.status(500).json({ message: 'Failed to fetch appointment history' });
    }

    res.json(results);
  });
});

//.................................//....................///........................//.........../

// Cancel an appointment
router.patch('/:id/cancel', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const studentId = req.user.id;
  const { cancel_reason } = req.body;

  if (!cancel_reason || cancel_reason.trim() === '') {
    return res.status(400).json({ message: 'Cancellation reason is required.' });
  }

  const query = `
    UPDATE appointment
    SET status = 'cancelled',
        cancelled_by = 'student',
        cancel_reason = ?,
        updated_at = NOW()
    WHERE appointment_id = ? AND student_id = ?
  `;

  db.query(query, [cancel_reason, appointmentId, studentId], (err, result) => {
    if (err) {
      console.error('Error cancelling appointment:', err);
      return res.status(500).json({ message: 'Failed to cancel appointment' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Appointment not found or not yours' });
    }

    res.json({ message: 'Appointment cancelled successfully' });
  });
});

//...............................//..................//.................///..................//.

// PATCH /api/appointments/:id/reschedule
router.patch('/:id/reschedule', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const studentId = req.user.id;
  const { date, time, reschedule_reason } = req.body;

  if (!date || !time || !reschedule_reason) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const checkOwnerQuery = `SELECT * FROM appointment WHERE appointment_id = ? AND student_id = ?`;

  db.query(checkOwnerQuery, [appointmentId, studentId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(404).json({ message: 'Appointment not found or not yours' });

    const appointment = results[0];
    const faculty_id = appointment.Faculty_id;
    const duration = appointment.duration;

    const existingDate = appointment.Date.toISOString().split('T')[0];
    const existingTime = appointment.Time.slice(0, 8);

    if (existingDate === date && existingTime === time) {
      return res.status(400).json({ message: 'No changes detected in date or time.' });
    }

    const now = new Date();
    const newDateTime = new Date(`${date}T${time}`);
    if (newDateTime < now) {
      return res.status(400).json({ message: 'Cannot reschedule to a past date or time.' });
    }

    // Conflict check (IGNORE if conflicting appointment belongs to same student)
    const conflictQuery = `
      SELECT * FROM appointment
      WHERE faculty_id = ?
        AND date = ?
        AND appointment_id != ?
        AND status NOT IN ('cancelled', 'failed', 'completed')
        AND (
          TIME(?) < ADDTIME(time, SEC_TO_TIME(duration * 60))
          AND TIME(?) >= time
        )
    `;

    db.query(conflictQuery, [faculty_id, date, appointmentId, time, time], (err2, conflicts) => {
      if (err2) return res.status(500).json({ message: 'Conflict check failed' });

      const otherStudentConflicts = conflicts.filter(conflict => conflict.Student_id !== studentId);
      if (otherStudentConflicts.length > 0) {
        return res.status(409).json({ message: 'This time slot is already booked with your mentor.' });
      }

      const updateQuery = `
        UPDATE appointment SET
          Date = ?,
          Time = ?,
          reschedule_reason = ?,
          status = 'pending',
          updated_at = NOW()
        WHERE appointment_id = ? AND student_id = ?
      `;

      db.query(updateQuery, [date, time, reschedule_reason, appointmentId, studentId], (err3) => {
        if (err3) return res.status(500).json({ message: 'Failed to update appointment' });
        res.json({ message: 'Appointment rescheduled successfully' });
      });
    });
  });
});

//.........//.......................................//.................................//............

router.get('/history', verifyToken, (req, res) => {
  const { id, userType } = req.user;

  if (userType !== 'Student') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { status, date } = req.query; // optional query filters

  let baseQuery = `
    SELECT appointment_id, faculty_id, date, time, duration, meeting_mode,
           location, status, message
    FROM appointment
    WHERE student_id = ? AND status IN ('cancelled', 'completed')
  `;

  const params = [id];

  if (status && ['cancelled', 'completed'].includes(status)) {
    baseQuery += ' AND status = ?';
    params.push(status);
  }

  if (date) {
    baseQuery += ' AND date = ?';
    params.push(date);
  }

  baseQuery += ' ORDER BY date DESC, time DESC';

  db.query(baseQuery, params, (err, results) => {
    if (err) {
      console.error('Error fetching appointment history:', err);
      return res.status(500).json({ message: 'Failed to fetch appointment history' });
    }

    res.json(results);
  });
});
// DELETE /api/appointments/:id
router.delete('/:id', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const studentId = req.user.id;

  const query = `
    DELETE FROM appointment
    WHERE appointment_id = ? AND student_id = ? AND status = 'pending'
  `;

  db.query(query, [appointmentId, studentId], (err, result) => {
    if (err) {
      console.error('Error deleting appointment:', err);
      return res.status(500).json({ message: 'Failed to delete appointment' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No matching pending appointment found' });
    }

    res.json({ message: 'Pending appointment deleted successfully' });
  });
});

module.exports = router;
