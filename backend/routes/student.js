const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { authenticateToken } = require('../middleware/auth');
const sql = require('../config/neonsetup');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');
require("dotenv").config({path: path.join(__dirname, '../.env')});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error("CLOUDINARY_CLOUD_NAME missing");
}else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// temporary storage folder
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
})

// Login student
router.post('/login', async (req, res) => {
  try {
    const { erpid, password } = req.body;
    
    if (!erpid || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'ERP ID and password are required'
      });
    }

    // Find student by erpid
    const student = await Student.findByErp(erpid);
    if (!student) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials', // More secure to not specify which part was wrong
        details: 'Invalid ERP ID or password'
      });
    }

    // Check password
    const isMatch = await Student.comparePassword(password, student.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials',
        details: 'Invalid ERP ID or password' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: student.id, 
        erpid: student.erpid, 
        role: 'student',
        departmentId: student.departmentId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return response
    res.json({
      success: true,
      token,
      user: {
        id: student.id,
        erpid: student.erpid,
        name: student.name,
        email: student.email,
        role: 'student',
        departmentId: student.departmentId,
        semester: student.semester
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Change password - protected route
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required."
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password."
      });
    }

    // Basic password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long."
      });
    }

    const student = await Student.findByErp(req.user.erpid);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    const isValid = await Student.comparePassword(currentPassword, student.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect."
      });
    }

    // Update password in db
    const updated = await Student.updatePassword(req.user.erpid, newPassword);
    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update password."
      });
    }
    
    res.json({
      success: true,
      message: "Password changed successfully."
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: "Failed to change password.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get student profile - protected route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Use the Student model's getStudentProfile method
    const profile = await Student.getStudentProfile(req.user.erpid);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Format date of birth
    const dob = profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : null;
    
    // Return response
    res.json({
      success: true,
      data: {
        erpid: profile.erpid,
        name: profile.name,
        email: profile.email,
        department: profile.departmentName || `Department ID: ${profile.departmentId}`,
        departmentId: profile.departmentId,
        contactNo: profile.contactNo,
        dob,
        year: profile.year,
        division: profile.division,
        rollNo: profile.rollNo,
        gender: profile.gender,
        classTeacher: profile.classTeacherName || `ERP ID: ${profile.classTeacher}`,
        classTeacherId: profile.classTeacher,
        semester: profile.semester,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        elective_subject_id : profile.elective_subject_id,
      }
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Get student subjects - protected route
router.get('/subjects', authenticateToken, async (req, res) => {
  try {
    // Get student profile for department/year/semester/elective info
    const profile = await Student.getStudentProfile(req.user.erpid);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Fetch subjects from attendance_summary joined with subjects table
    const subjects = await sql`
    SELECT 
    subject_id,
    subject_code,
    name,
    department_id,
    year,
    semester
    FROM subjects
    WHERE department_id = ${profile.departmentId}
      AND year = ${profile.year}
      AND semester = ${profile.semester}
      AND (
        is_elective = false
        OR subject_id = ${profile.elective_subject_id}
      )
    ORDER BY name ASC`;
    console.log("hello",subjects);
    res.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error("Subjects fetch error:", error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/attendance-summary', authenticateToken, async (req, res) => {
  try {
    const profile = await Student.getStudentProfile(req.user.erpid);

    const attendance = await sql`
      SELECT 
        a.student_erpid,
        a.subject_id,
        s.name AS subject_name,
        a.total_sessions,
        a.attended_sessions,
        a.updated_at
      FROM attendance_summary a
      JOIN subjects s 
        ON a.subject_id = s.subject_id
      WHERE a.student_erpid = ${profile.erpid}
        AND s.department_id = ${profile.departmentId}
        AND s.year = ${profile.year}
        AND s.semester = ${profile.semester};
    `;
    console.log("frm summary",attendance)
    res.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance: from summary', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// // Get student subjects - protected route
// router.get('/subjects', authenticateToken, async (req, res) => {
//   try {
//     // Get student profile to get department, year, and semester
//     const profile = await Student.getStudentProfile(req.user.erpid);
    
//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: 'Student profile not found'
//       });
//     }

//     // Import sql for database query
   

//     // Fetch subjects based on student's department, year, and semester
//     const subjects = await sql`
//       SELECT 
//         subject_id,
//         subject_code,
//         name,
//         department_id,
//         year,
//         semester
//       FROM subjects 
//       WHERE department_id = ${profile.departmentId}
//         AND year = ${profile.year}
//         AND semester = ${profile.semester}
//       ORDER BY name ASC
//     `;

//     res.json({
//       success: true,
//       data: subjects
//     });
//   } catch (error) {
//     console.error("Subjects fetch error:", error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch subjects',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

router.get('/attendance', authenticateToken, async (req, res) => {
  try {
    const profile = await Student.getStudentProfile(req.user.erpid);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    
    // Get all subjects for this student
    const subjects = await sql`
      SELECT subject_id, subject_code, name
      FROM subjects
      WHERE department_id = ${profile.departmentId}
        AND year = ${profile.year}
        AND semester = ${profile.semester}
      ORDER BY name ASC
    `;
    
    const attendanceData = [];
    const currentDate = new Date().toISOString().split('T')[0]; // Get today's date
    
    for (const subj of subjects) {
      // Total completed sessions (only past sessions)
      const totalSessionsResult = await sql`
        SELECT COUNT(*) AS total
        FROM sessions
        WHERE subject_id = ${subj.subject_id}
          AND department_id = ${profile.departmentId}
          AND year = ${profile.year}
          AND semester = ${profile.semester}
          AND division = ${profile.division}  
          AND session_date <= ${currentDate} 
      `;
      const totalSessions = totalSessionsResult[0]?.total || 0;
      
      // Distinct presents (to avoid duplicate logs)
      const presentResult = await sql`
        SELECT COUNT(DISTINCT al.session_id) AS present
        FROM attendance_logs_test al
        JOIN sessions s ON al.session_id = s.session_id
        WHERE al.detected_erpid = ${profile.erpid}
          AND s.subject_id = ${subj.subject_id}
          AND s.department_id = ${profile.departmentId}
          AND s.year = ${profile.year}
          AND s.semester = ${profile.semester}
          AND s.division = ${profile.division}  
      `;
      const present = presentResult[0]?.present || 0;
      
      const percentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;
      
      attendanceData.push({
        subject_id: subj.subject_id,
        subject_code: subj.subject_code,
        name: subj.name,
        total: totalSessions,
        present,
        absent: totalSessions - present,
        percentage
      });
    }
    
    res.json({ success: true, data: attendanceData });
  } catch (error) {
    console.error('Subject-wise attendance fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subject-wise attendance', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// // Get subject-wise attendance for student
// router.get('/attendance', authenticateToken, async (req, res) => {
//   try {
//     const profile = await Student.getStudentProfile(req.user.erpid);
//     if (!profile) {
//       return res.status(404).json({ success: false, message: 'Student profile not found' });
//     }
    
//     // Get all subjects for this student
//     const subjects = await sql`
//       SELECT subject_id, subject_code, name
//       FROM subjects
//       WHERE department_id = ${profile.departmentId}
//         AND year = ${profile.year}
//         AND semester = ${profile.semester}
//       ORDER BY name ASC
//     `;
    
//     // For each subject, count total sessions and presents
//     const attendanceData = [];
//     for (const subj of subjects) {
//       // Total sessions for this subject (all sessions, regardless of attendance)
//       const totalSessionsResult = await sql`
//         SELECT COUNT(*) AS total
//         FROM sessions
//         WHERE subject_id = ${subj.subject_id}
//           AND department_id = ${profile.departmentId}
//           AND year = ${profile.year}
//           AND semester = ${profile.semester}
//       `;
//       const totalSessions = totalSessionsResult[0]?.total || 0;
      
//       // Presents for this subject (only sessions where student was detected)
//       const presentResult = await sql`
//         SELECT COUNT(*) AS present
//         FROM attendance_logs_test al
//         JOIN sessions s ON al.session_id = s.session_id
//         WHERE al.detected_erpid = ${profile.erpid}
//           AND s.subject_id = ${subj.subject_id}
//           AND s.department_id = ${profile.departmentId}
//           AND s.year = ${profile.year}
//           AND s.semester = ${profile.semester}
//       `;
//       const present = presentResult[0]?.present || 0;
      
//       const percentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;
      
//       attendanceData.push({
//         subject_id: subj.subject_id,
//         subject_code: subj.subject_code,
//         name: subj.name,
//         total: totalSessions,
//         present,
//         absent: totalSessions - present,
//         percentage
//       });
//     }
    
//     res.json({ success: true, data: attendanceData });
//   } catch (error) {
//     console.error('Subject-wise attendance fetch error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch subject-wise attendance', 
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined 
//     });
//   }
// });


router.get('/attendance/overall', authenticateToken, async (req, res) => {
  try {
    const profile = await Student.getStudentProfile(req.user.erpid);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Get total completed sessions
    const totalSessionsResult = await sql`
      SELECT COUNT(*) AS total
      FROM sessions
      WHERE department_id = ${profile.departmentId}
        AND year = ${profile.year}
        AND semester = ${profile.semester}
        AND division = ${profile.division} 
        AND session_date <= ${currentDate}  
    `;
    const totalSessions = totalSessionsResult[0]?.total || 0;
    
    // Get distinct present sessions
    const presentResult = await sql`
      SELECT COUNT(DISTINCT al.session_id) AS present
      FROM attendance_logs_test al
      JOIN sessions s ON al.session_id = s.session_id
      WHERE al.detected_erpid = ${profile.erpid}
        AND s.department_id = ${profile.departmentId}
        AND s.year = ${profile.year}
        AND s.semester = ${profile.semester}
        AND s.division = ${profile.division} 
    `;
    const present = presentResult[0]?.present || 0;
    
    const percentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;
    
    res.json({ 
      success: true, 
      data: { 
        total: totalSessions, 
        present, 
        absent: totalSessions - present, 
        percentage 
      } 
    });
  } catch (error) {
    console.error('Overall attendance fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch overall attendance', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// // Get overall attendance for student
// router.get('/attendance/overall', authenticateToken, async (req, res) => {
//   try {
//     const profile = await Student.getStudentProfile(req.user.erpid);
//     if (!profile) {
//       return res.status(404).json({ success: false, message: 'Student profile not found' });
//     }
    
//     // Get total sessions for this student's department/year/semester
//     const totalSessionsResult = await sql`
//       SELECT COUNT(*) AS total
//       FROM sessions
//       WHERE department_id = ${profile.departmentId}
//         AND year = ${profile.year}
//         AND semester = ${profile.semester}
//     `;
//     const totalSessions = totalSessionsResult[0]?.total || 0;
    
//     // Get presents for this student
//     const presentResult = await sql`
//       SELECT COUNT(*) AS present
//       FROM attendance_logs_test al
//       JOIN sessions s ON al.session_id = s.session_id
//       WHERE al.detected_erpid = ${profile.erpid}
//         AND s.department_id = ${profile.departmentId}
//         AND s.year = ${profile.year}
//         AND s.semester = ${profile.semester}
//     `;
//     const present = presentResult[0]?.present || 0;
    
//     const percentage = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 0;
    
//     res.json({ 
//       success: true, 
//       data: { 
//         total: totalSessions, 
//         present, 
//         absent: totalSessions - present, 
//         percentage 
//       } 
//     });
//   } catch (error) {
//     console.error('Overall attendance fetch error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch overall attendance', 
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// Update student profile - simplified without express-validator
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, contactNo, dob, gender } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    const updateData = {
      name: name.trim(),
      email: email.trim(),
      contactNo: contactNo ? contactNo.trim() : null,
      dob: dob || null,
      gender: gender || null
    };

    const updatedStudent = await Student.update(req.user.erpid, updateData);

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Format date for response
    if (updatedStudent.dob) {
      updatedStudent.dob = new Date(updatedStudent.dob).toISOString().split('T')[0];
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedStudent
    });

  } catch (error) {
    console.error('Profile update error:', error);
    if (error.message && error.message.includes('unique constraint') && error.message.includes('email')) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        field: 'email'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post("/transcript", authenticateToken, upload.single("details_file"), async (req, res) => {
  let filepath; // declare once so it’s accessible in finally
  try {
    const { erpid } = req.user;
    const { firstname, lastname, prnno, dob, gender, yearofjoin, yearofpass, department_id, course, mobno, emailaddress } = req.body;
    console.log(req.body);
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Details file is required' });
    }

    filepath = req.file.path;

    const details = await cloudinary.uploader.upload(filepath, {
      folder: 'transcripts',
      resource_type: 'raw',
      public_id: `transcripts/${erpid}_${Date.now()}.pdf`,
      use_filename: false,
      unique_filename: false
    });

    const result = await sql`
      INSERT INTO transcript_requests (
        studenterpid, firstname, lastname, prnno, dob, gender, yearofjoin, yearofpass,
        department_id, course, mobno, fileurl, public_id, emailaddress
      ) VALUES (
        ${erpid}, ${firstname}, ${lastname}, ${prnno}, ${dob}, ${gender}, ${yearofjoin}, ${yearofpass},
        ${department_id}, ${course}, ${mobno}, ${details.secure_url}, ${details.public_id}, ${emailaddress}
      ) RETURNING *;
    `;

    res.json({ success: true, message: "Transcript created successfully", data: result[0] });

  } catch (error) {
    console.error("Transcript fetch error:", error);
    res.status(500).json({ success: false, message: "Server error while creating transcript" });
  } finally {
    if (filepath) {
      fs.unlink(filepath, err => {
        if (err) console.error("Temp file cleanup failed:", err);
      });
    }
  }
});

router.post("/transcript-details", authenticateToken, async (req, res) => {
  try {
    const {
      transcript_id,
      sem1_cgpa,
      sem1_percentage,
      sem2_cgpa,
      sem2_percentage,
      sem3_cgpa,
      sem3_percentage,
      sem4_cgpa,
      sem4_percentage,
      sem5_cgpa,
      sem5_percentage,
      sem6_cgpa,
      sem6_percentage,
      sem7_cgpa,
      sem7_percentage,
      sem8_cgpa,
      sem8_percentage,
    } = req.body;

    if (!transcript_id) {
      return res.status(400).json({ success: false, message: "transcript_id is required" });
    }

    // Insert into transcript_details table
    const result = await sql`
      INSERT INTO transcript_details (
        transcript_id,
        sem1_cgpa, sem1_percentage,
        sem2_cgpa, sem2_percentage,
        sem3_cgpa, sem3_percentage,
        sem4_cgpa, sem4_percentage,
        sem5_cgpa, sem5_percentage,
        sem6_cgpa, sem6_percentage,
        sem7_cgpa, sem7_percentage,
        sem8_cgpa, sem8_percentage
      ) VALUES (
        ${transcript_id},
        ${sem1_cgpa}, ${sem1_percentage},
        ${sem2_cgpa}, ${sem2_percentage},
        ${sem3_cgpa}, ${sem3_percentage},
        ${sem4_cgpa}, ${sem4_percentage},
        ${sem5_cgpa}, ${sem5_percentage},
        ${sem6_cgpa}, ${sem6_percentage},
        ${sem7_cgpa}, ${sem7_percentage},
        ${sem8_cgpa}, ${sem8_percentage}
      ) RETURNING *;
    `;

    res.status(201).json({
      success: true,
      message: "Transcript details saved successfully",
      data: result[0],
    });

  } catch (error) {
    console.error("Transcript details error:", error);
    res.status(500).json({ success: false, message: "Server error while saving transcript details" });
  }
});

// Get all transcript requests for the logged-in student, with optional details
router.get('/transcripts', authenticateToken, async (req, res) => {
  try {
    const { erpid } = req.user;

    // Fetch requests with details if present
    const rows = await sql`
      SELECT 
        tr.request_id,
        tr.studenterpid,
        tr.firstname,
        tr.lastname,
        tr.prnno,
        tr.dob,
        tr.gender,
        tr.yearofjoin,
        tr.yearofpass,
        tr.department_id,
        tr.course,
        tr.mobno,
        tr.emailaddress,
        tr.fileurl,
        tr.public_id,
        tr.uploaded_at,
        tr.status,
        tr.approved_at,
        tr.feestatus,
        td.sem1_cgpa,
        td.sem1_percentage,
        td.sem2_cgpa,
        td.sem2_percentage,
        td.sem3_cgpa,
        td.sem3_percentage,
        td.sem4_cgpa,
        td.sem4_percentage,
        td.sem5_cgpa,
        td.sem5_percentage,
        td.sem6_cgpa,
        td.sem6_percentage,
        td.sem7_cgpa,
        td.sem7_percentage,
        td.sem8_cgpa,
        td.sem8_percentage,
        tr.transcript_url
      FROM transcript_requests tr
      LEFT JOIN transcript_details td ON td.transcript_id = tr.request_id
      WHERE tr.studenterpid = ${erpid}
      ORDER BY tr.uploaded_at DESC
    `;
    console.log(rows)
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch transcripts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transcripts' });
  }
});

module.exports = router;