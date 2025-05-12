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

// ✅ Advanced: Get full student + mentor_card + course + mentor name
router.get(
  "/students/mentor-cards",
  verifyToken,
  authenticateFaculty,
  (req, res) => {
    const facultyId = req.facultyId;

    const query = `
      SELECT 
        s.Student_id,
        s.Name,
        s.Roll_no,
        s.Email AS student_email,
        s.mobile_no AS student_mobile,
        s.Address,
        s.photo,
        s.Batch,
        c.Course_name,
        f.Name AS MentorName,

        m.card_id,
        m.name_of_localgurdian,
        m.moble_no_of_localgurdent,
        m.mobile_no_of_parents,
        m.name_of_pareents,
        m.present_address,
        m.email_of_parents,
        m.any_helthissue,

        m.sgpa_sem1,  m.sgpa_sem2,  m.sgpa_sem3,  m.sgpa_sem4,  m.sgpa_sem5,
        m.sgpa_sem6,  m.sgpa_sem7,  m.sgpa_sem8,  m.sgpa_sem9,  m.sgpa_sem10,

        m.cgpa_sem1,  m.cgpa_sem2,  m.cgpa_sem3,  m.cgpa_sem4,  m.cgpa_sem5,
        m.cgpa_sem6,  m.cgpa_sem7,  m.cgpa_sem8,  m.cgpa_sem9,  m.cgpa_sem10,

        m.co_curricular_sem1,  m.co_curricular_sem2,  m.co_curricular_sem3,
        m.co_curricular_sem4,  m.co_curricular_sem5,  m.co_curricular_sem6,
        m.co_curricular_sem7,  m.co_curricular_sem8,  m.co_curricular_sem9,
        m.co_curricular_sem10,

        m.difficulty_faced_sem1,  m.difficulty_faced_sem2,  m.difficulty_faced_sem3,
        m.difficulty_faced_sem4,  m.difficulty_faced_sem5,  m.difficulty_faced_sem6,
        m.difficulty_faced_sem7,  m.difficulty_faced_sem8,  m.difficulty_faced_sem9,
        m.difficulty_faced_sem10,

        m.disciplinary_action_sem1,  m.disciplinary_action_sem2,
        m.disciplinary_action_sem3,  m.disciplinary_action_sem4,
        m.disciplinary_action_sem5,  m.disciplinary_action_sem6,
        m.disciplinary_action_sem7,  m.disciplinary_action_sem8,
        m.disciplinary_action_sem9,  m.disciplinary_action_sem10

      FROM student s
      LEFT JOIN mentor_card m ON s.Student_id = m.student_id
      LEFT JOIN course c ON s.Course_ID = c.Course_ID
      LEFT JOIN faculty f ON s.Faculty_id = f.Faculty_id
      WHERE s.Faculty_id = ?
    `;

    db.query(query, [facultyId], (err, results) => {
      if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ error: "Database error", details: err });
      }
      const formatted = results.map(row => ({
        student: {
          Student_id: row.Student_id,
          Name: row.Name,
          Roll_no: row.Roll_no,
          Email: row.student_email,
          mobile_no: row.student_mobile,
          Address: row.Address,
          photo: row.photo,
          Batch: row.Batch,
          Course_name: row.Course_name,       // ✅ corrected here
          MentorName: row.MentorName,
        },
        mentorCard: {
          card_id: row.card_id,
          name_of_localgurdian: row.name_of_localgurdian,
          moble_no_of_localgurdent: row.moble_no_of_localgurdent,
          mobile_no_of_parents: row.mobile_no_of_parents,
          name_of_pareents: row.name_of_pareents,
          present_address: row.present_address,
          email_of_parents: row.email_of_parents,
          any_helthissue: row.any_helthissue,
          ...Object.fromEntries(
            Object.entries(row).filter(([key]) =>
              key.startsWith("sgpa_sem") ||
              key.startsWith("cgpa_sem") ||
              key.startsWith("co_curricular_sem") ||
              key.startsWith("difficulty_faced_sem") ||
              key.startsWith("disciplinary_action_sem")
            )
          )
        }
      }));
      res.json(formatted);
    });
  }
);

module.exports = router;
