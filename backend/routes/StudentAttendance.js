const express = require('express');
const router = express.Router();
const { authenticateToken, verifyStudent } = require('../middleware/auth');
const sql = require('../config/neonsetup');

// Get student's attendance summary
router.get('/summary', authenticateToken, verifyStudent, async (req, res) => {
  try {
    const { erpid } = req.user;
    
    // Verify session_id column exists
    const columnCheck = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'attendance_logs' 
        AND column_name = 'session_id'
      ) as exists
    `;
    
    if (!columnCheck[0].exists) {
      throw new Error('Database schema mismatch: session_id column missing from attendance_logs');
    }

    // Get student info
    const student = await sql`
      SELECT department_id, semester 
      FROM students 
      WHERE erpid = ${erpid}
    `;
    
    if (student.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }
    
    const { department_id, semester } = student[0];
    
    // Get subjects
    const subjects = await sql`
      SELECT subject_id, name 
      FROM subjects 
      WHERE department_id = ${department_id}
      AND semester = ${semester}
    `;
    
    // Process attendance for each subject
    const attendanceSummary = await Promise.all(
      subjects.map(async (subject) => {
        const [totalSessions, attendedSessions] = await Promise.all([
          sql`
            SELECT COUNT(*) as count
            FROM sessions 
            WHERE subject_id = ${subject.subject_id}
            AND department_id = ${department_id}
            AND semester = ${semester}
          `,
          sql`
            SELECT COUNT(*) as count
            FROM attendance_logs
            WHERE detected_erpid = ${erpid}
            AND session_id IN (
              SELECT session_id FROM sessions 
              WHERE subject_id = ${subject.subject_id}
            )
          `
        ]);
        
        const total = parseInt(totalSessions[0].count);
        const attended = parseInt(attendedSessions[0].count);
        
        return {
          subjectId: subject.subject_id,
          subjectName: subject.name,
          totalSessions: total,
          attendedSessions: attended,
          percentage: total > 0 ? Math.round((attended / total) * 100) : 0
        };
      })
    );
    
    res.json({ 
      success: true, 
      data: attendanceSummary 
    });
    
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestion: process.env.NODE_ENV === 'development' ? 
        'Run this SQL command: ALTER TABLE attendance_logs ADD COLUMN session_id INTEGER REFERENCES sessions(session_id);' : 
        undefined
    });
  }
});

// Get detailed attendance records
router.get('/details', authenticateToken, verifyStudent, async (req, res) => {
  try {
    const { erpid } = req.user;
    const { subjectId, limit = 20, offset = 0 } = req.query;
    
    // Validate subjectId if provided
    if (subjectId && isNaN(subjectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID'
      });
    }
    
    // Base query
    let query = sql`
      SELECT 
        al.id, 
        al.timestamp, 
        al.location, 
        s.subject_id, 
        sub.name as subject_name,
        s.session_date, 
        s.start_time, 
        s.end_time,
        f.name as faculty_name
      FROM attendance_logs al
      JOIN sessions s ON al.session_id = s.session_id
      JOIN subjects sub ON s.subject_id = sub.subject_id
      JOIN faculty f ON s.faculty_erpid = f.erpid
      WHERE al.detected_erpid = ${erpid}
    `;
    
    // Add subject filter if provided
    if (subjectId) {
      query = sql`${query} AND s.subject_id = ${subjectId}`;
    }
    
    // Add pagination
    query = sql`
      ${query}
      ORDER BY al.timestamp DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;
    
    const result = await query;
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestion: process.env.NODE_ENV === 'development' ? 
        'Run this SQL command: ALTER TABLE attendance_logs ADD COLUMN session_id INTEGER REFERENCES sessions(session_id);' : 
        undefined
    });
  }
});

module.exports = router;