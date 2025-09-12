const bcrypt = require('bcryptjs');
const sql = require('../config/neonsetup');

const AddLeaveIntoTable = async (leaveData) => {
    try {
        console.log("Received leave data:", leaveData);
        
        const query = `
            INSERT INTO faculty_leave (
                "ApplicationDate",
                "StaffName",
                "ErpStaffId",
                "fromDate",
                "toDate",
                "reason",
                "leaveType"
            ) VALUES (
                CURRENT_DATE, $1, $2, $3, $4, $5, $6
            ) RETURNING *;
        `;

        const values = [
            leaveData.StaffName,
            leaveData.ErpStaffID,
            leaveData.fromDate,
            leaveData.toDate,
            leaveData.reason,
            leaveData.leaveType
        ];

        console.log("Query:", query);
        console.log("Values:", values);

        const result = await sql.query(query, values);
        console.log("Query result:", result);
        
        if (!result || result.length === 0) {
            console.error("No rows returned from insert");
            throw new Error('Failed to insert leave application');
        }

        return result[0];
    } catch(err) {
        console.error("Error inserting into faculty_leave table:", err);
        console.error("Error details:", err.message);
        throw err;
    }
}

module.exports = {
    AddLeaveIntoTable
};