const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');

// Map DB row to JS object
const mapUser = (row) => ({
  id: row.id,
  username: row.username,
  name: row.name,
  email: row.email,
  role: row.role,
  department: row.department,
  contactNo: row.contact_no,
  facultyId: row.faculty_id,
  subjects: row.subjects ? JSON.parse(row.subjects) : [],
  assignedClasses: row.assigned_classes ? JSON.parse(row.assigned_classes) : [],
  hodId: row.hod_id,
  departmentManaged: row.department_managed,
  principalId: row.principal_id,
  departmentsUnderManagement: row.departments_under_management
    ? JSON.parse(row.departments_under_management)
    : [],
  password_hash: row.password_hash,
});

const findByEmail = async (email) => {
  const rows = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapUser(rows[0]);
};

const findByUsername = async (username) => {
  const rows = await sql`
    SELECT * FROM users WHERE username = ${username} LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapUser(rows[0]);
};

const findByFacultyId = async (facultyId) => {
  const [rows] = await sql`
    SELECT * FROM users WHERE faculty_id = ${facultyId} LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapUser(rows[0]);
};

const findByHodId = async (hodId) => {
  const [rows] = await sql`
    SELECT * FROM users WHERE hod_id = ${hodId} LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapUser(rows[0]);
};

const findByPrincipalId = async (principalId) => {
  const [rows] = await sql`
    SELECT * FROM users WHERE principal_id = ${principalId} LIMIT 1
  `;
  if (!rows[0]) return null;
  return mapUser(rows[0]);
};

const create = async ({
  username,
  name,
  email,
  password,
  role,
  contactNo,
  department,
  facultyId,
  subjects,
  assignedClasses,
  hodId,
  departmentManaged,
  principalId,
  departmentsUnderManagement,
}) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await sql`
    INSERT INTO users (
      username, name, email, password_hash, role, contact_no, department,
      faculty_id, subjects, assigned_classes,
      hod_id, department_managed,
      principal_id, departments_under_management
    ) VALUES (
      ${username}, ${name}, ${email}, ${passwordHash}, ${role}, ${contactNo}, ${department},
      ${facultyId || null}, ${JSON.stringify(subjects || [])}, ${JSON.stringify(assignedClasses || [])},
      ${hodId || null}, ${departmentManaged || null},
      ${principalId || null}, ${JSON.stringify(departmentsUnderManagement || [])}
    ) RETURNING *
  `;

  return mapUser(result[0]);
};

const comparePassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

module.exports = {
  findByEmail,
  findByUsername,
  create,
  comparePassword,
  findByFacultyId,
  findByHodId,
  findByPrincipalId,
  mapUser
}; 