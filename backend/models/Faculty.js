const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');

// Map faculty DB row to JS object
const mapFaculty = (row) => ({
  id: row.id,
  erpStaffId: row.erpid,
  name: row.name,
  email: row.email,
  departmentId: row.department_id,
  passwordHash: row.password_hash,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Find faculty by ERP Staff ID
const findByErpStaffId = async (erpStaffId) => {
  try {
    const rows = await sql`
      SELECT 
        f.*,
        d.name as department_name
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.id
      WHERE f.erpid = ${erpStaffId}::text
      LIMIT 1
    `;

    if (!rows[0]) {
      console.log('No faculty found with erpStaffId:', erpStaffId);
      return null;
    }
    
    const faculty = mapFaculty(rows[0]);
    return faculty;
  } catch (error) {
    console.error('Error in findByErpStaffId:', error);
    throw error;
  }
};

// Update faculty
const update = async (erpStaffId, updateData) => {
  try {
    console.log('Updating faculty with erpStaffId:', erpStaffId);
    console.log('Update data:', updateData);

    // First check if faculty exists
    const facultyExists = await sql`
      SELECT erpid FROM faculty WHERE erpid = ${erpStaffId}::text
    `;
    
    if (facultyExists.length === 0) {
      console.log('Faculty not found with erpStaffId:', erpStaffId);
      return null;
    }

    // Update the faculty record
    const result = await sql`
      UPDATE faculty 
      SET email = ${updateData.email},
          updated_at = CURRENT_TIMESTAMP
      WHERE erpid = ${erpStaffId}::text
      RETURNING *
    `;
    console.log('Update result:', result);

    if (result.length === 0) {
      console.log('No faculty found to update with erpStaffId:', erpStaffId);
      return null;
    }

    // Get the updated faculty data with department
    const updatedFaculty = await findByErpStaffId(erpStaffId);
    console.log('Updated faculty:', updatedFaculty);
    return updatedFaculty;
  } catch (error) {
    console.error('Error updating faculty:', error);
    throw error;
  }
};

// Compare provided password with stored value
const comparePassword = async (password, passwordHash) => {
  return password === passwordHash;
};

class Faculty {
  static async updatePassword(erpStaffId, password) {
    try {
      const result = await sql`
        UPDATE faculty 
        SET password_hash = ${password},
            updated_at = NOW()
        WHERE erpid = ${erpStaffId}
        RETURNING erpid
      `;
      return result.length > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

// Find facultyLog by ERP Staff ID and date (single day), returns first and last log for that date
const findByErpStaffIdAndDateRange = async (erpStaffId, date) => {
  try {
    const rows = await sql`
      (
        SELECT * 
        FROM faculty_logs 
        WHERE erp_id = ${erpStaffId} 
          AND DATE(timestamp) = ${date} 
        ORDER BY timestamp ASC 
        LIMIT 1
      )
      UNION ALL
      (
        SELECT * 
        FROM faculty_logs 
        WHERE erp_id = ${erpStaffId} 
          AND DATE(timestamp) = ${date} 
        ORDER BY timestamp DESC 
        LIMIT 1
      );
    `;
    return rows;
  } catch (error) {
    console.error('Error in findByErpStaffIdAndDateRange:', error);
    throw error;
  }
};


module.exports = {
  findByErpStaffId,
  comparePassword,
  mapFaculty,
  update,
  findByErpStaffIdAndDateRange
}; 