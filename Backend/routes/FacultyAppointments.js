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

// Helper function to validate appointment time
const isAppointmentOver = (appointment) => {
  const dateStr = appointment.date.toISOString().split('T')[0];
  const timeStr = appointment.time.toString().split(':').slice(0, 2).join(':');
  const [hours, minutes] = timeStr.split(':');
  const [year, month, day] = dateStr.split('-');
  
  const startDateUTC = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    0
  ));

  const endDateTimeUTC = new Date(startDateUTC.getTime() + appointment.duration * 60000);
  const nowUTC = new Date();

  return nowUTC >= endDateTimeUTC;
};

// Accept, cancel, complete or fail appointment by faculty (callback version)
router.patch('/appointments/:id/status', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const { status, cancel_reason } = req.body;
  const facultyId = req.user.id;

  if (!['accepted', 'cancelled', 'completed', 'failed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  if (status === 'completed') {
    // Get appointment details first
    db.query(
      `SELECT date, time, duration, status, student_id
       FROM appointment
       WHERE appointment_id = ? AND faculty_id = ?`,
      [appointmentId, facultyId],
      (err, results) => {
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

        // Check if appointment time has passed
        if (!isAppointmentOver(appointment)) {
          const options = {
            timeZone: 'UTC',
            hour12: true,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          };
          const endDateTimeUTC = new Date(new Date(appointment.date).getTime() + appointment.duration * 60000);
          return res.status(400).json({
            message: `Appointment is not yet over. It ends at ${endDateTimeUTC.toLocaleString('en-US', options)} UTC`
          });
        }

        // Update appointment status
        db.query(
          `UPDATE appointment
           SET status = 'completed', updated_at = NOW()
           WHERE appointment_id = ? AND faculty_id = ?`,
          [appointmentId, facultyId],
          (updateErr) => {
            if (updateErr) {
              console.error('Failed to mark as completed:', updateErr);
              return res.status(500).json({ message: 'Failed to mark appointment as completed' });
            }
            return res.json({ message: 'Appointment marked as completed' });
          }
        );
      }
    );
  } else {
    // Accept, Cancel, or Fail logic
    let updateQuery = `
      UPDATE appointment
      SET status = ?, updated_at = NOW()
    `;
    const params = [status];

    if (status === 'cancelled') {
      updateQuery += `, cancel_reason = ?, cancelled_by = 'faculty'`;
      params.push(cancel_reason);
    }
    updateQuery += ` WHERE appointment_id = ? AND faculty_id = ?`;
    params.push(appointmentId, facultyId);

    db.query(updateQuery, params, (err) => {
      if (err) {
        console.error(`Failed to update appointment status to ${status}:`, err);
        return res.status(500).json({ message: `Failed to update appointment status to ${status}` });
      }
      return res.json({ message: `Appointment status updated to ${status}` });
    });
  }
});

