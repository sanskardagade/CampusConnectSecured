const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const sql = require('../config/neonsetup');
const RegistrarModel = require('../models/Registrar.js');
const { verifyRegistrar } = require('../middleware/auth');
const PDFDocument = require('pdfkit');



// SECURITY DASHBOARD ENDPOINTS
router.get('/security-dashboard', async (req, res) => {
  try {
    let date = req.query.date;
    if (!date) {
      date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    console.log('[SECURITY DASHBOARD] Querying for date:', date);
    console.log('[SECURITY DASHBOARD] Date type:', typeof date);
    
    // SIMPLE QUERY - Since fromDate/toDate are DATE types, no timezone issues!
    const leaveRows = await sql`
      SELECT 
        fl.*,
        f.name as faculty_name, 
        f.department_id, 
        f.email,
        fl."HodApproval",
        fl."PrincipalApproval",
        fl."FinalStatus",
        fl."exitStatus"
      FROM faculty_leave fl
      LEFT JOIN faculty f ON fl."ErpStaffId" = f.erpid
      WHERE 
        ${date}::DATE BETWEEN fl."fromDate" AND fl."toDate"
      ORDER BY fl."StaffName" ASC
    `;
    
    console.log('[SECURITY DASHBOARD] Rows returned:', leaveRows.length);
    
    // DEBUG: Check what's actually in the database
    if (leaveRows.length === 0) {
      console.log('[DEBUG] No records found for date:', date);
      
      const allRecords = await sql`
        SELECT 
          id, 
          "StaffName", 
          "ErpStaffId", 
          "fromDate", 
          "toDate",
          "FinalStatus"
        FROM faculty_leave 
        WHERE "fromDate" <= ${date}::DATE 
          AND "toDate" >= ${date}::DATE
        ORDER BY "fromDate" DESC
        LIMIT 10
      `;
      
      console.log('[DEBUG] Records that should match:', allRecords);
    }
    
    res.json(leaveRows || []);
  } catch (err) {
    console.error('Error fetching security dashboard data:', err);    
    res.status(500).json({ 
      error: 'Failed to fetch security dashboard data',
      details: err.message 
    });
  }
});

// DEBUG: Check database contents
router.get('/security-dashboard/debug', async (req, res) => {
  try {
    const allRecords = await sql`
      SELECT 
        id, 
        "StaffName", 
        "ErpStaffId", 
        "fromDate", 
        "toDate",
        "FinalStatus",
        "exitStatus"
      FROM faculty_leave 
      ORDER BY "fromDate" DESC
      LIMIT 20
    `;
    
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = await sql`
      SELECT COUNT(*) as count 
      FROM faculty_leave 
      WHERE ${today}::DATE BETWEEN "fromDate" AND "toDate"
    `;
    
    res.json({
      today: today,
      total_records: allRecords.length,
      today_records: todayRecords[0].count,
      recent_records: allRecords
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message });
  }
});

// EXIT/UNEXIT endpoints (simplified)
router.post('/security-dashboard/exit', async (req, res) => {
  try {
    const { erpStaffId } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const result = await sql`
      UPDATE faculty_leave
      SET "exitStatus" = TRUE, "exit_time" = NOW()
      WHERE "ErpStaffId" = ${erpStaffId} 
        AND ${today}::DATE BETWEEN "fromDate" AND "toDate"
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ 
        error: 'No leave record found for today',
        details: `No leave application found for ERP ID: ${erpStaffId} on date: ${today}`
      });
    }

    res.json({ 
      message: 'Faculty exit marked successfully', 
      record: result[0] 
    });
  } catch (err) {
    console.error('Error marking faculty exit:', err);
    res.status(500).json({ error: 'Failed to mark exit' });
  }
});

router.post('/security-dashboard/unexit', async (req, res) => {
  try {
    const { erpStaffId } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const result = await sql`
      UPDATE faculty_leave
      SET "exitStatus" = FALSE, "exit_time" = NULL
      WHERE "ErpStaffId" = ${erpStaffId}
        AND ${today}::DATE BETWEEN "fromDate" AND "toDate"
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ 
        error: 'No exited record found for today',
        details: `No exit record found for ERP ID: ${erpStaffId} on date: ${today}`
      });
    }

    res.json({ 
      message: 'Faculty exit unmarked successfully', 
      record: result[0] 
    });
  } catch (err) {
    console.error('Error unmarking faculty exit:', err);
    res.status(500).json({ error: 'Failed to unmark exit' });
  }
});



// Protect all registrar routes
router.use(authenticateToken);
router.use(verifyRegistrar);


// route to get all members
router.get('/all-members', async (req, res) => {
  try {
    // Get all members across all departments and types
    const [students, faculty, staff] = await Promise.all([
      sql`SELECT id, erpid, name, email, 'students' AS type FROM students`,
      sql`SELECT id, erpid, name, email, 'faculty' AS type FROM faculty WHERE is_active = true`,
      sql`SELECT id, erpid, name, email, 'staff' AS type FROM non_teaching_staff`
    ]);

    const allMembers = [...students, ...faculty, ...staff];
    res.json({ members: allMembers });
  } catch (error) {
    console.error('Error fetching all members:', error);
    res.status(500).json({ error: 'Failed to fetch all members' });
  }
});

