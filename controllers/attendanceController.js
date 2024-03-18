const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const { successDataType, successEmptyDataType } = require("../responseFormat");



//@desc Gets Student list of particular date attendance of a batch
//@route POST /attendance/studentListWithAttendanceDetail
//@access Public
const studentListWithAttendanceDetail = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {
            batch_id,
            date
        } = req.body;


        if(!batch_id || !date) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }


        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `
            SELECT s.*, COALESCE(a.is_present, FALSE) AS is_present
            FROM students s
            LEFT JOIN (
                SELECT student_id, is_present
                FROM attendance
                WHERE batch_id = ? AND attendance_date = ?
            ) a ON s.student_id = a.student_id
            WHERE s.student_id IN (
                SELECT student_id
                FROM student_batches
                WHERE batch_id = ?
            ) AND s.admission_date < ?;
            `,
            [batch_id, date, batch_id, date]
        );
        res.json(successDataType(rows));
    } catch (error) {
        res.status(400);
        throw new Error(`Error: ${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});



//@desc Add attendance of a batch of a particular date
//@route POST /attendance/addBatchAttendance
//@access Public
const addBatchAttendance = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {
            batch_id,
            student_data,
            date
        } = req.body;


        if(!batch_id || !student_data || !date) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

         // Initialize an array to store the results for each insertion.
         const insertionResults = [];
         connection = await rdsConnection.getConnection();
        
         // Loop through the student_data list.
        for (const student of student_data) {
            const { student_id, is_present } = student;

            // Insert attendance record for the current student.
            const [attendanceRows] = await connection.query(
                `
                INSERT INTO attendance (student_id, batch_id, attendance_date, is_present) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE is_present = ?;`,
                [student_id, batch_id, date, is_present, is_present]
               );

            // Add the insertion result to the array.
            insertionResults.push(attendanceRows);
        }



        res.json(successEmptyDataType());
    } catch (error) {
        res.status(400);
        throw new Error(`Error: ${error}`);
    }  finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});





//@desc Get attendance of a particular student
//@route POST /attendance/getStudentAttendancebyStudentId
//@access Public
const getStudentAttendancebyStudentId = asyncHandler(async (req, res) => {
    let connection;
    try {

        const {
            student_id,
        } = req.body;


        if(!student_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();

        const [rows] = await connection.query(
            `
            SELECT  a.* , b.batch_name,b.subject_name 
            FROM attendance a JOIN batch b ON 
            a.batch_id = b.batch_id WHERE student_id = ?
            ORDER BY attendance_date, batch_id;
            `,
            [student_id]
          );  

        res.json(successDataType(rows));
    } catch (error) {
        res.status(400);
        throw new Error(`Error: ${error}`);
    }  finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});


module.exports = {
    studentListWithAttendanceDetail,
    addBatchAttendance,
    getStudentAttendancebyStudentId
}