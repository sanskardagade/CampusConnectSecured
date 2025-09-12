const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');
const crypto = require('crypto');

// Map HOD DB row to JS object
const mapHod = (row) => {
  console.log('Mapping HOD row:', row);
  return {
    id: row.id,
    erpStaffId: row.erpid,
    name: row.name,
    email: row.email,
    departmentId: row.department_id,
    passwordHash: row.password_hash,
    passwordResetToken: row.password_reset_token,
    tokenExpiry: row.token_expiry,
    isActive: row.is_active,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

/**
 * Find HOD by ERP Staff ID
 */
const findByErpStaffId = async (erpStaffId) => {
  console.log('Finding HOD by ERP Staff ID:', erpStaffId);
  const rows = await sql`
    SELECT * FROM hod WHERE erpid = ${erpStaffId} AND is_active = true LIMIT 1
  `;
  console.log('Database query result:', rows);
  if (!rows[0]) return null;
  return mapHod(rows[0]);
};

/**
 * Get all active HODs
 */
const getAll = async () => {
  const rows = await sql`
    SELECT * FROM hod WHERE is_active = true
  `;
  return rows.map(mapHod);
};

/**
 * Get HODs by department
 */
const getByDepartment = async (departmentId) => {
  const rows = await sql`
    SELECT * FROM hod WHERE department_id = ${departmentId} AND is_active = true
  `;
  return rows.map(mapHod);
};

/**
 * Create new HOD
 */
const create = async ({
  erpStaffId,
  name,
  email,
  departmentId,
  password,
  startDate = new Date()
}) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await sql`
    INSERT INTO hod (
      erpid, name, email, department_id, password_hash, start_date
    ) VALUES (
      ${erpStaffId}, ${name}, ${email}, ${departmentId}, ${passwordHash}, ${startDate}
    ) RETURNING *
  `;
  return mapHod(result[0]);
};

/**
 * Update HOD
 */
const update = async (erpStaffId, updateData) => {
  const result = await sql`
    UPDATE hod
    SET 
      name = COALESCE(${updateData.name}, name),
      email = COALESCE(${updateData.email}, email),
      department_id = COALESCE(${updateData.departmentId}, department_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpStaffId} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapHod(result[0]) : null;
};

/**
 * Update password
 */
const updatePassword = async (erpStaffId, newPassword) => {
  const result = await sql`
    UPDATE hod
    SET 
      password_hash = ${newPassword},
      password_reset_token = NULL,
      token_expiry = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpStaffId} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapHod(result[0]) : null;
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = async (erpStaffId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour from now

  const result = await sql`
    UPDATE hod
    SET 
      password_reset_token = ${token},
      token_expiry = ${expiry},
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpStaffId} AND is_active = true
    RETURNING *
  `;
  return result[0] ? { token, expiry } : null;
};

/**
 * Reset password using token
 */
const resetPassword = async (token, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const result = await sql`
    UPDATE hod
    SET 
      password_hash = ${passwordHash},
      password_reset_token = NULL,
      token_expiry = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE password_reset_token = ${token} 
      AND token_expiry > CURRENT_TIMESTAMP
      AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapHod(result[0]) : null;
};

/**
 * Compare provided password with stored password
 */
const comparePassword = async (password, storedPassword) => {
  console.log('Comparing passwords...');
  console.log('Provided password:', password);
  console.log('Stored password:', storedPassword);
  
  if (!password || !storedPassword) {
    console.log('Missing password or stored password');
    return false;
  }

  // Direct comparison since passwords are stored as plain text
  const isMatch = password === storedPassword;
  console.log('Password comparison result:', isMatch);
  return isMatch;
};

/**
 * Migrate plain text passwords to hashed passwords
 */
const migrateToHashedPasswords = async () => {
  try {
    // Get all HODs with plain text passwords
    const rows = await sql`
      SELECT id, erpid, password_hash 
      FROM hod 
      WHERE password_hash IS NOT NULL
    `;

    for (const row of rows) {
      // Hash the existing password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(row.password_hash, salt);

      // Update with hashed password
      await sql`
        UPDATE hod
        SET password_hash = ${hashedPassword}
        WHERE id = ${row.id}
      `;
    }

    return true;
  } catch (error) {
    console.error('Error migrating passwords:', error);
    return false;
  }
};

/**
 * Deactivate HOD
 */
const deactivate = async (erpStaffId, endDate = new Date()) => {
  const result = await sql`
    UPDATE hod
    SET 
      is_active = false,
      end_date = ${endDate},
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpStaffId} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapHod(result[0]) : null;
};

module.exports = {
  findByErpStaffId,
  getAll,
  getByDepartment,
  create,
  update,
  updatePassword,
  generatePasswordResetToken,
  resetPassword,
  comparePassword,
  deactivate,
  mapHod,
  migrateToHashedPasswords
}; 