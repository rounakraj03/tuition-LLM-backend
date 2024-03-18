const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const { successDataType, successEmptyDataType } = require("../responseFormat");


//@desc Get All Batches List
//@route POST /batch/getAllBatches
//@access Public
const getAllBatches = asyncHandler(async (req, res) => {
    let connection;
    try {
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(`
            SELECT b.*,COALESCE(batch_count, 0) AS batch_count 
            FROM batch b 
            LEFT JOIN (
                SELECT batch_id, COUNT(student_id) AS batch_count 
                FROM student_batches 
                GROUP BY batch_id 
            ) sb ON b.batch_id = sb.batch_id;`);
        res.json(successDataType(rows));
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




//@desc Get All Batches List With Student Count in it
//@route POST /batch/showBatch
//@access Public
const getAllBatchesWithCount = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id, isStudent, isTeacher, isAdmin} = req.user;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }


        let query;
        let queryParams;
        
        if (isStudent) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        if (isAdmin == true) {
            query =  `SELECT b.*,COALESCE(batch_count, 0) AS batch_count 
            FROM batch b 
            LEFT JOIN (
                SELECT batch_id, COUNT(student_id) AS batch_count 
                FROM student_batches 
                GROUP BY batch_id 
                ) sb ON b.batch_id = sb.batch_id;` ;

            queryParams = [];
        }

        if (isTeacher == true) {
            query =  `SELECT b.*, COALESCE(batch_count, 0) AS batch_count 
            FROM batch b 
            LEFT JOIN (
                SELECT batch_id, COUNT(student_id) AS batch_count 
                FROM student_batches 
                GROUP BY batch_id 
            ) sb ON b.batch_id = sb.batch_id
            JOIN teacher_batches tb ON b.batch_id = tb.batch_id
            WHERE tb.teacher_id = ?;`; ;

            queryParams = [id];
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(query, queryParams);
        res.json(successDataType(rows));
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





//@desc Delete batch from Batch Table
//@route POST /batch/deleteBatch
//@access Public
const deleteBatch = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { 
            id
        } = req.body;

        if (!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        
        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();

        await connection.query(
            `DELETE FROM homework
            WHERE batch_id = ?;`,[id]);
        
        
        await connection.query(
            `DELETE FROM student_marks
            WHERE batch_id = ?;`,[id]);
                
                
        await connection.query(
            `DELETE FROM attendance
            WHERE batch_id = ?;`,[id]);



        await connection.query(
            `DELETE FROM tests_details
            WHERE batch_id = ?;`,[id]);



        await connection.query(
            `DELETE FROM student_batches
            WHERE batch_id = ?;`,[id]);


        await connection.query(
            `DELETE FROM batch
            WHERE batch_id = ?;`,[id]);
           

        await connection.commit(); // If everything is successful, commit the transaction

        res.json(successEmptyDataType());
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback the transaction in case of an error
        }
        res.status(400);
        throw new Error(`Error: ${error}`);
    }  finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});





//@desc create new batch in Batch Table
//@route POST /batch/addBatch
//@access Public
const addBatch = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {
            batch_name,
            subject_name,
            start_date,
            fees,
            batch_start_timing,
            batch_end_timing,
            is_monday,
            is_tuesday,
            is_wednesday,
            is_thursday,
            is_friday,
            is_saturday,
            is_sunday
        } = req.body;

        if(
            !batch_name || 
            !subject_name || 
            !start_date || 
            !fees || 
            !batch_start_timing || 
            !batch_end_timing) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

       
        connection = await rdsConnection.getConnection();

        const [rows] = await connection.query(
            `INSERT INTO batch (batch_name, subject_name, start_date, fees, batch_start_timing, batch_end_timing, is_monday, is_tuesday, is_wednesday, is_thursday, is_friday, is_saturday, is_sunday)
            VALUES ( ?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    batch_name,
                    subject_name,
                    start_date,
                    fees,
                    batch_start_timing,
                    batch_end_timing,
                    is_monday,
                    is_tuesday,
                    is_wednesday,
                    is_thursday,
                    is_friday,
                    is_saturday,
                    is_sunday,
                ]
            );
        res.json(successEmptyDataType());
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    }  finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});





//@desc update existing batch in Batch Table
//@route POST /batch/updateBatch
//@access Public
const updateBatch = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {
            batch_id,
            batch_name,
            subject_name,
            start_date,
            fees,
            batch_start_timing,
            batch_end_timing,
            is_monday,
            is_tuesday,
            is_wednesday,
            is_thursday,
            is_friday,
            is_saturday,
            is_sunday
        } = req.body;

        if(
            !batch_id ||
            !batch_name || 
            !subject_name || 
            !start_date || 
            !fees || 
            !batch_start_timing || 
            !batch_end_timing) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `UPDATE batch
            SET  batch_name = ?, subject_name = ?,start_date = ?, fees = ?, batch_start_timing = ?, batch_end_timing = ?, 
            is_monday = ?, is_tuesday = ?,is_wednesday = ?, is_thursday = ?,is_friday = ?, is_saturday = ?,is_sunday = ?
            WHERE batch_id = ?;
            `,
                [
                    batch_name,
                    subject_name,
                    start_date,
                    fees,
                    batch_start_timing,
                    batch_end_timing,
                    is_monday,
                    is_tuesday,
                    is_wednesday,
                    is_thursday,
                    is_friday,
                    is_saturday,
                    is_sunday,
                    batch_id,
                ]
            );
        res.json(successEmptyDataType());
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    }  finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});








module.exports = {
    getAllBatches,
    getAllBatchesWithCount,
    deleteBatch,
    addBatch,
    updateBatch
};