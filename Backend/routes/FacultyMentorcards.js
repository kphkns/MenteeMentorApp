const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/verifyToken");

// ✅ Middleware: Faculty Authentication
const authenticateFaculty = (req, res, next) => {
  const facultyId = req.user?.id;
  if (!facultyId) return res.status(401).json({ message: "Unauthorized" });
  req.facultyId = facultyId;
  next();
};

// ✅ Basic: Get students assigned to the faculty
router.get(
  "/students/by-faculty",
  verifyToken,
  authenticateFaculty,
  (req, res) => {
    const facultyId = req.facultyId;
    const query = `
      SELECT Student_id, Name, Roll_no, Email, mobile_no, Address, photo, Batch 
      FROM student 
      WHERE Faculty_id = ?
    `;
    db.query(query, [facultyId], (err, results) => {
      if (err) return res.status(500).json({ error: "DB Error", details: err });
      res.json(results);
    });
  }
);


module.exports = router;
