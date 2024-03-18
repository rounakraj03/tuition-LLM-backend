const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const { successDataType, successEmptyDataType } = require("../responseFormat");




//@desc Creates a homework
//@route POST /homework/createHomework
//@access Public
const createHomework = asyncHandler(async (req, res) => {
    let connection;
    try {

        const {
            batch_id,
            homework_date,
            homework_title,
            homework_description,
            issue_date,
            submission_date
        } = req.body;

        if(!batch_id || !homework_date || !homework_title || !homework_description || !issue_date || !submission_date) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `
            INSERT INTO homework (batch_id, homework_date, homework_title, homework_description, issue_date, submission_date)
            VALUES (?, ?, ?, ?,?,?);`,
            [batch_id, homework_date, homework_title, homework_description, issue_date, submission_date]
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




//@desc Gets homework by batch id
//@route GET /homework/getHomeworkByBatch
//@access Public
const getHomeworkByBatch = asyncHandler(async (req, res) => {
    let connection;
    try {

        const {
            batch_id,
        } = req.body;

        if(!batch_id ) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `SELECT * FROM homework WHERE batch_id = ? ORDER BY homework_id DESC;`,
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





module.exports = {
    createHomework,
    getHomeworkByBatch
}