// Registrar Profile Routes
router.get('/profile', async (req, res) => {
  try {
    console.log('Fetching Registrar profile for:', req.user.id);

    const [registrar] = await sql`
      SELECT 
        id, 
        erpid AS erpStaffId, 
        name, 
        email, 
        start_date AS startDate, 
        end_date AS endDate, 
        is_active AS isActive
      FROM registrar
      WHERE erpid = ${req.user.id}
    `;

    if (!registrar) {
      console.log('Registrar not found');
      return res.status(404).json({ message: 'Registrar not found' });
    }

    console.log('Profile fetched successfully');
    res.json(registrar);

  } catch (error) {
    console.error('Profile fetch error:', error);
    const status = error.code === '42P01' ? 404 : 500;
    const message = error.code === '42P01' 
      ? 'Registrar table not found' 
      : 'Failed to fetch profile';
    res.status(status).json({ message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log('Updating profile for:', req.user.id);

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const [updatedRegistrar] = await sql`
      UPDATE registrar
      SET 
        name = ${name},
        email = ${email},
        updated_at = NOW()
      WHERE erpid = ${req.user.id}
      RETURNING 
        id, 
        erpid AS erpStaffId, 
        name, 
        email, 
        start_date AS startDate, 
        end_date AS endDate, 
        is_active AS isActive
    `;

    if (!updatedRegistrar) {
      return res.status(404).json({ message: 'Registrar not found' });
    }

    console.log('Profile updated successfully');
    res.json(updatedRegistrar);

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Dashboard Data Routes
router.get('/dashboard', async (req, res) => {
  try {
    console.log('Fetching dashboard data for registrar');

    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*) FROM departments) AS departments,
        (SELECT COUNT(*) FROM students) AS students,
        (SELECT COUNT(*) FROM faculty WHERE is_active = true) AS faculty,
        (SELECT COUNT(*) FROM non_teaching_staff) AS staff
    `;

    const departments = await sql`
      SELECT id, name, short_code AS code
      FROM departments
      ORDER BY name
    `;

    res.json({ stats, departments });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

// Student Management Routes
router.get('/students', async (req, res) => {
  try {
    const { department, year, search } = req.query;
    let query = sql`
      SELECT 
        s.id,
        s.erpid,
        s.name,
        s.email,
        s.contact_no,
        s.department,
        s.year,
        s.semester,
        s.is_active,
        d.name as department_name
      FROM students s
      LEFT JOIN departments d ON s.department = d.id
      WHERE s.is_active = true
    `;

    if (department) {
      query = sql`${query} AND s.department = ${department}`;
    }
    if (year) {
      query = sql`${query} AND s.year = ${year}`;
    }
    if (search) {
      query = sql`${query} AND (s.name ILIKE ${'%' + search + '%'} OR s.erpid ILIKE ${'%' + search + '%'})`;
    }

    query = sql`${query} ORDER BY s.name`;

    const students = await query;
    res.json({ students });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Faculty Management Routes
router.get('/faculty', async (req, res) => {
  try {
    const { department, search } = req.query;
    let query = sql`
      SELECT 
        f.id,
        f.erpid,
        f.name,
        f.email,
        f.department_id,
        f.is_active,
        d.name as department_name
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE f.is_active = true
    `;

    if (department) {
      query = sql`${query} AND f.department_id = ${department}`;
    }
    if (search) {
      query = sql`${query} AND (f.name ILIKE ${'%' + search + '%'} OR f.erpid ILIKE ${'%' + search + '%'})`;
    }

    query = sql`${query} ORDER BY f.name`;

    const faculty = await query;
    res.json({ faculty });

  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// Add new faculty member
router.post('/faculty', async (req, res) => {
  try {
    const { erpid, name, email, department_id, password } = req.body;
    
    console.log('Received faculty data:', { erpid, name, email, department_id, password });
    
    if (!erpid || !name || !email || !department_id || !password) {
      console.log('Missing required fields:', { erpid: !!erpid, name: !!name, email: !!email, department_id: !!department_id, password: !!password });
      return res.status(400).json({ message: 'ERP ID, name, email, department, and password are required' });
    }

    // Check if faculty already exists
    const [existingFaculty] = await sql`
      SELECT id FROM faculty WHERE erpid = ${erpid}
    `;

    if (existingFaculty) {
      return res.status(400).json({ message: 'Faculty member with this ERP ID already exists' });
    }

    const [newFaculty] = await sql`
      INSERT INTO faculty (erpid, name, email, department_id, password_hash, is_active, created_at, updated_at)
      VALUES (${erpid}, ${name}, ${email}, ${department_id}, ${password}, true, NOW(), NOW())
      RETURNING 
        id, 
        erpid, 
        name, 
        email, 
        department_id, 
        is_active
    `;

    res.status(201).json({ message: 'Faculty member added successfully', faculty: newFaculty });

  } catch (error) {
    console.error('Error adding faculty:', error);
    res.status(500).json({ error: 'Failed to add faculty member' });
  }
});

// Update faculty member
router.put('/faculty/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { erpid, name, email, department_id, password, is_active } = req.body;

    if (!erpid || !name || !email || !department_id) {
      return res.status(400).json({ message: 'ERP ID, name, email, and department are required' });
    }

    // Check if ERP ID already exists for another faculty member
    const [existingFaculty] = await sql`
      SELECT id FROM faculty WHERE erpid = ${erpid} AND id != ${id}
    `;

    if (existingFaculty) {
      return res.status(400).json({ message: 'ERP ID already exists for another faculty member' });
    }

    // Prepare update data
    let updateQuery;
    if (password && password.trim()) {
      updateQuery = sql`
        UPDATE faculty
        SET 
          erpid = ${erpid},
          name = ${name},
          email = ${email},
          department_id = ${department_id},
          password_hash = ${password},
          is_active = ${is_active !== undefined ? is_active : true},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING 
          id, 
          erpid, 
          name, 
          email, 
          department_id, 
          is_active
      `;
    } else {
      updateQuery = sql`
        UPDATE faculty
        SET 
          erpid = ${erpid},
          name = ${name},
          email = ${email},
          department_id = ${department_id},
          is_active = ${is_active !== undefined ? is_active : true},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING 
          id, 
          erpid, 
          name, 
          email, 
          department_id, 
          is_active
      `;
    }

    const [updatedFaculty] = await updateQuery;

    if (!updatedFaculty) {
      return res.status(404).json({ message: 'Faculty member not found' });
    }

    res.json({ message: 'Faculty member updated successfully', faculty: updatedFaculty });

  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ error: 'Failed to update faculty member' });
  }
});

// Delete faculty member (soft delete)
router.delete('/faculty/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedFaculty] = await sql`
      UPDATE faculty
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, erpid
    `;

    if (!deletedFaculty) {
      return res.status(404).json({ message: 'Faculty member not found' });
    }

    res.json({ message: 'Faculty member deleted successfully', faculty: deletedFaculty });

  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ error: 'Failed to delete faculty member' });
  }
});

// Non-Teaching Staff Management Routes
router.get('/staff', async (req, res) => {
  try {
    const { department, search } = req.query;
    let query = sql`
      SELECT 
        s.id,
        s.erpid,
        s.name,
        s.email,
        s.department_id,
        d.name as department_name
      FROM non_teaching_staff s
      LEFT JOIN departments d ON s.department_id = d.id
    `;

    if (department) {
      query = sql`${query} AND s.department_id = ${department}`;
    }
    if (search) {
      query = sql`${query} AND (s.name ILIKE ${'%' + search + '%'} OR s.erpid ILIKE ${'%' + search + '%'})`;
    }

    query = sql`${query} ORDER BY s.name`;

    const staff = await query;
    res.json({ staff });

  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Add new staff member
router.post('/staff', async (req, res) => {
  try {
    const { erpid, name, email, department_id, password } = req.body;
    
    if (!erpid || !name || !email || !department_id || !password) {
      return res.status(400).json({ message: 'ERP ID, name, email, department, and password are required' });
    }

    // Check if staff already exists
    const [existingStaff] = await sql`
      SELECT id FROM non_teaching_staff WHERE erpid = ${erpid}
    `;

    if (existingStaff) {
      return res.status(400).json({ message: 'Staff member with this ERP ID already exists' });
    }

    const [newStaff] = await sql`
      INSERT INTO non_teaching_staff (erpid, name, email, department_id, password_hash, created_at, updated_at)
      VALUES (${erpid}, ${name}, ${email}, ${department_id}, ${password}, NOW(), NOW())
      RETURNING 
        id, 
        erpid, 
        name, 
        email, 
        department_id
    `;

    res.status(201).json({ message: 'Staff member added successfully', staff: newStaff });

  } catch (error) {
    console.error('Error adding staff:', error);
    
    // Handle duplicate ERP ID error
    if (error.code === '23505' && error.constraint === 'non_teaching_staff_erpid_key') {
      return res.status(400).json({ message: 'Staff member with this ERP ID already exists' });
    }
    
    res.status(500).json({ error: 'Failed to add staff member' });
  }
});

// Update staff member
router.put('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { erpid, name, email, department_id, password } = req.body;

    if (!erpid || !name || !email || !department_id) {
      return res.status(400).json({ message: 'ERP ID, name, email, and department are required' });
    }

    // Check if ERP ID already exists for another staff member
    const [existingStaff] = await sql`
      SELECT id FROM non_teaching_staff WHERE erpid = ${erpid} AND id != ${id}
    `;

    if (existingStaff) {
      return res.status(400).json({ message: 'ERP ID already exists for another staff member' });
    }

    let updateQuery;
    if (password && password.trim()) {
      updateQuery = sql`
        UPDATE non_teaching_staff
        SET 
          erpid = ${erpid},
          name = ${name},
          email = ${email},
          department_id = ${department_id},
          password_hash = ${password},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING 
          id, 
          erpid, 
          name, 
          email, 
          department_id
      `;
    } else {
      updateQuery = sql`
        UPDATE non_teaching_staff
        SET 
          erpid = ${erpid},
          name = ${name},
          email = ${email},
          department_id = ${department_id},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING 
          id, 
          erpid, 
          name, 
          email, 
          department_id
      `;
    }

    const [updatedStaff] = await updateQuery;

    if (!updatedStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json({ message: 'Staff member updated successfully', staff: updatedStaff });

  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// Delete staff member (soft delete)
router.delete('/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedStaff] = await sql`
      DELETE FROM non_teaching_staff
      WHERE id = ${id}
      RETURNING id, name, erpid
    `;

    if (!deletedStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json({ message: 'Staff member deleted successfully', staff: deletedStaff });

  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// Department Management Routes
router.get('/departments', async (req, res) => {
  try {
    const departments = await sql`
      SELECT 
        id,
        name,
        short_code
      FROM departments
      ORDER BY name
    `;

    res.json({ departments });

  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Attendance Reports Routes
router.get('/attendance-reports', async (req, res) => {
  try {
    const { department, date, type } = req.query;
    
    let query;
    if (type === 'student') {
      query = sql`
        SELECT 
          s.name as student_name,
          s.erpid,
          d.name as department_name,
          a.date,
          a.status,
          a.created_at
        FROM student_attendance a
        JOIN students s ON a.student_id = s.id
        LEFT JOIN departments d ON s.department = d.id
        WHERE a.date = ${date}
      `;
      
      if (department) {
        query = sql`${query} AND s.department = ${department}`;
      }
    } else {
      query = sql`
        SELECT 
          f.name as faculty_name,
          f.erp_staff_id,
          d.name as department_name,
          a.date,
          a.status,
          a.created_at
        FROM faculty_attendance a
        JOIN faculty f ON a.faculty_id = f.id
        LEFT JOIN departments d ON f.department = d.id
        WHERE a.date = ${date}
      `;
      
      if (department) {
        query = sql`${query} AND f.department = ${department}`;
      }
    }

    const attendance = await query;
    res.json({ attendance });

  } catch (error) {
    console.error('Error fetching attendance reports:', error);
    res.status(500).json({ error: 'Failed to fetch attendance reports' });
  }
});

// Leave Management Routes
router.get('/leave-applications', async (req, res) => {
  try {
    const { status, department } = req.query;
    
    let query = sql`
      SELECT 
        l.id,
        l.faculty_id,
        l.leave_type,
        l.start_date,
        l.end_date,
        l.reason,
        l.status,
        l.created_at,
        f.name as faculty_name,
        f.erp_staff_id,
        d.name as department_name
      FROM faculty_leave l
      JOIN faculty f ON l.faculty_id = f.id
      LEFT JOIN departments d ON f.department = d.id
      WHERE 1=1
    `;

    if (status) {
      query = sql`${query} AND l.status = ${status}`;
    }
    if (department) {
      query = sql`${query} AND f.department = ${department}`;
    }

    query = sql`${query} ORDER BY l.created_at DESC`;

    const leaves = await query;
    res.json({ leaves });

  } catch (error) {
    console.error('Error fetching leave applications:', error);
    res.status(500).json({ error: 'Failed to fetch leave applications' });
  }
});

router.put('/leave-applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const [updatedLeave] = await sql`
      UPDATE faculty_leave
      SET 
        status = ${status},
        remarks = ${remarks || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updatedLeave) {
      return res.status(404).json({ message: 'Leave application not found' });
    }

    res.json({ message: 'Leave application updated successfully', leave: updatedLeave });

  } catch (error) {
    console.error('Error updating leave application:', error);
    res.status(500).json({ error: 'Failed to update leave application' });
  }
});

// Password Management
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log('Password change request for:', req.user.id);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords are required' });
    }

    const registrar = await RegistrarModel.findByErp(req.user.id);
    if (!registrar) {
      return res.status(404).json({ message: 'Registrar not found' });
    }

    const isValid = await RegistrarModel.comparePassword(currentPassword, registrar.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password in database
    const updated = await RegistrarModel.updatePassword(req.user.id, newPassword);
    if (!updated) {
      return res.status(500).json({ message: 'Failed to update password' });
    }

    res.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Member Management
router.get('/members', async (req, res) => {
  try {
    const { deptId, type } = req.query;
    console.log(`Registrar: Fetching ${type} members for department ${deptId}`);

    if (!deptId || !type) {
      return res.status(400).json({ message: 'Department ID and type are required' });
    }

    let query;
    switch (type) {
      case 'students':
        query = sql`
          SELECT id, erpid, name, email
          FROM students
          WHERE department_id = ${deptId}
          ORDER BY name
        `;
        break;
      case 'faculty':
        query = sql`
          SELECT id, erpid, name, email
          FROM faculty
          WHERE department_id = ${deptId} AND is_active = true
          ORDER BY name
        `;
        break;
      case 'staff':
        query = sql`
          SELECT id, erpid, name, email
          FROM non_teaching_staff
          WHERE department_id = ${deptId}
          ORDER BY name
        `;
        break;
      default:
        return res.status(400).json({ message: 'Invalid member type' });
    }

    const members = await query;
    res.json({ members });

  } catch (error) {
    console.error('Registrar: Members fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

// Profile by ID
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    console.log(`Registrar: Fetching ${type} profile for ID ${id}`);

    if (!type) {
      return res.status(400).json({ message: 'Member type is required' });
    }

    let profile, extraData = {};

    switch (type) {
      case 'students':
        [profile] = await sql`
          SELECT
            s.id, s.erpid, s.name, s.email, s.contact_no AS phone,
            s.dob, s.year, s.division, s.roll_no,
            d.name AS department
          FROM students s
          JOIN departments d ON s.department_id = d.id
          WHERE s.id = ${id}
        `;
        break;
      case 'faculty':
        [[profile], [logs, stress]] = await Promise.all([
          sql`
            SELECT
              f.id, f.erpid, f.name, f.email,
              d.name AS department
            FROM faculty f
            JOIN departments d ON f.department_id = d.id
            WHERE f.id = ${id}
          `,
          Promise.all([
            sql`
              SELECT
                classroom,
                timestamp AS date,
                COALESCE(NULLIF(person_name, ''), 'Unknown') AS status
              FROM faculty_logs
              WHERE erp_id = (SELECT erpid FROM faculty WHERE id = ${id})
              ORDER BY timestamp DESC
              LIMIT 10
            `,
            sql`
              SELECT
                stress_status AS level
              FROM stress_logs
              WHERE erpid = (SELECT erpid FROM faculty WHERE id = ${id})
              ORDER BY timestamp DESC
              LIMIT 1
            `
          ])
        ]);
        extraData = {
          attendance: {
            recent: logs.map(log => ({
              date: log.date.toISOString().split('T')[0],
              status: log.status,
              classroom: log.classroom
            })),
            percentage: logs.length ? Math.round((logs.filter(log => log.status !== 'Unknown').length / logs.length) * 100) : 0
          },
          stressLevel: stress[0]?.level || 'Normal'
        };
        break;
      case 'staff':
        [profile] = await sql`
          SELECT
            id, erpid, name, email,
            (SELECT name FROM departments WHERE id = department_id) AS department
          FROM non_teaching_staff
          WHERE id = ${id}
        `;
        break;
      default:
        return res.status(400).json({ message: 'Invalid member type' });
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ ...profile, ...extraData });

  } catch (error) {
    console.error('Registrar: Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Faculty Logs by ID
router.get('/faculty-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Get ERP ID for the faculty
    const [faculty] = await sql`
      SELECT erpid FROM faculty WHERE id = ${id}
    `;
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    // Get all logs for this faculty
    const logs = await sql`
      SELECT * FROM faculty_logs WHERE erp_id = ${faculty.erpid} ORDER BY timestamp DESC
    `;
    res.json({ logs });
  } catch (error) {
    console.error('Registrar: Error fetching faculty logs:', error);
    res.status(500).json({ message: 'Failed to fetch faculty logs' });
  }
});

// Staff Logs by ID
router.get('/staff-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Get ERP ID for the staff
    const [staff] = await sql`
      SELECT erpid FROM non_teaching_staff WHERE id = ${id}
    `;
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }
    // Get all logs for this staff from the 'faculty_logs' table
    const logs = await sql`
      SELECT * FROM faculty_logs WHERE erp_id = ${staff.erpid} ORDER BY timestamp DESC
    `;
    res.json({ logs });
  } catch (error) {
    console.error('Registrar: Error fetching staff logs:', error);
    res.status(500).json({ message: 'Failed to fetch staff logs' });
  }
});

// Get all faculty logs (for dashboard summary)
router.get('/faculty-logs', async (req, res) => {
  try {
    const logs = await sql`SELECT * FROM faculty_logs ORDER BY timestamp DESC`;
    res.json({ logs });
  } catch (error) {
    console.error('Registrar: Error fetching faculty logs:', error);
    res.status(500).json({ message: 'Failed to fetch faculty logs' });
  }
});

// Get present faculty and staff summary per day
router.get('/present-faculty-staff-summary', async (req, res) => {
  try {
    // Present faculty per day
    const facultyRows = await sql`
      SELECT COUNT(DISTINCT erp_id) AS total_faculty_present, DATE("timestamp") AS date
      FROM faculty_logs
      WHERE erp_id IN (SELECT erpid FROM faculty)
      GROUP BY DATE("timestamp")
      ORDER BY date DESC
    `;
    // Present staff per day
    const staffRows = await sql`
      SELECT COUNT(DISTINCT erp_id) AS total_staff_present, DATE("timestamp") AS date
      FROM faculty_logs
      WHERE erp_id IN (SELECT erpid FROM non_teaching_staff)
      GROUP BY DATE("timestamp")
      ORDER BY date DESC
    `;
    res.json({ faculty: facultyRows, staff: staffRows });
  } catch (error) {
    console.error('Registrar: Error fetching present faculty/staff summary:', error);
    res.status(500).json({ message: 'Failed to fetch present faculty/staff summary' });
  }
});

// Get faculty count per department
router.get('/faculty-department-counts', async (req, res) => {
  try {
    const rows = await sql`
      SELECT department_id, COUNT(*) AS count FROM faculty WHERE is_active = true GROUP BY department_id`;
    res.json(rows);
  } catch (error) {
    console.error('Registrar: Error fetching faculty department counts:', error);
    res.status(500).json({ message: 'Failed to fetch faculty department counts' });
  }
});

// Get staff count per department
router.get('/staff-department-counts', async (req, res) => {
  try {
    const rows = await sql`
      SELECT department_id, COUNT(*) AS count FROM non_teaching_staff GROUP BY department_id`;
    res.json(rows);
  } catch (error) {
    console.error('Registrar: Error fetching staff department counts:', error);
    res.status(500).json({ message: 'Failed to fetch staff department counts' });
  }
});

// Get pending faculty leave approvals (now returns all with HodApproval = 'Approved')
router.get('/faculty-leave-approval', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM faculty_leave WHERE "HodApproval" = 'Approved'`;
    res.json(rows);
  } catch (error) {
    console.error('Registrar: Error fetching faculty leave approvals:', error);
    res.status(500).json({ message: 'Failed to fetch faculty leave approvals' });
  }
});

// Get present faculty for today with department info (show all present, even if not in faculty table)
router.get('/present-faculty-today', async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const records = await sql`
      SELECT
        log_summary.person_name AS faculty_name,
        log_summary.erp_id,
        COALESCE(d.name, 'N/A') AS department_name,
        f.department_id AS departmentId,
        f.email,
        log_summary.first_log,
        log_summary.last_log
      FROM
        (
          SELECT
            erp_id,
            COALESCE(NULLIF(person_name, ''), 'Unknown') AS person_name,
            DATE(timestamp AT TIME ZONE 'Asia/Kolkata') AS attendance_date,
            MIN(timestamp) AS first_log,
            MAX(timestamp) AS last_log
          FROM
            faculty_logs
          WHERE
            DATE(timestamp AT TIME ZONE 'Asia/Kolkata') = ${todayStr}::date
            AND erp_id IN (SELECT erpid FROM faculty)
            AND erp_id <> 'No id'
          GROUP BY
            erp_id,
            person_name,
            attendance_date
        ) AS log_summary
      LEFT JOIN
        faculty f ON log_summary.erp_id = f.erpid
      LEFT JOIN
        departments d ON f.department_id = d.id
      ORDER BY department_name, faculty_name
    `;
    const rows = Array.isArray(records) ? records : (records.rows || []);
    res.json({ presentFaculty: rows });
  } catch (e) {
    console.error('Error fetching present faculty today:', e);
    res.status(500).json({ message: 'Failed to fetch present faculty today' });
  }
});

// Get present non-teaching staff for today with department info (show all present, even if not in non_teaching_staff table)
router.get('/present-staff-today', async (req, res) => {
  try {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const records = await sql`
      SELECT
        log_summary.person_name AS staff_name,
        log_summary.erp_id,
        COALESCE(d.name, 'N/A') AS department_name,
        s.department_id AS departmentId,
        s.email,
        log_summary.first_log,
        log_summary.last_log
      FROM
        (
          SELECT
            erp_id,
            COALESCE(NULLIF(person_name, ''), 'Unknown') AS person_name,
            DATE(timestamp AT TIME ZONE 'Asia/Kolkata') AS attendance_date,
            MIN(timestamp) AS first_log,
            MAX(timestamp) AS last_log
          FROM
            faculty_logs
          WHERE
            DATE(timestamp AT TIME ZONE 'Asia/Kolkata') = ${todayStr}::date
            AND erp_id IN (SELECT erpid FROM non_teaching_staff)
            AND erp_id <> 'No id'
          GROUP BY
            erp_id,
            person_name,
            attendance_date
        ) AS log_summary
      LEFT JOIN
        non_teaching_staff s ON log_summary.erp_id = s.erpid
      LEFT JOIN
        departments d ON s.department_id = d.id
      ORDER BY department_name, staff_name
    `;
    const rows = Array.isArray(records) ? records : (records.rows || []);
    res.json({ presentStaff: rows });
  } catch (e) {
    console.error('Error fetching present staff today:', e);
    res.status(500).json({ message: 'Failed to fetch present staff today' });
  }
});

// Faculty Attendance Report
router.get('/faculty-attendance-report', async (req, res) => {
  try {
      const { departmentId, fromDate, toDate, format } = req.query;
      const from = fromDate || '1900-01-01';
      const to = toDate || '2100-12-31';

      let records;
      if (departmentId && departmentId !== 'all') {
        let deptIds;
        if (departmentId.includes(',')) {
          deptIds = departmentId.split(',').map(id => Number(id));
        } else {
          deptIds = [Number(departmentId)];
        }
        records = await sql`
            SELECT
                log_summary.person_name AS faculty_name,
                log_summary.erp_id,
                COALESCE(d.name, 'Unknown') AS department_name,
                log_summary.attendance_date,
                log_summary.first_log,
                log_summary.last_log
            FROM
                (
                    SELECT
                        erp_id,
                        COALESCE(NULLIF(person_name, ''), 'Unknown') AS person_name,
                        DATE(timestamp AT TIME ZONE 'Asia/Kolkata') AS attendance_date,
                        MIN(timestamp) AS first_log,
                        MAX(timestamp) AS last_log
                    FROM
                        faculty_logs
                    WHERE
                        DATE(timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date AND
                        DATE(timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
                        AND erp_id <> 'No id'
                        AND erp_id IN (SELECT erpid FROM faculty)
                    GROUP BY
                        erp_id,
                        person_name,
                        attendance_date
                ) AS log_summary
            LEFT JOIN
                faculty f ON log_summary.erp_id = f.erpid
            LEFT JOIN
                departments d ON f.department_id = d.id
            WHERE (f.department_id = ANY(${deptIds}) OR f.department_id IS NULL)
            ORDER BY department_name, log_summary.first_log, faculty_name, log_summary.attendance_date
        `;
      } else {
          records = await sql`
              SELECT
                  log_summary.person_name AS faculty_name,
                  log_summary.erp_id,
                  COALESCE(d.name, 'Unknown') AS department_name,
                  log_summary.attendance_date,
                  log_summary.first_log,
                  log_summary.last_log
              FROM
                  (
                      SELECT
                          erp_id,
                          COALESCE(NULLIF(person_name, ''), 'Unknown') AS person_name,
                          DATE(timestamp AT TIME ZONE 'Asia/Kolkata') AS attendance_date,
                          MIN(timestamp) AS first_log,
                          MAX(timestamp) AS last_log
                      FROM
                          faculty_logs
                      WHERE
                          DATE(timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date AND
                          DATE(timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
                          AND erp_id <> 'No id'
                          AND erp_id IN (SELECT erpid FROM faculty)
                      GROUP BY
                          erp_id,
                          person_name,
                          attendance_date
                  ) AS log_summary
              LEFT JOIN
                  faculty f ON log_summary.erp_id = f.erpid
              LEFT JOIN
                  departments d ON f.department_id = d.id
              ORDER BY department_name, log_summary.first_log, faculty_name, log_summary.attendance_date
          `;
      }

      const rows = Array.isArray(records) ? records : (records.rows || []);
      if (!rows || rows.length === 0) {
          return res.status(404).send('No attendance data found for the selected criteria.');
      }

      // Helper functions for IST conversion
      function toISTDateString(utcDateString) {
        const date = new Date(utcDateString);
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(utc + istOffset);
        return istDate.toISOString().split('T')[0];
      }
      function toISTTimeString(utcDateString) {
        const date = new Date(utcDateString);
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(utc + istOffset);
        return istDate.toTimeString().split(' ')[0];
      }

      if (format === 'pdf') {
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=faculty_attendance.pdf');
        doc.pipe(res);

        doc.fontSize(16).text('Faculty Attendance Report', { align: 'center' });
        doc.moveDown();

        // Table columns (add Serial No and Half/Full Day)
        const headers = ['S.No', 'Date', 'Faculty Name', 'ERP ID', 'Department', 'First Log', 'Last Log', 'Duration (HH:MM:SS)', 'Half/Full Day'];
        const colWidths = [30, 70, 140, 65, 160, 70, 70, 110, 90];
        const startX = doc.x;
        let y = doc.y;

        function drawHeader() {
          let x = startX;
          doc.font('Helvetica-Bold').fontSize(10);
          headers.forEach((header, i) => {
            doc.rect(x, y, colWidths[i], 20).stroke();
            doc.text(header, x + 2, y + 6, { width: colWidths[i] - 4, align: 'center' });
            x += colWidths[i];
          });
          y += 20;
          doc.font('Helvetica').fontSize(9);
          doc.y = y;
        }
        drawHeader();

        let rowCount = 0;
        let serialNumber = 1;
        rows.forEach(r => {
          const firstLog = new Date(r.first_log);
          const lastLog = new Date(r.last_log);
          let duration = '00:00:00';
          let durationHours = 0;
          const durationMs = lastLog - firstLog;
          if (!isNaN(durationMs) && durationMs >= 0) {
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
            const seconds = Math.floor((durationMs / 1000) % 60);
            duration = `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            durationHours = durationMs / (1000 * 60 * 60);
          }
          const halfFull = durationHours < 4 ? 'Half Day' : 'Full Day';
          const row = [
            serialNumber.toString(),
            toISTDateString(r.first_log),
            r.faculty_name,
            r.erp_id,
            r.department_name,
            firstLog.toTimeString().split(' ')[0],
            lastLog.toTimeString().split(' ')[0],
            duration,
            halfFull
          ];
          let x = startX;
          row.forEach((cell, i) => {
            doc.rect(x, y, colWidths[i], 18).stroke();
            doc.text(String(cell), x + 2, y + 5, { width: colWidths[i] - 4, align: 'center', ellipsis: true });
            x += colWidths[i];
          });
          y += 18;
          rowCount++;
          serialNumber++;
          if (rowCount % 20 === 0) {
            doc.addPage();
            y = doc.y;
            drawHeader();
            y = doc.y;
          }
        });
        doc.end();
        return;
      }

      if (format === 'xlsx') {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Faculty Attendance');
        worksheet.columns = [
          { header: 'S.No', key: 'serial_no', width: 10 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Faculty Name', key: 'faculty_name', width: 25 },
          { header: 'ERP ID', key: 'erp_id', width: 15 },
          { header: 'Department', key: 'department_name', width: 25 },
          { header: 'First Log', key: 'first_log', width: 15 },
          { header: 'Last Log', key: 'last_log', width: 15 },
          { header: 'Duration (HH:MM:SS)', key: 'duration', width: 18 },
          { header: 'Half/Full Day', key: 'half_full', width: 15 },
        ];
        let serialNumber = 1;
        rows.forEach(r => {
          const firstLog = new Date(r.first_log);
          const lastLog = new Date(r.last_log);
          let duration = '00:00:00';
          let durationHours = 0;
          const durationMs = lastLog - firstLog;
          if (!isNaN(durationMs) && durationMs >= 0) {
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
            const seconds = Math.floor((durationMs / 1000) % 60);
            duration = `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            durationHours = durationMs / (1000 * 60 * 60);
          }
          const halfFull = durationHours < 4 ? 'Half Day' : 'Full Day';
          worksheet.addRow({
            serial_no: serialNumber,
            date: toISTDateString(r.first_log),
            faculty_name: r.faculty_name,
            erp_id: r.erp_id,
            department_name: r.department_name,
            first_log: firstLog.toTimeString().split(' ')[0],
            last_log: lastLog.toTimeString().split(' ')[0],
            duration,
            half_full: halfFull,
          });
          serialNumber++;
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=faculty_attendance.xlsx');
        await workbook.xlsx.write(res);
        res.end();
        return;
      }

      // CSV generation
      const csvHeader = 'S.No,Date,Faculty Name,ERP ID,Department,First Log,Last Log,Duration (HH:MM:SS),Half/Full Day\n';
      let serialNumber = 1;
      const csvRows = rows.map(r => {
          const firstLog = new Date(r.first_log);
          const lastLog = new Date(r.last_log);
          let duration = '00:00:00';
          let durationHours = 0;
          const durationMs = lastLog - firstLog;
          if (!isNaN(durationMs) && durationMs >= 0) {
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
            const seconds = Math.floor((durationMs / 1000) % 60);
            duration = `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            durationHours = durationMs / (1000 * 60 * 60);
          }
          const halfFull = durationHours < 4 ? 'Half Day' : 'Full Day';
          const row = [
              serialNumber,
              toISTDateString(r.first_log),
              `"${r.faculty_name}"`,
              r.erp_id,
              `"${r.department_name}"`,
              firstLog.toTimeString().split(' ')[0],
              lastLog.toTimeString().split(' ')[0],
              duration,
              halfFull
          ];
          serialNumber++;
          return row.join(',');
      });
      const csvData = csvHeader + csvRows.join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('faculty_attendance.csv');
      return res.send(csvData);

  } catch (error) {
      console.error('Error generating attendance report:', error);
      res.status(500).json({ message: 'Failed to generate attendance report' });
  }
});

// Staff Attendance Report (Non-Teaching Staff)
router.get('/staff-attendance-report', async (req, res) => {
  try {
    const { departmentId, fromDate, toDate, format } = req.query;
    const from = fromDate || '1900-01-01';
    const to = toDate || '2100-12-31';
    let records;
    if (departmentId && departmentId !== 'all') {
      let deptIds = departmentId.includes(',') ? departmentId.split(',').map(Number) : [Number(departmentId)];
      records = await sql`
        SELECT
          log_summary.person_name AS staff_name,
          log_summary.erp_id,
          COALESCE(d.name, 'Unknown') AS department_name,
          log_summary.attendance_date,
          log_summary.first_log,
          log_summary.last_log
        FROM
          (
            SELECT
              erp_id,
              COALESCE(NULLIF(person_name, ''), 'Unknown') AS person_name,
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') AS attendance_date,
              MIN(timestamp) AS first_log,
              MAX(timestamp) AS last_log
            FROM
              faculty_logs
            WHERE
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date AND
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
              AND erp_id <> 'No id'
              AND erp_id IN (SELECT erpid FROM non_teaching_staff)
            GROUP BY
              erp_id,
              person_name,
              attendance_date
          ) AS log_summary
        LEFT JOIN
          non_teaching_staff s ON log_summary.erp_id = s.erpid
        LEFT JOIN
          departments d ON s.department_id = d.id
        WHERE (s.department_id = ANY(${deptIds}) OR s.department_id IS NULL)
        ORDER BY department_name, log_summary.first_log, staff_name, log_summary.attendance_date
      `;
    } else {
      records = await sql`
        SELECT
          log_summary.person_name AS staff_name,
          log_summary.erp_id,
          COALESCE(d.name, 'Unknown') AS department_name,
          log_summary.attendance_date,
          log_summary.first_log,
          log_summary.last_log
        FROM
          (
            SELECT
              erp_id,
              COALESCE(NULLIF(person_name, ''), 'Unknown') AS person_name,
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') AS attendance_date,
              MIN(timestamp) AS first_log,
              MAX(timestamp) AS last_log
            FROM
              faculty_logs
            WHERE
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date AND
              DATE(timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
              AND erp_id <> 'No id'
              AND erp_id IN (SELECT erpid FROM non_teaching_staff)
            GROUP BY
              erp_id,
              person_name,
              attendance_date
          ) AS log_summary
        LEFT JOIN
          non_teaching_staff s ON log_summary.erp_id = s.erpid
        LEFT JOIN
          departments d ON s.department_id = d.id
        ORDER BY department_name, log_summary.first_log, staff_name, log_summary.attendance_date
      `;
    }
    const rows = Array.isArray(records) ? records : (records.rows || []);
    if (!rows || rows.length === 0) {
      return res.status(404).send('No attendance data found for the selected criteria.');
    }
    // Helper functions for IST conversion
    function toISTDateString(utcDateString) {
      const date = new Date(utcDateString);
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(utc + istOffset);
      return istDate.toISOString().split('T')[0];
    }
    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=staff_attendance_report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Non-Teaching Staff Attendance Report', { align: 'center' });
      doc.moveDown();
      // Table columns
      const headers = ['S.No', 'Date', 'Staff Name', 'ERP ID', 'Department', 'First Log', 'Last Log', 'Duration (HH:MM:SS)'];
      const colWidths = [30, 70, 140, 65, 160, 70, 70, 110];
      const startX = doc.x;
      let y = doc.y;
      function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, i) => {
          doc.rect(x, y, colWidths[i], 20).stroke();
          doc.text(header, x + 2, y + 6, { width: colWidths[i] - 4, align: 'center' });
          x += colWidths[i];
        });
        y += 20;
        doc.font('Helvetica').fontSize(9);
        doc.y = y;
      }
      drawHeader();
      let rowCount = 0;
      let serialNumber = 1;
      rows.forEach(r => {
        const firstLog = new Date(r.first_log);
        const lastLog = new Date(r.last_log);
        let duration = '00:00:00';
        const durationMs = lastLog - firstLog;
        if (!isNaN(durationMs) && durationMs >= 0) {
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
          const seconds = Math.floor((durationMs / 1000) % 60);
          duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        const row = [
          serialNumber.toString(),
          toISTDateString(r.first_log),
          r.staff_name,
          r.erp_id,
          r.department_name,
          firstLog.toTimeString().split(' ')[0],
          lastLog.toTimeString().split(' ')[0],
          duration
        ];
        let x = startX;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 18).stroke();
          doc.text(String(cell), x + 2, y + 5, { width: colWidths[i] - 4, align: 'center', ellipsis: true });
          x += colWidths[i];
        });
        y += 18;
        rowCount++;
        serialNumber++;
        if (rowCount % 20 === 0) {
          doc.addPage();
          y = doc.y;
          drawHeader();
          y = doc.y;
        }
      });
      doc.end();
      return;
    }
    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Staff Attendance');
      worksheet.columns = [
        { header: 'S.No', key: 'serial_no', width: 10 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Staff Name', key: 'staff_name', width: 25 },
        { header: 'ERP ID', key: 'erp_id', width: 15 },
        { header: 'Department', key: 'department_name', width: 25 },
        { header: 'First Log', key: 'first_log', width: 15 },
        { header: 'Last Log', key: 'last_log', width: 15 },
        { header: 'Duration (HH:MM:SS)', key: 'duration', width: 18 },
      ];
      let serialNumber = 1;
      rows.forEach(r => {
        const firstLog = new Date(r.first_log);
        const lastLog = new Date(r.last_log);
        let duration = '00:00:00';
        const durationMs = lastLog - firstLog;
        if (!isNaN(durationMs) && durationMs >= 0) {
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
          const seconds = Math.floor((durationMs / 1000) % 60);
          duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        worksheet.addRow({
          serial_no: serialNumber,
          date: toISTDateString(r.first_log),
          staff_name: r.staff_name,
          erp_id: r.erp_id,
          department_name: r.department_name,
          first_log: firstLog.toTimeString().split(' ')[0],
          last_log: lastLog.toTimeString().split(' ')[0],
          duration,
        });
        serialNumber++;
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=staff_attendance_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    // CSV generation
    const csvHeader = 'S.No,Date,Staff Name,ERP ID,Department,First Log,Last Log,Duration (HH:MM:SS)\n';
    let serialNumber = 1;
    const csvRows = rows.map(r => {
      const firstLog = new Date(r.first_log);
      const lastLog = new Date(r.last_log);
      let duration = '00:00:00';
      const durationMs = lastLog - firstLog;
      if (!isNaN(durationMs) && durationMs >= 0) {
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const seconds = Math.floor((durationMs / 1000) % 60);
        duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      const row = [
        serialNumber,
        toISTDateString(r.first_log),
        `"${r.staff_name}"`,
        r.erp_id,
        `"${r.department_name}"`,
        firstLog.toTimeString().split(' ')[0],
        lastLog.toTimeString().split(' ')[0],
        duration
      ];
      serialNumber++;
      return row.join(',');
    });
    const csvData = csvHeader + csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('staff_attendance_report.csv');
    return res.send(csvData);
  } catch (error) {
    console.error('Error generating staff attendance report:', error);
    res.status(500).json({ message: 'Failed to generate staff attendance report' });
  }
});

// Add after GET /faculty-leave-approval
router.put('/faculty-leave-approval/:ErpStaffId', async (req, res) => {
  try {
    const { ErpStaffId } = req.params;
    const { PrincipalApproval } = req.body;
    if (!ErpStaffId || !PrincipalApproval) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const [updated] = await sql`
      UPDATE faculty_leave
      SET "PrincipalApproval" = ${PrincipalApproval},
          "FinalStatus" = ${PrincipalApproval}
      WHERE "ErpStaffId" = ${ErpStaffId}
      RETURNING *;
    `;
    if (!updated) {
      return res.status(404).json({ error: 'Leave application not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating leave approval:', error);
    res.status(500).json({ error: 'Failed to update leave approval' });
  }
});

// Faculty Stress Report
router.get('/faculty-stress-report', async (req, res) => {
  try {
    const { departmentId, fromDate, toDate, format } = req.query;
    const from = fromDate || '1900-01-01';
    const to = toDate || '2100-12-31';
    let records;
    if (departmentId && departmentId !== 'all') {
      let deptIds = departmentId.includes(',') ? departmentId.split(',').map(Number) : [Number(departmentId)];
      records = await sql`
        SELECT
          f.name AS faculty_name,
          f.erpid,
          d.name AS department_name,
          DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') AS stress_date,
          sl.stress_level
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE f.department_id = ANY(${deptIds})
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
        ORDER BY d.name, f.name, stress_date
      `;
    } else {
      records = await sql`
        SELECT
          f.name AS faculty_name,
          f.erpid,
          d.name AS department_name,
          DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') AS stress_date,
          sl.stress_level
        FROM stress_logs sl
        JOIN faculty f ON sl.erpid = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
        ORDER BY d.name, f.name, stress_date
      `;
    }
    const rows = Array.isArray(records) ? records : (records.rows || []);
    if (!rows || rows.length === 0) {
      return res.status(404).send('No stress data found for the selected criteria.');
    }
    // Aggregate data by faculty only (not by date)
    const aggregatedData = {};
    rows.forEach(row => {
      const key = `${row.faculty_name}_${row.erpid}_${row.department_name}`;
      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          faculty_name: row.faculty_name,
          erpid: row.erpid,
          department_name: row.department_name,
          stressed_count: 0,
          unstressed_count: 0
        };
      }
      // Count stressed levels (L1, L2, L3)
      if (["L1", "L2", "L3"].includes(row.stress_level)) {
        aggregatedData[key].stressed_count++;
      }
      // Count unstressed levels (A1, A2, A3)
      else if (["A1", "A2", "A3"].includes(row.stress_level)) {
        aggregatedData[key].unstressed_count++;
      }
    });
    // Convert to array and add verdict
    const finalData = Object.values(aggregatedData).map(item => ({
      ...item,
      verdict: item.stressed_count > item.unstressed_count ? 'Stressed' : 'Unstressed'
    }));
    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_stress_report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Faculty Stress Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`From: ${from} To: ${to}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text('Stress Level Indicators:', { align: 'left' });
      doc.moveDown(0.2);
      doc.fontSize(8).text('STRESS: L1 - 70-80  | L2 - 80-90  | L3 - 90-100', { align: 'left' });
      doc.moveDown(0.1);
      doc.fontSize(8).text('UNSTRESS: A1 - 90-100  | A2 - 80-90  | A3 - 70-80', { align: 'left' });
      doc.moveDown();
      const headers = ['S.No', 'Faculty Name', 'ERP ID', 'Department', 'Stressed Count', 'Unstressed Count', 'Verdict'];
      const colWidths = [40, 200, 70, 200, 100, 100, 80];
      const startX = doc.x;
      let y = doc.y;
      function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, i) => {
          doc.rect(x, y, colWidths[i], 20).stroke();
          doc.text(header, x + 2, y + 6, { width: colWidths[i] - 4, align: 'center' });
          x += colWidths[i];
        });
        y += 20;
        doc.font('Helvetica').fontSize(9);
        doc.y = y;
      }
      drawHeader();
      let rowCount = 0;
      let serialNumber = 1;
      finalData.forEach(r => {
        const row = [
          serialNumber.toString(),
          r.faculty_name,
          r.erpid,
          r.department_name,
          r.stressed_count.toString(),
          r.unstressed_count.toString(),
          r.verdict
        ];
        let x = startX;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 18).stroke();
          doc.text(String(cell), x + 2, y + 5, { width: colWidths[i] - 4, align: 'center', ellipsis: true });
          x += colWidths[i];
        });
        y += 18;
        rowCount++;
        serialNumber++;
        if (rowCount % 20 === 0) {
          doc.addPage();
          y = doc.y;
          drawHeader();
          y = doc.y;
        }
      });
      doc.end();
      return;
    }
    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Faculty Stress');
      worksheet.addRow(['Faculty Stress Report']);
      worksheet.addRow([`From: ${from} To: ${to}`]);
      worksheet.addRow([]);
      worksheet.addRow(['Stress Level Indicators:']);
      worksheet.addRow(['L1 - 70-80 stress', 'L2 - 80-90 stress', 'L3 - 90-100 stress', 'A1 - 90-100 unstress', 'A2 - 80-90 unstress', 'A3 - 70-80 unstress']);
      worksheet.addRow([]);
      worksheet.columns = [
        { header: 'S.No', key: 'serial_no', width: 10 },
        { header: 'Faculty Name', key: 'faculty_name', width: 25 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Department', key: 'department_name', width: 25 },
        { header: 'Stressed Count', key: 'stressed_count', width: 15 },
        { header: 'Unstressed Count', key: 'unstressed_count', width: 15 },
        { header: 'Verdict', key: 'verdict', width: 15 },
      ];
      let serialNumber = 1;
      finalData.forEach(r => {
        worksheet.addRow({
          serial_no: serialNumber,
          faculty_name: r.faculty_name,
          erpid: r.erpid,
          department_name: r.department_name,
          stressed_count: r.stressed_count,
          unstressed_count: r.unstressed_count,
          verdict: r.verdict,
        });
        serialNumber++;
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_stress_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    // CSV
    const csvHeader = `Faculty Stress Report\nFrom: ${from} To: ${to}\n\nStress Level Indicators:\nL1 - 70-80 stress | L2 - 80-90 stress | L3 - 90-100 stress | A1 - 90-100 unstress | A2 - 80-90 unstress | A3 - 70-80 unstress\n\nS.No,Faculty Name,ERP ID,Department,Stressed Count,Unstressed Count,Verdict\n`;
    let serialNumber = 1;
    const csvRows = finalData.map(r => [
      serialNumber,
      `"${r.faculty_name}"`,
      r.erpid,
      `"${r.department_name}"`,
      r.stressed_count,
      r.unstressed_count,
      r.verdict
    ].join(','));
    serialNumber++;
    const csvData = csvHeader + csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('faculty_stress_report.csv');
    return res.send(csvData);
  } catch (error) {
    console.error('Error generating stress report:', error);
    res.status(500).json({ message: 'Failed to generate stress report' });
  }
});

// Staff Stress Report
router.get('/staff-stress-report', async (req, res) => {
  try {
    const { departmentId, fromDate, toDate, format } = req.query;
    const from = fromDate || '1900-01-01';
    const to = toDate || '2100-12-31';
    let records;
    if (departmentId && departmentId !== 'all') {
      let deptIds = departmentId.includes(',') ? departmentId.split(',').map(Number) : [Number(departmentId)];
      records = await sql`
        SELECT
          s.name AS staff_name,
          s.erpid,
          d.name AS department_name,
          DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') AS stress_date,
          sl.stress_level
        FROM stress_logs sl
        JOIN non_teaching_staff s ON sl.erpid = s.erpid
        JOIN departments d ON s.department_id = d.id
        WHERE s.department_id = ANY(${deptIds})
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
        ORDER BY d.name, s.name, stress_date
      `;
    } else {
      records = await sql`
        SELECT
          s.name AS staff_name,
          s.erpid,
          d.name AS department_name,
          DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') AS stress_date,
          sl.stress_level
        FROM stress_logs sl
        JOIN non_teaching_staff s ON sl.erpid = s.erpid
        JOIN departments d ON s.department_id = d.id
        WHERE DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') >= ${from}::date
          AND DATE(sl.timestamp AT TIME ZONE 'Asia/Kolkata') <= ${to}::date
        ORDER BY d.name, s.name, stress_date
      `;
    }
    const rows = Array.isArray(records) ? records : (records.rows || []);
    if (!rows || rows.length === 0) {
      return res.status(404).send('No stress data found for the selected criteria.');
    }
    // Aggregate data by staff only (not by date)
    const aggregatedData = {};
    rows.forEach(row => {
      const key = `${row.staff_name}_${row.erpid}_${row.department_name}`;
      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          staff_name: row.staff_name,
          erpid: row.erpid,
          department_name: row.department_name,
          stressed_count: 0,
          unstressed_count: 0
        };
      }
      // Count stressed levels (L1, L2, L3)
      if (["L1", "L2", "L3"].includes(row.stress_level)) {
        aggregatedData[key].stressed_count++;
      }
      // Count unstressed levels (A1, A2, A3)
      else if (["A1", "A2", "A3"].includes(row.stress_level)) {
        aggregatedData[key].unstressed_count++;
      }
    });
    // Convert to array and add verdict
    const finalData = Object.values(aggregatedData).map(item => ({
      ...item,
      verdict: item.stressed_count > item.unstressed_count ? 'Stressed' : 'Unstressed'
    }));
    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=staff_stress_report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Non-Teaching Staff Stress Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`From: ${from} To: ${to}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text('Stress Level Indicators:', { align: 'left' });
      doc.moveDown(0.2);
      doc.fontSize(8).text('STRESS: L1 - 70-80  | L2 - 80-90  | L3 - 90-100', { align: 'left' });
      doc.moveDown(0.1);
      doc.fontSize(8).text('UNSTRESS: A1 - 90-100  | A2 - 80-90  | A3 - 70-80', { align: 'left' });
      doc.moveDown();
      const headers = ['S.No', 'Staff Name', 'ERP ID', 'Department', 'Stressed Count', 'Unstressed Count', 'Verdict'];
      const colWidths = [40, 200, 70, 200, 100, 100, 80];
      const startX = doc.x;
      let y = doc.y;
      function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, i) => {
          doc.rect(x, y, colWidths[i], 20).stroke();
          doc.text(header, x + 2, y + 6, { width: colWidths[i] - 4, align: 'center' });
          x += colWidths[i];
        });
        y += 20;
        doc.font('Helvetica').fontSize(9);
        doc.y = y;
      }
      drawHeader();
      let rowCount = 0;
      let serialNumber = 1;
      finalData.forEach(r => {
        const row = [
          serialNumber.toString(),
          r.staff_name,
          r.erpid,
          r.department_name,
          r.stressed_count.toString(),
          r.unstressed_count.toString(),
          r.verdict
        ];
        let x = startX;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 18).stroke();
          doc.text(String(cell), x + 2, y + 5, { width: colWidths[i] - 4, align: 'center', ellipsis: true });
          x += colWidths[i];
        });
        y += 18;
        rowCount++;
        serialNumber++;
        if (rowCount % 20 === 0) {
          doc.addPage();
          y = doc.y;
          drawHeader();
          y = doc.y;
        }
      });
      doc.end();
      return;
    }
    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Staff Stress');
      worksheet.addRow(['Non-Teaching Staff Stress Report']);
      worksheet.addRow([`From: ${from} To: ${to}`]);
      worksheet.addRow([]);
      worksheet.addRow(['Stress Level Indicators:']);
      worksheet.addRow(['L1 - 70-80 stress', 'L2 - 80-90 stress', 'L3 - 90-100 stress', 'A1 - 90-100 unstress', 'A2 - 80-90 unstress', 'A3 - 70-80 unstress']);
      worksheet.addRow([]);
      worksheet.columns = [
        { header: 'S.No', key: 'serial_no', width: 10 },
        { header: 'Staff Name', key: 'staff_name', width: 25 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Department', key: 'department_name', width: 25 },
        { header: 'Stressed Count', key: 'stressed_count', width: 15 },
        { header: 'Unstressed Count', key: 'unstressed_count', width: 15 },
        { header: 'Verdict', key: 'verdict', width: 15 },
      ];
      let serialNumber = 1;
      finalData.forEach(r => {
        worksheet.addRow({
          serial_no: serialNumber,
          staff_name: r.staff_name,
          erpid: r.erpid,
          department_name: r.department_name,
          stressed_count: r.stressed_count,
          unstressed_count: r.unstressed_count,
          verdict: r.verdict,
        });
        serialNumber++;
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=staff_stress_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    // CSV
    const csvHeader = `Non-Teaching Staff Stress Report\nFrom: ${from} To: ${to}\n\nStress Level Indicators:\nL1 - 70-80 stress | L2 - 80-90 stress | L3 - 90-100 stress | A1 - 90-100 unstress | A2 - 80-90 unstress | A3 - 70-80 unstress\n\nS.No,Staff Name,ERP ID,Department,Stressed Count,Unstressed Count,Verdict\n`;
    let serialNumber = 1;
    const csvRows = finalData.map(r => [
      serialNumber,
      `"${r.staff_name}"`,
      r.erpid,
      `"${r.department_name}"`,
      r.stressed_count,
      r.unstressed_count,
      r.verdict
    ].join(','));
    serialNumber++;
    const csvData = csvHeader + csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('staff_stress_report.csv');
    return res.send(csvData);
  } catch (error) {
    console.error('Error generating staff stress report:', error);
    res.status(500).json({ message: 'Failed to generate staff stress report' });
  }
});