// Complete appointment with monitoring session details (simplified version without transactions)
router.patch('/appointments/:id/complete', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const { high_points } = req.body;
  const facultyId = req.user.id;

  if (!high_points || !high_points.trim()) {
    return res.status(400).json({ message: 'High points are required' });
  }

  // 1. Verify and get appointment details
  db.query(
    `SELECT a.date, a.time, a.duration, a.status, a.student_id 
     FROM appointment a 
     WHERE a.appointment_id = ? AND a.faculty_id = ?`,
    [appointmentId, facultyId],
    (err, appointments) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (appointments.length === 0) {
        return res.status(404).json({ message: 'Appointment not found or unauthorized' });
      }

      const appointment = appointments[0];
      if (appointment.status !== 'accepted') {
        return res.status(400).json({ message: 'Only accepted appointments can be completed' });
      }

      // 2. Check if appointment time has passed
      if (!isAppointmentOver(appointment)) {
        const options = {
          timeZone: 'UTC',
          hour12: true,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        const endDateTimeUTC = new Date(new Date(appointment.date).getTime() + appointment.duration * 60000);
        return res.status(400).json({
          message: `Appointment is not yet over. It ends at ${endDateTimeUTC.toLocaleString('en-US', options)} UTC`
        });
      }

      // 3. Update appointment status
      db.query(
        `UPDATE appointment 
         SET status = 'completed', updated_at = NOW() 
         WHERE appointment_id = ? AND faculty_id = ?`,
        [appointmentId, facultyId],
        (updateErr) => {
          if (updateErr) {
            console.error('Error updating appointment:', updateErr);
            return res.status(500).json({ message: 'Failed to update appointment' });
          }

          // 4. Create monitoring session record
          db.query(
            `INSERT INTO monitoring_session 
             (date_of_monitoring, high_points, student_id, faculty_id, appointment_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              appointment.date,
              high_points,
              appointment.student_id,
              facultyId,
              appointmentId
            ],
            (insertErr, result) => {
              if (insertErr) {
                console.error('Error creating monitoring session:', insertErr);
                return res.status(500).json({ message: 'Failed to create monitoring session' });
              }

              return res.json({ 
                message: 'Appointment completed successfully',
                monitoring_id: result.insertId
              });
            }
          );
        }
      );
    }
  );
});

// Get monitoring sessions for faculty
router.get('/monitoring-sessions', verifyToken, async (req, res) => {
  const facultyId = req.user.id;

  try {
    const [sessions] = await db.query(
      `SELECT ms.m_id, ms.date_of_monitoring, ms.high_points, 
              ms.created_at, s.student_name, s.email as student_email,
              a.appointment_id, a.purpose as appointment_purpose
       FROM monitoring_session ms
       JOIN student s ON ms.student_id = s.student_id
       LEFT JOIN appointment a ON ms.appointment_id = a.appointment_id
       WHERE ms.faculty_id = ?
       ORDER BY ms.date_of_monitoring DESC`,
      [facultyId]
    );

    return res.json(sessions);
  } catch (err) {
    console.error('Error fetching monitoring sessions:', err);
    return res.status(500).json({ message: 'Failed to fetch monitoring sessions' });
  }
});

// Faculty reschedule appointment
// routes/facultyAppointments.js
router.patch('/appointments/:id/reschedule', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const facultyId = req.user.id;
  const { date, time, reschedule_reason } = req.body;

  if (!date || !time || !reschedule_reason) {
    return res.status(400).json({ message: 'Date, time and reason are required' });
  }

  // First query: Check appointment exists and belongs to faculty
  const checkQuery = `
    SELECT * FROM appointment 
    WHERE appointment_id = ? AND faculty_id = ? 
    AND status IN ('pending', 'accepted')
  `;

  db.query(checkQuery, [appointmentId, facultyId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ 
        message: 'Appointment not found or not eligible for rescheduling' 
      });
    }

    const appointment = results[0];
    const currentDate = appointment.Date.toISOString().split('T')[0];
    const currentTime = appointment.Time.slice(0, 5); // Get HH:MM format
    
    // Check if date/time actually changed
    if (currentDate === date && currentTime === time) {
      return res.status(400).json({ message: 'No changes detected in date or time' });
    }

    // Validate new date/time is in the future
    const newDateTime = new Date(`${date}T${time}`);
    if (newDateTime < new Date()) {
      return res.status(400).json({ message: 'Cannot reschedule to a past date/time' });
    }

    // Check for conflicts
    const conflictQuery = `
      SELECT * FROM appointment 
      WHERE faculty_id = ? 
      AND date = ? 
      AND appointment_id != ?
      AND status NOT IN ('cancelled', 'failed', 'completed')
      AND (
        TIME(?) < ADDTIME(time, SEC_TO_TIME(duration * 60))
        AND ADDTIME(?, SEC_TO_TIME(duration * 60)) > time
      )
    `;

    db.query(
      conflictQuery, 
      [facultyId, date, appointmentId, time, time],
      (err, conflicts) => {
        if (err) {
          console.error('Conflict check error:', err);
          return res.status(500).json({ message: 'Error checking for conflicts' });
        }

        if (conflicts.length > 0) {
          return res.status(409).json({ message: 'Time slot already booked' });
        }

        // Update appointment
        const updateQuery = `
          UPDATE appointment 
          SET Date = ?, Time = ?, reschedule_reason = ?, status = 'pending', updated_at = NOW()
          WHERE appointment_id = ? AND faculty_id = ?
        `;

        db.query(
          updateQuery,
          [date, time, reschedule_reason, appointmentId, facultyId],
          (err, result) => {
            if (err) {
              console.error('Update error:', err);
              return res.status(500).json({ message: 'Failed to reschedule appointment' });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ message: 'Appointment not found' });
            }

            return res.json({ message: 'Appointment rescheduled successfully' });
          }
        );
      }
    );
  });
});


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

router.patch('/appointments/:id/status', verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const facultyId = req.user.id;

  // First get the appointment details
  const selectQuery = `
    SELECT 
      CONCAT(date, ' ', time) as datetime,
      duration,
      status
    FROM appointment
    WHERE appointment_id = ? AND faculty_id = ?
  `;

  db.query(selectQuery, [appointmentId, facultyId], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = results[0];
    
    if (appointment.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted appointments can be completed' });
    }

    // Parse the datetime string directly from MySQL (no timezone conversion)
    const [datePart, timePart] = appointment.datetime.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');
    
    // Create end time timestamp (in milliseconds)
    const endTime = new Date(year, month-1, day, hours, minutes);
    endTime.setMinutes(endTime.getMinutes() + appointment.duration);
    
    const currentTime = new Date();

    if (currentTime < endTime) {
      const timeLeft = Math.ceil((endTime - currentTime) / (1000 * 60)); // minutes remaining
      return res.status(400).json({
        message: `Appointment is not yet over. ${timeLeft} minutes remaining (ends at ${endTime.toLocaleString()})`
      });
    }

    // Update status
    const updateQuery = `
      UPDATE appointment
      SET status = 'completed', updated_at = NOW()
      WHERE appointment_id = ? AND faculty_id = ?
    `;

    db.query(updateQuery, [appointmentId, facultyId], (updateErr) => {
      if (updateErr) {
        console.error('Update error:', updateErr);
        return res.status(500).json({ message: 'Failed to complete appointment' });
      }
      return res.json({ message: 'Appointment marked as completed' });
    });
  });
});
module.exports = router;
