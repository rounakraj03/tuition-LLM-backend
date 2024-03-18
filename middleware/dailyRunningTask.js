const rdsConnection = require("../config/dbConnections");
const asyncHandler = require("express-async-handler");
const { successDataType, successEmptyDataType } = require("../responseFormat");
const { getMessaging } = require("firebase-admin/messaging");
const { FirebaseMessagingError } = require('firebase-admin/messaging');




//@desc Notify parents, teachers, admin when student fees are 2 days left from payment.
//@access Private
const dailyFeesNotifierFunction = asyncHandler(async (req, res) => {
    let connection;
    try {
        connection = await rdsConnection.getConnection();

        const [rows] = await connection.query(
            `
            SELECT
                s.student_id,
                s.student_name,
                s.admission_date,
                pns.phone_number,
                uft.fcm_token
            FROM
                students s
            LEFT JOIN
                student_fees_notifier_table sfnt ON s.student_id = sfnt.student_id
            LEFT JOIN
                phone_number_student_table pns ON s.student_id = pns.student_id
            LEFT JOIN
                user_fcm_token uft ON pns.phone_number = uft.phone_number
            WHERE
                DAYOFMONTH(s.admission_date) IN ((DAYOFMONTH(CURDATE()) + 2), (DAYOFMONTH(CURDATE()) + 1 ))
                AND (sfnt.monthly_alert = true OR sfnt.student_id IS NULL);
                `,
        );


        // const studentIdList = [];
        const studentIdSet = new Set();
        const message = `Dear Parents, please submit your ward fees`;


        for( const row of rows) {
            
            if(row['student_id']) {
                // studentIdList.push(row['student_id']);
                studentIdSet.add(row['student_id']);
            }

            if(row['fcm_token'] && row['student_id']) {
                // studentIdList.push(row['student_id']);


                const pushMessage = {
                    notification: {
                    title: message,
                    //   body: message
                    },
                    token: row['fcm_token'],
                };

                await getMessaging()
                .send(pushMessage)
                .then((response) => {
                    console.log(`response token => ${response}`);
                })
                .catch((err) => {
                console.log(`token error ${err}`);
            });
            
                
            }
        }

        const studentIdList = Array.from(studentIdSet);
        if(studentIdList.length > 0) {
            const [noticeRows] = await connection.query(
                `
                INSERT INTO notice_table (message, notice_date, student_ids )
                VALUES (?, ?, ?);`,
                [
                    message,
                    new Date(),
                    studentIdList.join(','),
                ]
            );
        }

        let date_ob = new Date();
        // current hours
        let hours = date_ob.getHours();
    
        // current minutes
        let minutes = date_ob.getMinutes();
    
        // current seconds
        let seconds = date_ob.getSeconds();

        console.log(`done sending daily request for fees // time  ->  ${hours} - ${minutes} - ${seconds} `);

    } catch (error) {
        console.log("error =>",error);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});


//@desc Notify parents, teachers, admin when student is absent from two continuous days.
//@access Private
const dailyAttendanceNotifierFunction = asyncHandler(async (req, res) => {
    let connection;
    try {
        connection = await rdsConnection.getConnection();

        const [rows] = await connection.query(
            `
            SELECT
                a.student_id,
                pns.phone_number,
                uft.fcm_token
            FROM
                (
                    SELECT DISTINCT
                        a.student_id
                    FROM
                        attendance a
                    WHERE
                        a.is_present = false
                        AND NOT EXISTS (
                            SELECT 1
                            FROM attendance a2
                            WHERE a2.student_id = a.student_id
                            AND a2.is_present = true
                            AND a2.attendance_date > (
                                SELECT MAX(attendance_date)
                                FROM attendance
                                WHERE student_id = a.student_id
                            )
                        )
                        AND a.attendance_date = (
                            SELECT MAX(attendance_date)
                            FROM attendance
                            WHERE student_id = a.student_id
                        )
                        AND a.attendance_date >= CURDATE() - INTERVAL 1 DAY
                ) a
            LEFT JOIN
                phone_number_student_table pns ON a.student_id = pns.student_id
            LEFT JOIN
                user_fcm_token uft ON pns.phone_number = uft.phone_number;
                `,
        );

        const studentIdSet = new Set();
        const message = `Dear Parents, your ward is been absent from two or more continious days. Please kindly contact the teacher.`;


        for( const row of rows) {
            if(row['student_id']) {
                studentIdSet.add(row['student_id']);
            }

            if(row['fcm_token']) {

                const pushMessage = {
                    notification: {
                    title: message,
                    //   body: message
                    },
                    token: row['fcm_token'],
                };

                        await getMessaging()
                        .send(pushMessage)
                        .then((response) => {
                            console.log(`response token => ${response}`);
                        })
                        .catch((err) => {
                        console.log(`token error ${err}`);
                    });
                
            }
        }

        const studentIdList = Array.from(studentIdSet);
        if(studentIdList.length > 0) {
            const [noticeRows] = await connection.query(
                `
                INSERT INTO notice_table (message, notice_date, student_ids )
                VALUES (?, ?, ?);`,
                [
                    message,
                    new Date(),
                    studentIdList.join(','),
                ]
            );
        }

        
        let date_ob = new Date();
        // current hours
        let hours = date_ob.getHours();
    
        // current minutes
        let minutes = date_ob.getMinutes();
    
        // current seconds
        let seconds = date_ob.getSeconds();

        console.log(`done sending daily request for attendance // time  ->  ${hours} - ${minutes} - ${seconds} `);
   
    } catch (error) {
        console.log("error =>",error);
        // throw new Error(`${error}`);
    } finally {
        if (connection) {
            connection.release(); // Always release the connection in the end
        }
        console.log("connection released");
    }
});



// Notify parents, teachers, admin when student is absent from two continuous days.
const myScheduledFunction = async (req, res) => {
    dailyFeesNotifierFunction();
    dailyAttendanceNotifierFunction();
};

module.exports = {
    myScheduledFunction
};
