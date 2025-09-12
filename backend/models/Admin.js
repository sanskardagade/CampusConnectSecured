const sql = require('../config/neonsetup');

// Map Admin DB row to JS object
const mapAdmin = (row) => {
  return {
    id: row.id,
    adminname: row.adminname,
    name: row.name,
    email: row.email,
    password: row.password
  };
};

/**
 * Find admin record by adminname
 * @param {string} adminname
 */
const findByErp = async (adminname) => {
  const rows = await sql`
    SELECT * FROM admin WHERE adminname = ${adminname} LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapAdmin(rows[0]);
};

/**
 * Find admin by adminname (alias for findByErp)
 */
const findByEmail = findByErp;

/**
 * Create new admin
 */
const create = async ({ adminname, password }) => {
  const result = await sql`
    INSERT INTO admin (adminname, password) VALUES (${adminname}, ${password}) RETURNING *
  `;
  return mapAdmin(result[0]);
};

/**
 * Update admin
 */
const update = async (adminname, updateData) => {
  const result = await sql`
    UPDATE admin
    SET 
      adminname = COALESCE(${updateData.adminname}, adminname),
      password = COALESCE(${updateData.password}, password)
    WHERE adminname = ${adminname}
    RETURNING *
  `;
  return result[0] ? mapAdmin(result[0]) : null;
};

/**
 * Update password
 */
const updatePassword = async (adminname, newPassword) => {
  const result = await sql`
    UPDATE admin
    SET password = ${newPassword}
    WHERE adminname = ${adminname}
    RETURNING *
  `;
  return result[0] ? mapAdmin(result[0]) : null;
};

/**
 * Compare provided password with stored password (plain text)
 */
const comparePassword = async (password, storedPassword) => {
  return password === storedPassword;
};

/**
 * Deactivate admin (not implemented, just a stub)
 */
const deactivate = async (adminname) => {
  // No is_active or end_date columns, so just return null
  return null;
};

module.exports = {
  findByErp,
  findByEmail,
  create,
  update,
  updatePassword,
  comparePassword,
  deactivate,
  mapAdmin
}; 