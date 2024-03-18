const asyncHandler = require("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { successDataType, successEmptyDataType } = require("../responseFormat");
const { studentProfilePictureUpload, deleteFileFromS3 } = require("../middleware/s3StorageUpload");


//@desc Get All Student List based on batch_id
//@route POST /student/getStudentList
//@access Public
const getAllStudentFromBatches = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id} = req.body;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        connection = await rdsConnection.getConnection();
        const batch_id = id;
        const [rows] = await connection.query(
            `SELECT s.*
            FROM students s
            JOIN student_batches sb ON s.student_id = sb.student_id
            WHERE sb.batch_id = ?;`,
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


//@desc Get All Student List 
//@route POST /student/getAllStudentList
//@access Public
const getAllStudentList = asyncHandler(async (req, res) => {
    let connection;
    try {
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `SELECT s.*, "" AS batch_ids, "" AS batch_names
            FROM students s;`);
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





//@desc Get individual Student data
//@route POST /student/getStudent
//@access Public
const getStudentData = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id} = req.body;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        const student_id = id;
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `
            SELECT
                s.student_id,
                s.student_name,
                s.father_name,
                s.mother_name,
                s.student_phone_number,
                s.parent_phone_number,
                s.admission_date,
                s.student_image_path,
                s.storage_key,
                IFNULL(GROUP_CONCAT(sb.batch_id), "[]") AS batch_ids,
                IFNULL(GROUP_CONCAT(b.batch_name), "") AS batch_names,
                IFNULL(sfnt.monthly_alert, false) AS monthly_alert
            FROM
                students s
            LEFT JOIN
                student_batches sb ON s.student_id = sb.student_id
            LEFT JOIN
                batch b ON sb.batch_id = b.batch_id
            LEFT JOIN 
                student_fees_notifier_table sfnt ON sfnt.student_id = s.student_id
            WHERE
                s.student_id = ?;`,
            [student_id]
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




//@desc add Student data
//@route POST /student/addStudent
//@access Public
const addStudentData = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { 
            student_name,
            father_name,
            mother_name,
            student_phone_number,
            parent_phone_number,
            admission_date,
            batch_ids
        } = req.body;
        console.log("req.file",req.file);
        const student_image_path = req.file.location;
        const storage_key = req.file.key;
        if (!student_name || !father_name||!mother_name||!student_phone_number||!parent_phone_number || !admission_date || !batch_ids){
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();
        

        const [studentRows] = await connection.query(
            `
            INSERT INTO students (student_name, father_name, mother_name, student_phone_number, parent_phone_number, admission_date, student_image_path, storage_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
                student_name,
                father_name,
                mother_name,
                student_phone_number,
                parent_phone_number,
                admission_date,
                student_image_path,
                storage_key
            ]
        );

        const student_id = studentRows.insertId;

        const [notifierRow] = await connection.query(
            `
            INSERT INTO student_fees_notifier_table (student_id)
            VALUES (?);`,
            [
                student_id
            ]
        );

        console.log(" /student/addStudent batch_ids", batch_ids);
        let batchIdsArray = JSON.parse(batch_ids);

        if (Array.isArray(batchIdsArray)) {
            for (const batch_id of batchIdsArray) {
                await connection.query(
                    `
                    INSERT INTO student_batches (student_id, batch_id)
                    VALUES (?, ?);`,
                    [student_id, batch_id]
                );
            }
        }else{
            res.status(404);
            throw new Error("Error parsing batch data");
        }
        

        await connection.commit(); // If everything is successful, commit the transaction

        res.json(successEmptyDataType());
    }  catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release(); // Release the connection back to the pool
        }
        res.status(400);
        throw new Error(`Error: ${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});






//@desc edit Student data
//@route POST /student/editStudent
//@access Public
const editStudentData = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { 
            student_id,
            student_name,
            father_name,
            mother_name,
            student_phone_number,
            parent_phone_number,
            admission_date,
            batch_ids,
            student_image_path,
            storage_key
        } = req.body;
        const student_image_path2 = req.file.location;
        const storage_key2 = req.file.key;
        if (!student_id || !student_name || !father_name|| !mother_name||!student_phone_number||!parent_phone_number ||!admission_date || !batch_ids || !student_image_path || !storage_key ) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();


        const [studentRows] = await connection.query(
            `
            UPDATE students SET 
                student_name = ?,
                father_name = ?,
                mother_name = ?,
                student_phone_number = ?,
                parent_phone_number = ?,
                admission_date = ?,
                student_image_path = ?,
                storage_key = ?
            WHERE student_id = ?;`,
            [
                student_name,
                father_name,
                mother_name,
                student_phone_number,
                parent_phone_number,
                admission_date,
                student_image_path2,
                storage_key2,
                student_id
            ]
        );



        await connection.query(
            `
            DELETE FROM student_batches
            WHERE student_id = ?;`,
            [student_id]
        );

        console.log(" /student/editStudent batch_ids", batch_ids);
        
        let batchIdsArray = JSON.parse(batch_ids);

        if (Array.isArray(batchIdsArray)) {
            for (const batch_id of batchIdsArray) {
                await connection.query(
                    `
                    INSERT INTO student_batches (student_id, batch_id)
                    VALUES (?, ?);`,
                    [student_id, batch_id]
                );
            }
        } else {
            res.status(404);
            throw new Error("Error parsing batch data");
        }

        deleteFileFromS3(storage_key);

        await connection.commit(); // If everything is successful, commit the transaction

        res.json(successEmptyDataType());
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback the transaction in case of an error
        }
        res.status(400);
        throw new Error(`Error: ${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});




//@desc edit Student data
//@route POST /student/editStudentNoImageChange
//@access Public
const editStudentNoImageChange = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { 
            student_id,
            student_name,
            father_name,
            mother_name,
            student_phone_number,
            parent_phone_number,
            admission_date,
            batch_ids,
            student_image_path,
            storage_key
        } = req.body;

        if (!student_id || !student_name || !father_name|| !mother_name||!student_phone_number||!parent_phone_number ||!admission_date || !batch_ids || !student_image_path || !storage_key ) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        
        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();


        const [studentRows] = await connection.query(
            `
            UPDATE students SET 
                student_name = ?,
                father_name = ?,
                mother_name = ?,
                student_phone_number = ?,
                parent_phone_number = ?,
                admission_date = ?,
                student_image_path = ?,
                storage_key = ?
            WHERE student_id = ?;`,
            [
                student_name,
                father_name,
                mother_name,
                student_phone_number,
                parent_phone_number,
                admission_date,
                student_image_path,
                storage_key,
                student_id
            ]
        );



        await connection.query(
            `
            DELETE FROM student_batches
            WHERE student_id = ?;`,
            [student_id]
        );

        console.log(" /student/editStudentNoImageChange batch_ids", batch_ids);


        for (const batch_id of batch_ids) {
            await connection.query(
                `
                INSERT INTO student_batches (student_id, batch_id)
                VALUES (?, ?);`,
                [student_id, batch_id]
            );
        }

        await connection.commit(); // If everything is successful, commit the transaction

        res.json(successEmptyDataType());
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback the transaction in case of an error
        }
        res.status(400);
        throw new Error(`Error: ${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});


//@desc delete Student data
//@route POST /student/deleteStudent
//@access Public
const deleteStudent = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { 
            student_id
        } = req.body;

        if (!student_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        
        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();

        const [storageKeyQuery] = await connection.query(
            `SELECT storage_key FROM students WHERE student_id = ?;`,
            [student_id]
        );

        if (storageKeyQuery[0].storage_key) {
            storageKey = storageKeyQuery[0].storage_key;
            deleteFileFromS3(storageKey);
        }


        await connection.query(
            `DELETE FROM attendance
            WHERE student_id = ?;`,[student_id]);
        
        
        await connection.query(
            `DELETE FROM phone_number_student_table
            WHERE student_id = ?;`,[student_id]);
                
                
        await connection.query(
            `DELETE FROM student_marks
            WHERE student_id = ?;`,[student_id]);

                
        await connection.query(
            `DELETE FROM student_fees_notifier_table
            WHERE student_id = ?;`,[student_id]);


        await connection.query(
            `DELETE FROM student_batches
            WHERE student_id = ?;`,[student_id]);



        await connection.query(
            `DELETE FROM students
            WHERE student_id = ?;`,[student_id]);
           

        await connection.commit(); // If everything is successful, commit the transaction

        res.json(successEmptyDataType());
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback the transaction in case of an error
        }
        res.status(400);
        throw new Error(`Error: ${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});





//@desc Update Student fees notifier data
//@route POST /student/updateStudentMonthlyFeesNotifier
//@access Public
const updateStudentMonthlyFeesNotifier = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id, isStudent, isTeacher, isAdmin} = req.user;
        const {value, student_id} = req.body;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }


        let query;
        let queryParams;
        
        if (isStudent) {
            res.status(400);
            throw new Error("Student Can't Access This Feature");
        }

        if (isAdmin == true) {
            query =  `INSERT INTO student_fees_notifier_table (student_id, monthly_alert)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE monthly_alert = VALUES(monthly_alert);` ;
            
            queryParams = [ student_id, value];
        }

        if (isTeacher == true) {
            query =  `INSERT INTO student_fees_notifier_table (student_id, monthly_alert)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE monthly_alert = VALUES(monthly_alert);` ;
            
            queryParams = [ student_id, value];
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(query, queryParams);
        res.json(successEmptyDataType());
    } catch (error) {
        res.status(400);
        throw new Error(`An error occurred while fetching data ${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});







module.exports = {
    getAllStudentFromBatches,
    getAllStudentList,
    getStudentData,
    addStudentData,
    editStudentData,
    editStudentNoImageChange,
    deleteStudent,
    updateStudentMonthlyFeesNotifier
}