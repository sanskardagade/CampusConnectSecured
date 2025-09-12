const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');
const crypto = require('crypto');

// Map Principal DB row to JS object
const mapPrincipal = (row) => {
  console.log('Mapping principal row:', row);
  return {
    id: row.id,
    erpid: row.erpid,
    name: row.name,
    email: row.email,
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
 * Find principal record by ERP ID
 * @param {string|number} erpid
 */
const findByErp = async (erpid) => {
  console.log('Finding principal by ERP ID:', erpid);
  const rows = await sql`
    SELECT * FROM principal WHERE erpid = ${erpid} AND is_active = true LIMIT 1
  `;
  console.log('Database query result:', rows);
  if (!rows[0]) return null;
  return mapPrincipal(rows[0]);
};

/**
 * Find principal by email
 * @param {string} email
 */
const findByEmail = async (email) => {
  const rows = await sql`
    SELECT * FROM principal WHERE email = ${email} AND is_active = true LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapPrincipal(rows[0]);
};

/**
 * Create new principal
 */
const create = async ({
  erpid,
  name,
  email,
  password,
  startDate = new Date()
}) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await sql`
    INSERT INTO principal (
      erpid, name, email, password_hash, start_date
    ) VALUES (
      ${erpid}, ${name}, ${email}, ${passwordHash}, ${startDate}
    ) RETURNING *
  `;
  return mapPrincipal(result[0]);
};

/**
 * Update principal
 */
const update = async (erpid, updateData) => {
  const result = await sql`
    UPDATE principal
    SET 
      name = COALESCE(${updateData.name}, name),
      email = COALESCE(${updateData.email}, email),
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapPrincipal(result[0]) : null;
};

/**
 * Update password
 */
const updatePassword = async (erpid, newPassword) => {
  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const result = await sql`
    UPDATE principal
    SET 
      password_hash = ${passwordHash},
      password_reset_token = NULL,
      token_expiry = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapPrincipal(result[0]) : null;
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = async (erpid) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour from now

  const result = await sql`
    UPDATE principal
    SET 
      password_reset_token = ${token},
      token_expiry = ${expiry},
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
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
    UPDATE principal
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
  return result[0] ? mapPrincipal(result[0]) : null;
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
    // Get all principals with plain text passwords
    const rows = await sql`
      SELECT id, erpid, password_hash 
      FROM principal 
      WHERE password_hash IS NOT NULL
    `;

    for (const row of rows) {
      // Hash the existing password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(row.password_hash, salt);

      // Update with hashed password
      await sql`
        UPDATE principal
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
 * Deactivate principal
 */
const deactivate = async (erpid, endDate = new Date()) => {
  const result = await sql`
    UPDATE principal
    SET 
      is_active = false,
      end_date = ${endDate},
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapPrincipal(result[0]) : null;
};

module.exports = {
  findByErp,
  findByEmail,
  create,
  update,
  updatePassword,
  generatePasswordResetToken,
  resetPassword,
  comparePassword,
  deactivate,
  mapPrincipal,
  migrateToHashedPasswords
}; 