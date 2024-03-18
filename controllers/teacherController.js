const asyncHandler = require("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { successDataType, successEmptyDataType } = require("../responseFormat");
const { deleteFileFromS3 } = require("../middleware/s3StorageUpload");



//@desc Get All Teacher List based on batch_id
//@route POST /teacher/getTeacherList
//@access Public
const getAllTeacherFromBatches = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id} = req.body;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        const batch_id = id;
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `SELECT t.*
            FROM teachers t
            JOIN teacher_batches tb ON t.teacher_id = tb.teacher_id
            WHERE tb.batch_id = ?;`,
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



//@desc Get All Teacher List 
//@route POST /teacher/getAllTeacherList
//@access Public
const getAllTeacherList = asyncHandler(async (req, res) => {
    let connection;
    try {
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `SELECT t.*, "" AS batch_ids, "" AS batch_names
            FROM teachers t;`);
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





//@desc Get individual Teacher data
//@route POST /teacher/getTeacher
//@access Public
const getTeacherData = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id} = req.body;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `
                SELECT t.teacher_id, t.teacher_name,  t.teacher_phone_number, t.admission_date,t.student_image_path, t.storage_key,
                IFNULL(GROUP_CONCAT(tb.batch_id), "[]") AS batch_ids, 
                IFNULL(GROUP_CONCAT(b.batch_name), "") AS batch_names
                FROM teachers t
                LEFT JOIN teacher_batches tb ON t.teacher_id = tb.teacher_id
                LEFT JOIN batch b ON tb.batch_id = b.batch_id
                WHERE t.teacher_id = ?;`,
                    [id]
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




//@desc add Teacher data
//@route POST /teacher/addTeacher
//@access Public
const addTeacherData = asyncHandler(async (req, res) => {
    let connection = rdsConnection;
    try {
        const { 
            teacher_name,
            teacher_phone_number,
            admission_date,
            batch_ids
        } = req.body;
        const student_image_path = req.file.location;
        const storage_key = req.file.key;
        if (!teacher_name || !teacher_phone_number || !admission_date || !batch_ids){
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        
        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();

        const [teacherRows] = await connection.query(
            `
            INSERT INTO teachers (teacher_name, teacher_phone_number, admission_date, student_image_path, storage_key)
            VALUES (?, ?, ?, ?, ?);`,
            [
                teacher_name,
                teacher_phone_number,
                admission_date,
                student_image_path,
                storage_key
            ]
        );

        const teacher_id = teacherRows.insertId;

        console.log(" /teacher/addTeacher batch_ids", batch_ids);
        let batchIdsArray = JSON.parse(batch_ids);

    if (Array.isArray(batchIdsArray)) {
        for (const batch_id of batchIdsArray) {
            await connection.query(
                `
                INSERT INTO teacher_batches (teacher_id, batch_id)
                VALUES (?, ?);`,
                [teacher_id, batch_id]
            );
        }
    } else {
        res.status(404);
        throw new Error("Error parsing batch data");
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



//@desc edit Teacher data
//@route POST /teacher/editTeacher
//@access Public
const editTeacherData = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { 
            teacher_id,
            teacher_name,
            teacher_phone_number,
            admission_date,
            batch_ids,
            student_image_path,
            storage_key
        } = req.body;
        const student_image_path2 = req.file.location;
        const storage_key2 = req.file.key;
        if (!teacher_id || !teacher_name || !teacher_phone_number || !admission_date || !batch_ids || !student_image_path || !storage_key ) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();


        const [teacherRows] = await connection.query(
            `
            UPDATE teachers SET 
                teacher_name = ?,
                teacher_phone_number = ?,
                admission_date = ?,
                student_image_path = ?,
                storage_key = ?
            WHERE teacher_id = ?;`,
            [
                teacher_name,
                teacher_phone_number,
                admission_date,
                student_image_path2,
                storage_key2,
                teacher_id
            ]
        );
        deleteFileFromS3(storage_key);



        await connection.query(
            `
            DELETE FROM teacher_batches
            WHERE teacher_id = ?;`,
            [teacher_id]
        );

        console.log(" /teacher/editTeacher batch_ids", batch_ids);

        let batchIdsArray = JSON.parse(batch_ids);

        if (Array.isArray(batchIdsArray)) {
        for (const batch_id of batch_ids) {
            await connection.query(
                `
                INSERT INTO teacher_batches (teacher_id, batch_id)
                VALUES (?, ?);`,
                [teacher_id, batch_id]
            );
            }
        } else {
            res.status(404);
            throw new Error("Error parsing batch data");
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





//@desc edit Teacher data
//@route POST /teacher/editTeacherNoImageChange
//@access Public
const editTeacherNoImageChange = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { 
            teacher_id,
            teacher_name,
            teacher_phone_number,
            admission_date,
            batch_ids,
            student_image_path,
            storage_key
        } = req.body;

        if (!teacher_id || !teacher_name || !teacher_phone_number || !admission_date || !batch_ids || !student_image_path || !storage_key ) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();


        const [teacherRows] = await connection.query(
            `
            UPDATE teachers SET 
                teacher_name = ?,
                teacher_phone_number = ?,
                admission_date = ?,
                student_image_path = ?,
                storage_key = ?
            WHERE teacher_id = ?;`,
            [
                teacher_name,
                teacher_phone_number,
                admission_date,
                student_image_path,
                storage_key,
                teacher_id
            ]
        );



        await connection.query(
            `
            DELETE FROM teacher_batches
            WHERE teacher_id = ?;`,
            [teacher_id]
        );

        console.log(" /teacher/editTeacherNoImageChange batch_ids", batch_ids);


        for (const batch_id of batch_ids) {
            await connection.query(
                `
                INSERT INTO teacher_batches (teacher_id, batch_id)
                VALUES (?, ?);`,
                [teacher_id, batch_id]
            );
        }
        // console.log("added all batches", batch_ids);

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



//@desc delete Teacher data
//@route POST /teacher/deleteTeacher
//@access Public
const deleteTeacher = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { 
            teacher_id
        } = req.body;

        if (!teacher_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        
        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();

        const [storageKeyQuery] = await connection.query(
            `SELECT storage_key FROM teachers WHERE teacher_id = ?;`,
            [teacher_id]
        );

        if (storageKeyQuery[0].storage_key) {
            storageKey = storageKeyQuery[0].storage_key;
            deleteFileFromS3(storageKey);
        }

        
        await connection.query(
            `DELETE FROM phone_number_teacher_table
            WHERE teacher_id = ?;`,[teacher_id]);
                

        await connection.query(
            `DELETE FROM teacher_batches
            WHERE teacher_id = ?;`,[teacher_id]);


        await connection.query(
            `DELETE FROM teachers
            WHERE teacher_id = ?;`,[teacher_id]);
           

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




module.exports = {
    getAllTeacherFromBatches,
    getAllTeacherList,
    getTeacherData,
    addTeacherData,
    editTeacherData,
    editTeacherNoImageChange,
    deleteTeacher
}