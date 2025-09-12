const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');
const crypto = require('crypto');

// Map Registrar DB row to JS object
const mapRegistrar = (row) => {
  console.log('Mapping registrar row:', row);
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
 * Find registrar record by ERP ID
 * @param {string|number} erpid
 */
const findByErp = async (erpid) => {
  console.log('Finding registrar by ERP ID:', erpid);
  const rows = await sql`
    SELECT * FROM registrar WHERE erpid = ${erpid} AND is_active = true LIMIT 1
  `;
  console.log('Database query result:', rows);
  if (!rows[0]) return null;
  return mapRegistrar(rows[0]);
};

/**
 * Find registrar by email
 * @param {string} email
 */
const findByEmail = async (email) => {
  const rows = await sql`
    SELECT * FROM registrar WHERE email = ${email} AND is_active = true LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapRegistrar(rows[0]);
};

/**
 * Create new registrar
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
    INSERT INTO registrar (
      erpid, name, email, password_hash, start_date
    ) VALUES (
      ${erpid}, ${name}, ${email}, ${passwordHash}, ${startDate}
    ) RETURNING *
  `;
  return mapRegistrar(result[0]);
};

/**
 * Update registrar profile
 */
const update = async (erpid, updates) => {
  const result = await sql`
    UPDATE registrar
    SET 
      name = ${updates.name},
      email = ${updates.email},
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapRegistrar(result[0]) : null;
};

/**
 * Update registrar password
 */
const updatePassword = async (erpid, newPassword) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const result = await sql`
    UPDATE registrar
    SET 
      password_hash = ${passwordHash},
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid} AND is_active = true
    RETURNING *
  `;
  return result[0] ? mapRegistrar(result[0]) : null;
};

/**
 * Generate password reset token
 */
const generatePasswordResetToken = async (email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  const result = await sql`
    UPDATE registrar
    SET 
      password_reset_token = ${token},
      token_expiry = ${expiry},
      updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email} AND is_active = true
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
    UPDATE registrar
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
  return result[0] ? mapRegistrar(result[0]) : null;
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  // If the hash is a bcrypt hash, use bcrypt compare
  if (hash && hash.startsWith('$2')) {
    return await bcrypt.compare(password, hash);
  }
  // Otherwise, fallback to plain text comparison
  return password === hash;
};

/**
 * Deactivate registrar account
 */
const deactivate = async (erpid) => {
  const result = await sql`
    UPDATE registrar
    SET 
      is_active = false,
      end_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE erpid = ${erpid}
    RETURNING *
  `;
  return result[0] ? mapRegistrar(result[0]) : null;
};

/**
 * Migrate plain text passwords to hashed passwords
 * This is a utility function for existing data migration
 */
const migrateToHashedPasswords = async () => {
  try {
    // Get all registrars with plain text passwords
    const registrars = await sql`
      SELECT * FROM registrar 
      WHERE password_hash IS NULL OR password_hash = ''
    `;

    for (const registrar of registrars) {
      // Generate a default password (you might want to notify users to change it)
      const defaultPassword = 'Registrar@123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      await sql`
        UPDATE registrar
        SET password_hash = ${passwordHash}
        WHERE id = ${registrar.id}
      `;
    }

    console.log(`Migrated ${registrars.length} registrar passwords`);
  } catch (error) {
    console.error('Password migration error:', error);
    throw error;
  }
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
  mapRegistrar,
  migrateToHashedPasswords
}; 