const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const { successDataType, successEmptyDataType } = require("../responseFormat");



//@desc Creates a test
//@route POST /test/createTest
//@access Public
const createTest = asyncHandler(async (req, res) => {
    let connection;
    try {

        const {
            batch_id,
            test_date,
            test_name,
            test_description,
            max_marks
        } = req.body;


        if(!batch_id || !test_date || !test_name || !test_description || !max_marks) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `
            INSERT INTO tests_details (batch_id, test_date, test_name, test_description, max_marks)
            VALUES (?, ?, ?, ?, ?);`,
            [batch_id, test_date, test_name, test_description, max_marks]
        );
        res.json(successEmptyDataType());
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



//@desc Gets test data based on batch Id
//@route POST /test/getTestsBasedOnBatchId
//@access Public
const getTestsBasedOnBatchId = asyncHandler(async (req, res) => {
    let connection;
    try {

        const {batch_id} = req.body;

        if(!batch_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `SELECT * FROM tests_details where batch_id = ? ORDER BY test_id desc;`,
            [batch_id]
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




//@desc Gets test data based on batch Id with assigned or not assigned info
//@route POST /test/getTestsWithAssignedInfoBasedOnBatchId
//@access Public
const getTestsWithAssignedInfoBasedOnBatchId = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {batch_id} = req.body;
        if(!batch_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            ` SELECT td.*,
                (
                    SELECT COUNT(DISTINCT sm.student_id)
                    FROM student_marks sm
                    WHERE sm.test_id = td.test_id
                    AND sm.batch_id = ?
                    AND sm.marks_obtained IS NOT NULL
                    ) = (
                        SELECT COUNT(*) FROM students s
                        JOIN  student_batches sb on 
                        s.student_id = sb.student_id
                        WHERE sb.batch_id = ? 
                        AND s.admission_date < td.test_date
                        ) AS all_student_marks_assigned
                        FROM tests_details td
                        WHERE td.batch_id = ?
                        ORDER BY td.test_id DESC;`,
            [batch_id, batch_id, batch_id]
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




//@desc Gets all student list with marks obtained info
//@route POST /test/studentListWithMarksObtainedDetail
//@access Public
const studentListWithMarksObtainedDetail = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {batch_id, test_id} = req.body;
        if(!batch_id || !test_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
        `
            SELECT s.*, COALESCE(a.marks_obtained, null) AS marks_obtained
            FROM students s
            LEFT JOIN (
                SELECT student_id, marks_obtained
                FROM student_marks
                WHERE batch_id = ? AND test_id = ?
            ) a ON s.student_id = a.student_id
            WHERE s.student_id IN (
                SELECT student_id
                FROM student_batches
                WHERE batch_id = ?
            ) AND s.admission_date < (select test_date from tests_details where test_id = ?);
`,


            [batch_id, test_id, batch_id, test_id]
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







//@desc mark/update all student Test Marks
//@route POST /test/markStudentMarks
//@access Public
const markStudentMarks = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {batch_id,student_data,test_id} = req.body;
        if(!batch_id || !student_data || !test_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

         // Initialize an array to store the results for each insertion.
          const insertionResults = [];
          connection = await rdsConnection.getConnection();


        // Loop through the student_data list.
        for (const student of student_data) {
            const { student_id, marks_obtained } = student;

            // Insert attendance record for the current student.
            const [attendanceRows] = await connection.query(
                `
                INSERT INTO student_marks (student_id, batch_id, test_id, marks_obtained) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE marks_obtained = ?;`,
                [student_id, batch_id, test_id, marks_obtained, marks_obtained]
            );


            // Add the insertion result to the array.
            insertionResults.push(attendanceRows);
        }

        res.json(successEmptyDataType());
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







//@desc Gets student performance based on it's student id
//@route POST /test/studentPerformance
//@access Public
const studentPerformance = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id} = req.body;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        const student_id = id;
        connection = await rdsConnection.getConnection();

        const [batchRows] = await connection.query(
            `
            SELECT DISTINCT sm.batch_id, b.subject_name
            FROM student_marks sm
            JOIN student_batches sb ON sm.student_id = sb.student_id
            JOIN batch b ON sm.batch_id = b.batch_id
            WHERE sm.student_id = ?;
            `,
            [student_id]
           );

            const testResults = [];

            for (const batchRow of batchRows) {
                const batch_id = batchRow.batch_id;
                const subject_name = batchRow.subject_name;

                const [studentMarksRows] = await connection.query(
                    `
                    SELECT sm.*, td.test_name, td.max_marks
                    FROM student_marks sm
                    LEFT JOIN tests_details td ON sm.test_id = td.test_id
                    WHERE sm.student_id = ? AND sm.batch_id = ?;
                    `,
                    [student_id, batch_id]
                );

                const testResultsForBatch = studentMarksRows.map((row) => ({
                    id: row.id,
                    batch_id: row.batch_id,
                    student_id: row.student_id,
                    test_id: row.test_id,
                    test_name: row.test_name,
                    max_marks: row.max_marks, // Include max_marks from tests_details
                    marks_obtained: row.marks_obtained,
                    marks_percent: ((row.marks_obtained / row.max_marks) * 100).toFixed(2),
                }));

                testResults.push({
                    batch_id,
                    subject_name,
                    student_marks: testResultsForBatch,
                });
            }
            res.json(successDataType(testResults));
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








module.exports = {
    createTest,
    getTestsBasedOnBatchId,
    getTestsWithAssignedInfoBasedOnBatchId,
    studentListWithMarksObtainedDetail,
    markStudentMarks,
    studentPerformance
}