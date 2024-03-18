const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const { successDataType, successEmptyDataType } = require("../responseFormat");
const { getMessaging } = require("firebase-admin/messaging");




//@desc Gives a map of batch and Student List
//@route POST /notice/getBatchStudentMap
//@access Public
const getBatchStudentMap = asyncHandler(async (req, res) => {
    let connection;
    try {

        // Query to fetch students for each batch
        const query = `
        SELECT
            b.batch_id,
            s.*
        FROM
            batch AS b
        JOIN
            student_batches AS sb ON b.batch_id = sb.batch_id
        JOIN
            students AS s ON sb.student_id = s.student_id
        ORDER BY
            b.batch_id, s.student_id;
        `;

        // Create an object to store the result in the desired format
        const result = {};
        connection = await rdsConnection.getConnection();


        // Execute the query
        const [rows] = await connection.query(query);
            rows.forEach((row) => {
            const batchId = row.batch_id;
            if (!result[batchId]) {
                result[batchId] = [];
            }
            delete row.batch_id; // Remove batch_id from the student data
            result[batchId].push(row);
            });

            // Print or return the result in JSON format
            // console.log(JSON.stringify(result, null, 2));
      
        res.json(successDataType(JSON.stringify(result)));
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



//@desc Stores in notice _table and send register student phone number through push message
//@route POST /notice/sendNotice
//@access Public
const sendNotice = asyncHandler(async (req, res) => {
    let connection = rdsConnection;
    try {

        //body
        const {
            message,
            notice_date,
            student_ids
        } = req.body;


        if (!message || !notice_date || !student_ids){
            res.status(400);
            throw new Error("All fields are mandatory");
        }
        
        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();

        const [Rows] = await connection.query(
            `
            INSERT INTO notice_table (message, notice_date, student_ids )
            VALUES (?, ?, ?);`,
            [
                message,
                notice_date,
                // student_ids,
                student_ids.replace(/\s/g, ''),
            ]
        );
        
        await connection.commit(); // If everything is successful, commit the transaction

        const studentIdList = student_ids.toString().split(",");
        const studentFcmList = [];
        for(let student of studentIdList) {
            const [result] = await connection.query(
                `
                SELECT 
                p.phone_number, p.student_id, f.fcm_token
                FROM 
                phone_number_student_table p 
                JOIN  user_fcm_token f
                ON p.phone_number = f.phone_number
                AND p.student_id = ?;`,
                [student]
            );
            if(result.length >0){
            studentFcmList.push(result);
            }
            //here for each student id find student phone number link and find phone number fcm token link to it. 
        }
        // Extract fcm_token values into a new array
            const fcmTokens = [];
            studentFcmList.forEach((innerArray) => {
                innerArray.forEach(async (tokenObj) => {
                    fcmTokens.push(tokenObj.fcm_token);

                    const pushMessage = {
                        notification: {
                          title: message,
                        //   body: message
                        },
                        token: tokenObj.fcm_token,
                      };
                      
                    //   getMessaging()
                    //     .send(pushMessage)
                    //     .then((response) => {
                    //     //   console.log(`Successfully sent message: ${response}  , fcmToken = ${tokenObj.fcm_token}`);
                    //     })

                    await getMessaging()
                    .send(pushMessage)
                    .then((response) => {
                        console.log(`response token => ${response}`);
                    })
                    .catch((err) => {
                        console.log(`token error ${err}`);
                    });
                });
            });
            
            console.log("Successfully send all messages");
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
    getBatchStudentMap,
    sendNotice
}