// Faculty Leave Report
router.get('/faculty-leave-report', async (req, res) => {
  try {
    const { departmentId, fromDate, toDate, format } = req.query;
    const from = fromDate || '1900-01-01';
    const to = toDate || '2100-12-31';
    let records;
    if (departmentId && departmentId !== 'all') {
      let deptIds = departmentId.includes(',') ? departmentId.split(',').map(Number) : [Number(departmentId)];
      records = await sql`
        SELECT
          fl."StaffName" AS faculty_name,
          fl."ErpStaffId" AS erpid,
          TO_CHAR(fl."fromDate", 'YYYY-MM-DD') AS leave_date,
          d.name AS department_name,
          fl."reason"
        FROM faculty_leave fl
        JOIN faculty f ON fl."ErpStaffId" = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE f.department_id = ANY(${deptIds})
          AND fl."fromDate" >= ${from}::date
          AND fl."toDate" <= ${to}::date
        ORDER BY d.name, fl."StaffName", fl."fromDate"
      `;
    } else {
      records = await sql`
        SELECT
          fl."StaffName" AS faculty_name,
          fl."ErpStaffId" AS erpid,
          TO_CHAR(fl."fromDate", 'YYYY-MM-DD') AS leave_date,
          d.name AS department_name,
          fl."reason"
        FROM faculty_leave fl
        JOIN faculty f ON fl."ErpStaffId" = f.erpid
        JOIN departments d ON f.department_id = d.id
        WHERE fl."fromDate" >= ${from}::date
          AND fl."toDate" <= ${to}::date
        ORDER BY d.name, fl."StaffName", fl."fromDate"
      `;
    }
    const rows = Array.isArray(records) ? records : (records.rows || []);
    if (!rows || rows.length === 0) {
      return res.status(404).send('No leave data found for the selected criteria.');
    }
    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_leave_report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Faculty Leave Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`From: ${from} To: ${to}`, { align: 'center' });
      doc.moveDown();
      const headers = ['S.No', 'Name', 'ERP ID', 'Date', 'Department', 'Reason'];
      const colWidths = [40, 150, 80, 80, 150, 300];
      const startX = doc.x;
      let y = doc.y;
      function drawHeader() {
        let x = startX;
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, i) => {
          doc.rect(x, y, colWidths[i], 20).stroke();
          doc.text(header, x + 2, y + 6, { width: colWidths[i] - 4, align: 'center' });
          x += colWidths[i];
        });
        y += 20;
        doc.font('Helvetica').fontSize(9);
        doc.y = y;
      }
      drawHeader();
      let rowCount = 0;
      let serialNumber = 1;
      rows.forEach(r => {
        const row = [
          serialNumber.toString(),
          r.faculty_name,
          r.erpid,
          r.leave_date,
          r.department_name,
          r.reason
        ];
        let x = startX;
        row.forEach((cell, i) => {
          doc.rect(x, y, colWidths[i], 18).stroke();
          doc.text(String(cell), x + 2, y + 5, { width: colWidths[i] - 4, align: 'center', ellipsis: true });
          x += colWidths[i];
        });
        y += 18;
        rowCount++;
        serialNumber++;
        if (rowCount % 20 === 0) {
          doc.addPage();
          y = doc.y;
          drawHeader();
          y = doc.y;
        }
      });
      doc.end();
      return;
    }
    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Faculty Leave');
      worksheet.addRow(['Faculty Leave Report']);
      worksheet.addRow([`From: ${from} To: ${to}`]);
      worksheet.addRow([]);
      worksheet.columns = [
        { header: 'S.No', key: 'serial_no', width: 10 },
        { header: 'Name', key: 'faculty_name', width: 20 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Date', key: 'leave_date', width: 15 },
        { header: 'Department', key: 'department_name', width: 20 },
        { header: 'Reason', key: 'reason', width: 40 },
      ];
      let serialNumber = 1;
      rows.forEach(r => {
        worksheet.addRow({
          serial_no: serialNumber,
          faculty_name: r.faculty_name,
          erpid: r.erpid,
          leave_date: r.leave_date,
          department_name: r.department_name,
          reason: r.reason,
        });
        serialNumber++;
      });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=faculty_leave_report.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }
    // CSV
    const csvHeader = `Faculty Leave Report\nFrom: ${from} To: ${to}\n\nS.No,Name,ERP ID,Date,Department,Reason\n`;
    let serialNumber = 1;
    const csvRows = rows.map(r => [
      serialNumber,
      `"${r.faculty_name}"`,
      r.erpid,
      r.leave_date,
      `"${r.department_name}"`,
      `"${r.reason}"`
    ].join(','));
    serialNumber++;
    const csvData = csvHeader + csvRows.join('\n');
    res.header('Content-Type', 'text/csv');
    res.attachment('faculty_leave_report.csv');
    return res.send(csvData);
  } catch (error) {
    console.error('Error generating leave report:', error);
    res.status(500).json({ message: 'Failed to generate leave report' });
  }
});

