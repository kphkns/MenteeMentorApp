// const express = require('express');
// const router = express.Router();
// const db = require('../db'); // Adjust if needed

// // routes/student.js
// router.get('/:id', async (req, res) => {
//   const { id } = req.params;
//   try {
//     const [rows] = await db.execute('SELECT * FROM student WHERE Student_id = ?', [id]);
//     if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
//     res.json(rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Database error' });
//   }
// });


// module.exports = router;
