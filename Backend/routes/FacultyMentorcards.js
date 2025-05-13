const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

// Middleware: Faculty Authentication
const authenticateFaculty = (req, res, next) => {
  const facultyId = req.user?.id;
  if (!facultyId) return res.status(401).json({ message: "Unauthorized" });
  req.facultyId = facultyId;
  next();
};

// ✅ Route to get students assigned to a faculty, with names instead of IDs
router.get(
  "/students/by-faculty",
  verifyToken,
  authenticateFaculty,
  (req, res) => {
    const facultyId = req.facultyId;
    const query = `
      SELECT 
        s.Student_id, s.Name, s.Roll_no, s.Email, s.mobile_no, s.Address, s.photo,
        b.batch_name AS batch_name,
        c.Course_name AS Course_name,
        f.Name AS MentorName
      FROM student s
      JOIN batch b ON s.Batch = b.Batch_id
      JOIN course c ON s.Course_ID = c.Course_ID
      JOIN faculty f ON s.Faculty_id = f.Faculty_id
      WHERE s.Faculty_id = ?
    `;
    db.query(query, [facultyId], (err, results) => {
      if (err) return res.status(500).json({ error: "DB Error", details: err });
      res.json(results);
    });
  }
);

module.exports = router;