// ... existing code ...
// API Routes
router.get('/energy-data', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM energy_data 
      ORDER BY recorded_at DESC
      LIMIT 100
    `;
    res.json(Array.isArray(rows) ? rows : (rows.rows || []));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/energy-data/summary', async (req, res) => {
  try {
    const rows = await sql`
      SELECT 
        COUNT(*) as record_count,
        SUM(watt) as total_watt,
        SUM(kilo_watt) as total_kilo_watt,
        AVG(volt) as avg_volt,
        AVG(frequency) as avg_frequency,
        AVG(current) as avg_current,
        AVG(power_factor) as avg_power_factor,
        MAX(recorded_at) as latest_record,
        MIN(recorded_at) as oldest_record
      FROM energy_data
    `;
    res.json(Array.isArray(rows) ? rows[0] : (rows.rows ? rows.rows[0] : {}));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/absent-faculty-today', async (req, res) => {
  try {
    const { format = 'pdf', fromDate, toDate, departmentId = 'all' } = req.query;

    const from = fromDate || new Date().toISOString().split('T')[0];
    const to = toDate || from;

    // Query active faculty filtered by department (if provided)
    let facultyQuery = `
      SELECT f.erpid, f.name, d.name AS department_name
      FROM faculty f
      JOIN departments d ON f.department_id = d.id
      WHERE f.is_active = true
    `;
    const queryParams = [];
    if (departmentId !== 'all') {
      const depts = departmentId.split(',').map(id => Number(id));
      facultyQuery += ` AND f.department_id = ANY($1::int[])`;
      queryParams.push(depts);
    }

    const facultyResult = queryParams.length ?
      await sql.query(facultyQuery, queryParams) :
      await sql.query(facultyQuery);
    const allFaculty = facultyResult.rows || facultyResult;

    // Logs for present faculty in date range
    const presentRows = await sql`
      SELECT DISTINCT erp_id FROM faculty_logs
      WHERE DATE(timestamp AT TIME ZONE 'Asia/Kolkata') BETWEEN ${from}::date AND ${to}::date
    `;
    const presentSet = new Set(presentRows.map(r => r.erp_id));

    // Find absent faculty
    const absentFaculty = allFaculty.filter(fac => !presentSet.has(fac.erpid));

    if (!absentFaculty.length) {
      return res.status(404).send('No absent faculty matching criteria.');
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=absent_faculty_report.pdf');
      doc.pipe(res);

      doc.fontSize(18).text('Absent Faculty Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`From: ${from} To: ${to}`, { align: 'center' });
      doc.moveDown();

      // Table header
      const headers = ['S.No', 'ERP ID', 'Name', 'Department'];
      const colWidths = [40, 70, 200, 210];
      const startX = 50;
      let y = doc.y + 10;

      // Draw header row
      let x = startX;
      doc.font('Helvetica-Bold').fontSize(11);
      headers.forEach((header, i) => {
        doc.rect(x, y, colWidths[i], 20).stroke();
        doc.text(header, x + 5, y + 5, { width: colWidths[i] - 10, align: 'center' });
        x += colWidths[i];
      });
      y += 20;

      // Sort absent faculty by department name (branch)
      absentFaculty.sort((a, b) => a.department_name.localeCompare(b.department_name));

      // Draw data rows
      doc.font('Helvetica').fontSize(10);
      absentFaculty.forEach((f, i) => {
        x = startX;
        const row = [
          (i + 1).toString(),
          f.erpid,
          f.name,
          f.department_name
        ];
        row.forEach((cell, j) => {
          doc.rect(x, y, colWidths[j], 18).stroke();
          doc.text(cell, x + 5, y + 4, { width: colWidths[j] - 10, align: 'left' });
          x += colWidths[j];
        });
        y += 18;
        // Add new page if needed
        if (y > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }
      });

      doc.end();
      return;
    } else if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Absent Faculty');

      sheet.columns = [
        { header: 'S.No', key: 'sno', width: 10 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Department', key: 'department', width: 30 },
      ];

      absentFaculty.forEach((f, index) => {
        sheet.addRow({
          sno: index + 1,
          erpid: f.erpid,
          name: f.name,
          department: f.department_name,
        });
      });

      res.setHeader('Content-Disposition', 'attachment; filename=absent_faculty_report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      await workbook.xlsx.write(res);
      res.end();
      return;
    } else if (format === 'csv') {
      let csv = 'S.No,ERP ID,Name,Department\n';
      csv += absentFaculty.map((f, i) =>
        `${i + 1},"${f.erpid}","${f.name}","${f.department_name}"`
      ).join('\n');

      res.setHeader('Content-Disposition', 'attachment; filename=absent_faculty_report.csv');
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    } else {
      return res.status(400).json({ message: 'Unsupported format' });
    }
  } catch (err) {
    console.error('Absent faculty report error:', err);
    return res.status(500).json({ message: 'Error generating absent faculty report' });
  }
});

router.get('/absent-staff-today', async (req, res) => {
  try {
    const { format = 'pdf', fromDate, toDate, departmentId = 'all' } = req.query;
    const from = fromDate || new Date().toISOString().split('T')[0];
    const to = toDate || from;

    // Query all non-teaching staff filtered by department (if provided)
    let staffQuery = `
      SELECT s.erpid, s.name, d.name AS department_name
      FROM non_teaching_staff s
      JOIN departments d ON s.department_id = d.id
    `;
    const queryParams = [];
    if (departmentId !== 'all') {
      const depts = departmentId.split(',').map(id => Number(id));
      staffQuery += ` WHERE s.department_id = ANY($1::int[])`;
      queryParams.push(depts);
    }
    const staffResult = queryParams.length ?
      await sql.query(staffQuery, queryParams) :
      await sql.query(staffQuery);
    const allStaff = staffResult.rows || staffResult;

    // Logs for present staff in date range
    const presentRows = await sql`
      SELECT DISTINCT erp_id FROM faculty_logs
      WHERE DATE(timestamp AT TIME ZONE 'Asia/Kolkata') BETWEEN ${from}::date AND ${to}::date
        AND erp_id IN (SELECT erpid FROM non_teaching_staff)
        AND erp_id <> 'No id'
    `;
    const presentSet = new Set(presentRows.map(r => r.erp_id));

    // Find absent staff
    const absentStaff = allStaff.filter(staff => !presentSet.has(staff.erpid));

    if (!absentStaff.length) {
      return res.status(404).send('No absent staff matching criteria.');
    }

    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=absent_staff_report.pdf');
      doc.pipe(res);

      doc.fontSize(18).text('Absent Non-Teaching Staff Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`From: ${from} To: ${to}`, { align: 'center' });
      doc.moveDown();

      // Table header
      const headers = ['S.No', 'ERP ID', 'Name', 'Department'];
      const colWidths = [40, 70, 200, 210];
      const startX = 50;
      let y = doc.y + 10;

      // Draw header row
      let x = startX;
      doc.font('Helvetica-Bold').fontSize(11);
      headers.forEach((header, i) => {
        doc.rect(x, y, colWidths[i], 20).stroke();
        doc.text(header, x + 5, y + 5, { width: colWidths[i] - 10, align: 'center' });
        x += colWidths[i];
      });
      y += 20;

      // Sort absent staff by department name
      absentStaff.sort((a, b) => a.department_name.localeCompare(b.department_name));

      // Draw data rows
      doc.font('Helvetica').fontSize(10);
      absentStaff.forEach((s, i) => {
        x = startX;
        const row = [
          (i + 1).toString(),
          s.erpid,
          s.name,
          s.department_name
        ];
        row.forEach((cell, j) => {
          doc.rect(x, y, colWidths[j], 18).stroke();
          doc.text(cell, x + 5, y + 4, { width: colWidths[j] - 10, align: 'left' });
          x += colWidths[j];
        });
        y += 18;
        if (y > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }
      });
      doc.end();
      return;
    } else if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Absent Staff');
      sheet.columns = [
        { header: 'S.No', key: 'sno', width: 10 },
        { header: 'ERP ID', key: 'erpid', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Department', key: 'department', width: 30 },
      ];
      absentStaff.forEach((s, index) => {
        sheet.addRow({
          sno: index + 1,
          erpid: s.erpid,
          name: s.name,
          department: s.department_name,
        });
      });
      res.setHeader('Content-Disposition', 'attachment; filename=absent_staff_report.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      await workbook.xlsx.write(res);
      res.end();
      return;
    } else if (format === 'csv') {
      let csv = 'S.No,ERP ID,Name,Department\n';
      csv += absentStaff.map((s, i) =>
        `${i + 1},"${s.erpid}","${s.name}","${s.department_name}"`
      ).join('\n');
      res.setHeader('Content-Disposition', 'attachment; filename=absent_staff_report.csv');
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    } else {
      return res.status(400).json({ message: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Absent staff report error:', error);
    return res.status(500).json({ message: 'Error generating absent staff report' });
  }
});


module.exports = router; 