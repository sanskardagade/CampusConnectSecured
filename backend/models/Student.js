const sql = require('../config/neonsetup');

const mapStudent = (row) => ({
  id: row.id,
  erpid: row.erpid,
  name: row.name,
  departmentId: row.department_id,
  email: row.email,
  contactNo: row.contact_no,  // Add contactNo mapping
  dob: row.dob,  // Changed from DOB to dob for consistency
  year: row.year,
  division: row.division,
  rollNo: row.roll_no,  // Changed from roll_no to rollNo for consistency
  createdAt: row.created_at,  // Changed from createdQt to createdAt
  updatedAt: row.updated_at,
  gender: row.gender,
  classTeacher: row.class_teacher,
  semester: row.semester,
  elective_subject_id : row.elective_subject_id,
  passwordHash: row.password_hash  // Changed from password_hash to passwordHash
});

const findByErp = async (erpid) => {
  try {
    const rows = await sql`
      SELECT * FROM students WHERE erpid = ${erpid} LIMIT 1
    `;
    if (!rows[0]) return null;
    return mapStudent(rows[0]);
  } catch (error) {
    console.error('Error in findByErp:', error);
    throw error;
  }
};

const findByEmail = async (email) => {

  try {

    const rows = await sql`

      SELECT * FROM students WHERE email = ${email} LIMIT 1

    `;

    if (!rows[0]) return null;

    return mapStudent(rows[0]);

  } catch (error) {

    console.error('Error in findByEmail:', error);

    throw error;

  }

};

const create = async ({ erpid, name, email, password, department, semester }) => {
  try {
    // Store password as plain text to match existing database structure
    const result = await sql`
      INSERT INTO students 
        (erpid, name, email, password_hash, department_id, semester)
      VALUES 
        (${erpid}, ${name}, ${email}, ${password}, ${department}, ${semester})
      RETURNING *
    `;
    return mapStudent(result[0]);
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

const update = async (erpid, updateData) => {
  try {
    const result = await sql`
      UPDATE students
      SET
        name = COALESCE(${updateData.name}, name),
        email = COALESCE(${updateData.email}, email),
        contact_no = COALESCE(${updateData.contactNo}, contact_no),
        dob = COALESCE(${updateData.dob ? new Date(updateData.dob) : null}, dob),
        gender = COALESCE(${updateData.gender}, gender),
        department_id = COALESCE(${updateData.departmentId}, department_id),
        semester = COALESCE(${updateData.semester}, semester),
        updated_at = NOW()
      WHERE erpid = ${erpid}
      RETURNING *
    `;
    return result[0] ? mapStudent(result[0]) : null;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

// const comparePassword = async (password, passwordHash) => {

//   try {

//     if (!password || !passwordHash) {

//       return false;

//     }

//     return await bcrypt.compare(password, passwordHash);

//   } catch (error) {

//     console.error('Error comparing passwords:', error);

//     throw error;

//   }

// };

const comparePassword = async (password, passwordHash) => {
  try {
    if (!password || !passwordHash) {
      return false;
    }
    // Simple string comparison since passwords are stored as plain text
    return password === passwordHash;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};


const updatePassword = async (erpid, newPassword) => {
  try {
    // Store password as plain text since that's how they're currently stored
    const result = await sql`
      UPDATE students
      SET
        password_hash = ${newPassword},
        updated_at = NOW()
      WHERE erpid = ${erpid}
      RETURNING *
    `;
    return result[0] ? mapStudent(result[0]) : null;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

const getStudentProfile = async (erpid) => {

  try {

    const rows = await sql`

      SELECT

        s.*,

        d.name AS department_name,

        f.name AS class_teacher_name

      FROM students s

      LEFT JOIN departments d ON s.department_id = d.id

      LEFT JOIN faculty f ON s.class_teacher = f.erpid

      WHERE s.erpid = ${erpid}

      LIMIT 1

    `;

    if (!rows[0]) return null;

    

    const student = mapStudent(rows[0]);

    return {

      ...student,

      departmentName: rows[0].department_name,

      classTeacherName: rows[0].class_teacher_name

    };

  } catch (error) {

    console.error('Error getting student profile:', error);

    throw error;

  }

};

module.exports = {

  findByErp,

  findByEmail,

  create,

  comparePassword,

  mapStudent,

  updatePassword,

  update,

  getStudentProfile

};