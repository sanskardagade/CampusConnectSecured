const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { authenticateToken } = require('./middleware/auth');
const sql = require('./config/neonsetup');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const hodRoutes = require('./routes/hod');
const principalRoutes = require('./routes/principal');
const registrarRoutes = require('./routes/registrar');
const chatbotRoutes = require('./routes/chatbot');
const studentAttendanceRoutes = require('./routes/StudentAttendance');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/registrar', registrarRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/studentAttendance', studentAttendanceRoutes);
app.use('/api/admin', require('./routes/admin'));


app.get('/api/hod/faculty-log', authenticateToken, async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM faculty_logs
    `;
    res.json(rows);
  } catch (error) {
    console.error("Error fetching faculty log:", error);
    res.status(500).json({ message: "Error fetching faculty log" });
  }
});

//Principal Leave Approval
app.get('/api/principal/faculty-leave-approval', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM faculty_leave
      WHERE "HodApproval" = 'Approved'
    `;
    console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error("Detailed error in /leave-approval route:", error);
    res.status(500).json({ message: "Error fetching all leave applications" });
  }
});

// Function to calculate number of days between two dates
const calculateLeaveDays = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  
  // Set time to midnight to avoid time zone issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  
  console.log(`Date calculation: ${fromDate} to ${toDate} = ${diffDays} days`);
  return diffDays;
};

// Function to update leave balances when leave is approved
const updateLeaveBalances = async (erpStaffId, leaveType, daysToDeduct) => {
  try {
    console.log(`Updating leave balances for ${erpStaffId}, type: ${leaveType}, days: ${daysToDeduct}`);
    
    // Get current leave balance using a switch statement for column names
    let currentBalance;
    switch (leaveType) {
      case 'sick':
        currentBalance = await sql`SELECT sick as current_balance FROM faculty_leave_balances WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'academic':
        currentBalance = await sql`SELECT academic as current_balance FROM faculty_leave_balances WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'emergency':
        currentBalance = await sql`SELECT emergency as current_balance FROM faculty_leave_balances WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'maternity':
        currentBalance = await sql`SELECT maternity as current_balance FROM faculty_leave_balances WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'family':
        currentBalance = await sql`SELECT family as current_balance FROM faculty_leave_balances WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'travel':
        currentBalance = await sql`SELECT travel as current_balance FROM faculty_leave_balances WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'other':
        currentBalance = await sql`SELECT other as current_balance FROM faculty_leave_balances WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      default:
        console.log('Invalid leave type:', leaveType);
        return false;
    }
    
    if (!currentBalance || currentBalance.length === 0) {
      console.log('No leave balance record found for faculty:', erpStaffId);
      return false;
    }
    
    const currentDays = currentBalance[0].current_balance;
    const newBalance = currentDays - daysToDeduct;
    
    if (newBalance < 0) {
      console.log('Insufficient leave balance. Current:', currentDays, 'Requested:', daysToDeduct);
      return false;
    }
    
    // Update the leave balance using a switch statement for column names
    switch (leaveType) {
      case 'sick':
        await sql`UPDATE faculty_leave_balances SET sick = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'academic':
        await sql`UPDATE faculty_leave_balances SET academic = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'emergency':
        await sql`UPDATE faculty_leave_balances SET emergency = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'maternity':
        await sql`UPDATE faculty_leave_balances SET maternity = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'family':
        await sql`UPDATE faculty_leave_balances SET family = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'travel':
        await sql`UPDATE faculty_leave_balances SET travel = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      case 'other':
        await sql`UPDATE faculty_leave_balances SET other = ${newBalance}, updated_at = CURRENT_TIMESTAMP WHERE "ErpStaffId" = ${erpStaffId}`;
        break;
      default:
        console.log('Invalid leave type for update:', leaveType);
        return false;
    }
    
    console.log(`Successfully updated leave balance. New balance for ${leaveType}: ${newBalance}`);
    return true;
  } catch (error) {
    console.error('Error updating leave balances:', error);
    return false;
  }
};

app.put('/api/principal/faculty-leave-approval/:erpStaffId', async (req, res) => {
  const { erpStaffId } = req.params;
  const { PrincipalApproval} = req.body;

  try {
    // Validate the approval status
    if (!['Approved', 'Rejected'].includes(PrincipalApproval)) {
      return res.status(400).json({ error: 'Invalid approval status' });
    }

    if (PrincipalApproval === 'Approved') {
      // Get the leave application details to calculate days
      const leaveApplication = await sql`
        SELECT "leaveType", "fromDate", "toDate", "StaffName"
        FROM faculty_leave 
        WHERE "ErpStaffId" = ${erpStaffId} AND "FinalStatus" = 'Pending'
      `;
      
      if (!leaveApplication || leaveApplication.length === 0) {
        return res.status(404).json({ error: 'Leave application not found or already processed' });
      }
      
      const leave = leaveApplication[0];
      const daysToDeduct = calculateLeaveDays(leave.fromDate, leave.toDate);
      const leaveType = leave.leaveType;
      
      console.log(`Processing approval for ${leave.StaffName}: ${daysToDeduct} days of ${leaveType} leave`);
      
      // Update leave balances
      const balanceUpdated = await updateLeaveBalances(erpStaffId, leaveType, daysToDeduct);
      
      if (!balanceUpdated) {
        return res.status(400).json({ 
          error: 'Insufficient leave balance or leave balance record not found',
          details: `Requested ${daysToDeduct} days of ${leaveType} leave`
        });
      }
      
      console.log(`Successfully deducted ${daysToDeduct} days from ${leaveType} leave balance`);
    }

    // Update both PrincipalApproval and FinalStatus
    await sql`
      UPDATE faculty_leave 
      SET "PrincipalApproval" = ${PrincipalApproval},
          "FinalStatus" = ${PrincipalApproval}
      WHERE "ErpStaffId" = ${erpStaffId}
    `;
    
    res.json({ 
      message: 'Leave approval updated successfully',
      details: PrincipalApproval === 'Approved' ? 'Leave days deducted from balance' : 'Leave application rejected'
    });
  } catch (error) {
    console.error('Error updating leave approval:', error);
    res.status(500).json({ error: 'Error updating leave approval' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Test database connection and start server
async function startServer() {
  try {
    // Test the database connection
    const result = await sql`SELECT version()`;
    console.log('✅ Successfully connected to Neon DB');
    console.log('📦 PostgreSQL Version:', result[0].version);

    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
}

// Start the server
startServer();