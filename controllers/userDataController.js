const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const jwt = require("jsonwebtoken");
const { successDataType, successEmptyDataType } = require("../responseFormat");



//@desc Add fcm token in 
//@route POST /user-data/addFcmToken
//@access Public
const addFcmToken = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {phone_number,fcm_token} = req.body;
        if(!phone_number || !fcm_token) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `
            INSERT INTO user_fcm_token (phone_number, fcm_token)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE fcm_token = ?;`,
            [phone_number, fcm_token, fcm_token]
          );
        res.json(successEmptyDataType());
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});



//@desc Fetch Phone number Link to student 
//@route POST /user-data/fetchPhoneNumberLinkToStudent
//@access Public
const fetchPhoneNumberLinkToStudent = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {phone_number} = req.body;
        if(!phone_number) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            ` SELECT * FROM phone_number_student_table WHERE phone_number = ?;`,
            [phone_number]);

            
            if (rows.length > 0) {
                console.log("id", rows[0]['student_id']);

            const accessToken = jwt.sign({
                user: {
                    id: rows[0]['student_id'],
                    isStudent: true,
                    isTeacher:false,
                    isAdmin: false
                },
            }, process.env.ACCESS_TOKEN_SECRET);
                rows[0]["token"] = accessToken;
            }
            
        res.json(successDataType(rows));
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});





//@desc Fetch Phone number Link to teacher 
//@route POST /user-data/fetchPhoneNumberLinkToTeacher
//@access Public
const fetchPhoneNumberLinkToTeacher = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {phone_number} = req.body;
        if(!phone_number) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            ` SELECT * FROM phone_number_teacher_table WHERE phone_number = ?;`,
            [phone_number]);

            
            if (rows.length > 0) {
                console.log("id", rows[0]['teacher_id']);

            const accessToken = jwt.sign({
                user: {
                    id: rows[0]['teacher_id'],
                    isStudent: false,
                    isTeacher:true,
                    isAdmin: false
                },
            }, process.env.ACCESS_TOKEN_SECRET);
                rows[0]["token"] = accessToken;
            }
            
        res.json(successDataType(rows));
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});




//@desc Add Phone number linking to student 
//@route POST /user-data/addPhoneNumberLinkToStudent
//@access Public
const addPhoneNumberLinkToStudent = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { phone_number, student_id} = req.body;
        if(!phone_number || !student_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            ` INSERT INTO phone_number_student_table(phone_number,student_id) values (?, ?)
            ON DUPLICATE KEY UPDATE student_id = ?;`,
            [phone_number,student_id, student_id]);

            const accessToken = jwt.sign({
                user: {
                    id: student_id,
                    isStudent: true,
                    isTeacher: false,
                    isAdmin: false
                },
            }, process.env.ACCESS_TOKEN_SECRET);

            const token = {
                "token": accessToken
            };

        res.json(successDataType(token));
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});

//@desc Add Phone number linking to teacher 
//@route POST /user-data/addPhoneNumberLinkToTeacher
//@access Public
const addPhoneNumberLinkToTeacher = asyncHandler(async (req, res) => {
    let connection;
    try {
        const { phone_number, teacher_id} = req.body;
        if(!phone_number || !teacher_id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            ` INSERT INTO phone_number_teacher_table(phone_number,teacher_id) values (?, ?)
            ON DUPLICATE KEY UPDATE teacher_id = ?;`,
            [phone_number,teacher_id, teacher_id]);

            const accessToken = jwt.sign({
                user: {
                    id: teacher_id,
                    isStudent: false,
                    isTeacher: true,
                    isAdmin: false
                },
            }, process.env.ACCESS_TOKEN_SECRET);

            const token = {
                "token": accessToken
            };

        res.json(successDataType(token));
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});



//@desc Generates Admin Auth Token
//@route POST /user-data/generateAdminAuthToken
//@access Public
const generateAdminAuthToken = asyncHandler(async (req, res) => {
    try {
        const accessToken = jwt.sign({
            user: {
                id: -9999999,
                isStudent: false,
                isTeacher: false,
                isAdmin: true
            },
        }, process.env.ACCESS_TOKEN_SECRET);

                const token = {
                    "token" : accessToken,
                    "id" : -9999999
                };
            
        res.json(successDataType(token));
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    }
});





module.exports = {
    addFcmToken,
    fetchPhoneNumberLinkToStudent,
    addPhoneNumberLinkToStudent,
    fetchPhoneNumberLinkToTeacher,
    addPhoneNumberLinkToTeacher,
    generateAdminAuthToken
};