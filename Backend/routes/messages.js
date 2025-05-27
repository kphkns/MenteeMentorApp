// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const db = require('../db'); // your db connection
// const verifyToken = require('../middleware/verifyToken');

// // Upload config
// const storage = multer.diskStorage({
//   destination: './uploads/messages/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// /**
//  * ✅ GET mentee students of the logged-in faculty
//  * GET /api/faculty/students
//  */
// router.get('/faculty/students', verifyToken, async (req, res) => {
//   const facultyId = req.user.id;
//   if (req.user.role !== 'faculty') {
//     return res.status(403).json({ error: 'Unauthorized. Only faculty can access this.' });
//   }

//   try {
//     const [students] = await db.query(
//       'SELECT * FROM student WHERE Faculty_id = ?',
//       [facultyId]
//     );
//     res.json(students);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error while fetching students.' });
//   }
// });

// /**
//  * ✅ POST a new message
//  * POST /api/messages/send
//  */
// router.post('/messages/send', verifyToken, upload.single('attachment'), async (req, res) => {
//   const { receiver_id, receiver_role, subject, body, link_url } = req.body;
//   const sender_id = req.user.id;
//   const sender_role = req.user.role;

//   let attachment_path = null;
//   let attachment_type = null;

//   if (req.file) {
//     attachment_path = `/uploads/messages/${req.file.filename}`;
//     attachment_type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
//   } else if (link_url) {
//     attachment_type = 'link';
//   }

//   try {
//     // 🔐 Role-Based Messaging Rules
//     if (sender_role === 'student') {
//       const [student] = await db.query('SELECT Faculty_id FROM student WHERE Student_id = ?', [sender_id]);
//       if (!student.length || parseInt(student[0].Faculty_id) !== parseInt(receiver_id) || receiver_role !== 'faculty') {
//         return res.status(403).json({ error: 'You can only message your assigned faculty.' });
//       }

//     } else if (sender_role === 'faculty') {
//       const [student] = await db.query('SELECT Faculty_id FROM student WHERE Student_id = ?', [receiver_id]);
//       if (!student.length || parseInt(student[0].Faculty_id) !== parseInt(sender_id) || receiver_role !== 'student') {
//         return res.status(403).json({ error: 'You can only message your mentee students.' });
//       }

//     } else if (sender_role === 'admin') {
//       // Admin can message anyone
//     } else {
//       return res.status(403).json({ error: 'Invalid sender role.' });
//     }

//     await db.query(`
//       INSERT INTO messages (
//         sender_id, sender_role, receiver_id, receiver_role,
//         subject, body, attachment_path, attachment_type, link_url
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [sender_id, sender_role, receiver_id, receiver_role,
//        subject, body, attachment_path, attachment_type, link_url]);

//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error while sending message.' });
//   }
// });

// /**
//  * ✅ GET inbox messages for logged-in user
//  * GET /api/messages/inbox
//  */
// router.get('/messages/inbox', verifyToken, async (req, res) => {
//   const { id, role } = req.user;
//   try {
//     const [messages] = await db.query(
//       'SELECT * FROM messages WHERE receiver_id = ? AND receiver_role = ? ORDER BY timestamp DESC',
//       [id, role]
//     );
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error while fetching inbox.' });
//   }
// });

// /**
//  * ✅ Mark message as read
//  * PATCH /api/messages/:id/read
//  */
// router.patch('/messages/:id/read', verifyToken, async (req, res) => {
//   const messageId = req.params.id;
//   try {
//     await db.query('UPDATE messages SET is_read = 1 WHERE message_id = ?', [messageId]);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error while updating message read status.' });
//   }
// });

// module.exports = router;
// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const db = require('../db'); // your db connection
// const verifyToken = require('../middleware/verifyToken');

// // Upload config
// const storage = multer.diskStorage({
//   destination: './uploads/messages/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// /**
//  * ✅ GET mentee students of the logged-in faculty
//  * GET /api/faculty/students
//  */
// router.get('/faculty/students', verifyToken, async (req, res) => {
//   const facultyId = req.user.id;
//   if (req.user.role !== 'faculty') {
//     return res.status(403).json({ error: 'Unauthorized. Only faculty can access this.' });
//   }

//   try {
//     const [students] = await db.query(
//       'SELECT * FROM student WHERE Faculty_id = ?',
//       [facultyId]
//     );
//     res.json(students);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error while fetching students.' });
//   }
// });

// /**
//  * ✅ POST a new message
//  * POST /api/messages/send
//  */
// router.post('/messages/send', verifyToken, upload.single('attachment'), async (req, res) => {
//   const { receiver_id, receiver_role, subject, body, link_url } = req.body;
//   const sender_id = req.user.id;
//   const sender_role = req.user.role;

//   let attachment_path = null;
//   let attachment_type = null;

//   if (req.file) {
//     attachment_path = `/uploads/messages/${req.file.filename}`;
//     attachment_type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
//   } else if (link_url) {
//     attachment_type = 'link';
//   }

//   try {
//     // 🔐 Role-Based Messaging Rules
//     if (sender_role === 'student') {
//       const [student] = await db.query('SELECT Faculty_id FROM student WHERE Student_id = ?', [sender_id]);
//       if (!student.length || parseInt(student[0].Faculty_id) !== parseInt(receiver_id) || receiver_role !== 'faculty') {
//         return res.status(403).json({ error: 'You can only message your assigned faculty.' });
//       }

//     } else if (sender_role === 'faculty') {
//       const [student] = await db.query('SELECT Faculty_id FROM student WHERE Student_id = ?', [receiver_id]);
//       if (!student.length || parseInt(student[0].Faculty_id) !== parseInt(sender_id) || receiver_role !== 'student') {
//         return res.status(403).json({ error: 'You can only message your mentee students.' });
//       }

//     } else if (sender_role === 'admin') {
//       // Admin can message anyone
//     } else {
//       return res.status(403).json({ error: 'Invalid sender role.' });
//     }

//     await db.query(`
//       INSERT INTO messages (
//         sender_id, sender_role, receiver_id, receiver_role,
//         subject, body, attachment_path, attachment_type, link_url
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [sender_id, sender_role, receiver_id, receiver_role,
//        subject, body, attachment_path, attachment_type, link_url]);

//     res.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error while sending message.' });
//   }
// });

// /**
//  * ✅ GET inbox messages for logged-in user
//  * GET /api/messages/inbox
//  */
// router.get('/messages/inbox', verifyToken, async (req, res) => {
//   const { id, role } = req.user;
//   try {
//     const [messages] = await db.query(
//       'SELECT * FROM messages WHERE receiver_id = ? AND receiver_role = ? ORDER BY timestamp DESC',
//       [id, role]
//     );
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: 'Server error while fetching inbox.' });
//   }
// });

// /**
//  * ✅ Mark message as read
//  * PATCH /api/messages/:id/read
//  */
// router.patch('/messages/:id/read', verifyToken, async (req, res) => {
//   const messageId = req.params.id;
//   try {
//     await db.query('UPDATE messages SET is_read = 1 WHERE message_id = ?', [messageId]);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: 'Server error while updating message read status.' });
//   }
// });

// module.exports = router;
