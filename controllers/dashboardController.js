const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const { successDataType, successEmptyDataType } = require("../responseFormat");



//@desc Get custom dashboard data for teacher and student
//@route POST /dashboard/getDashboardDataOnStudentId
//@access Public
const getDashboardDataOnStudentId = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id, isStudent, isTeacher, isAdmin} = req.user;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        console.log(`id => ${id}, isStudent => ${isStudent}, isTeacher => ${isTeacher}, isAdmin => ${isAdmin}`);

        let query;
        let queryParams;

        if(isStudent == true) {
            query =   `    SELECT 
            'Classes' AS event_type,
            b.start_date AS event_date,
            b.batch_name AS event_batch_name,
            'Class' AS event_name,
            CONCAT(
                TIME_FORMAT(b.batch_start_timing, '%h:%i %p'), 
                " - ", 
                TIME_FORMAT(b.batch_end_timing, '%h:%i %p')
            ) AS event_description
        FROM students s
        INNER JOIN student_batches sb ON s.student_id = sb.student_id
        INNER JOIN batch b ON sb.batch_id = b.batch_id
        WHERE
            s.student_id = ?
           AND b.start_date <= CURDATE()
            AND (
                (DAYOFWEEK(CURDATE()) = 2 AND b.is_monday)
                OR (DAYOFWEEK(CURDATE()) = 3 AND b.is_tuesday)
                OR (DAYOFWEEK(CURDATE()) = 4 AND b.is_wednesday)
                OR (DAYOFWEEK(CURDATE()) = 5 AND b.is_thursday)
                OR (DAYOFWEEK(CURDATE()) = 6 AND b.is_friday)
                OR (DAYOFWEEK(CURDATE()) = 7 AND b.is_saturday)
                OR (DAYOFWEEK(CURDATE()) = 1 AND b.is_sunday)
            )
            UNION  
            SELECT 
                        'Notice' AS event_type,
                        nd.notice_date AS event_date,
                        "" AS event_batch_name,
                        nd.message AS event_name,
                        "" AS event_description
                    FROM notice_table nd
                     WHERE CONCAT(',', student_ids, ',') LIKE CONCAT('%', ?, '%')
                        AND nd.notice_date >= CURDATE()
                    UNION
                SELECT 
                        'Test' AS event_type,
                        td.test_date AS event_date,
                        b.batch_name AS event_batch_name,
                        td.test_name AS event_name,
                        td.test_description AS event_description
                    FROM student_batches sb
                    JOIN tests_details td ON sb.batch_id = td.batch_id
                    JOIN batch b ON sb.batch_id = b.batch_id
                    WHERE sb.student_id = ?
                        AND td.test_date >= CURDATE()
                    UNION
                    SELECT 
                        'Homework' AS event_type,
                        h.submission_date AS event_date,
                        b.batch_name AS event_batch_name,
                        h.homework_title AS event_name,
                        h.homework_description AS event_description
                    FROM student_batches sb
                    JOIN batch b ON sb.batch_id = b.batch_id
                    JOIN homework h ON b.batch_id = h.batch_id
                    WHERE sb.student_id = ?
                        AND h.submission_date >= CURDATE()
                    ORDER BY event_date;`

        queryParams = [id, id, id, id];
        }


        if(isTeacher == true) {
            query =   `    SELECT 
            'Classes' AS event_type,
            b.start_date AS event_date,
            b.batch_name AS event_batch_name,
            'Class' AS event_name,
            CONCAT(
                TIME_FORMAT(b.batch_start_timing, '%h:%i %p'), 
                " - ", 
                TIME_FORMAT(b.batch_end_timing, '%h:%i %p')
            ) AS event_description
        FROM teachers t
        INNER JOIN teacher_batches tb ON t.teacher_id = tb.teacher_id
        INNER JOIN batch b ON tb.batch_id = b.batch_id
        WHERE
            t.teacher_id = ?
           AND b.start_date <= CURDATE()
            AND (
                (DAYOFWEEK(CURDATE()) = 2 AND b.is_monday)
                OR (DAYOFWEEK(CURDATE()) = 3 AND b.is_tuesday)
                OR (DAYOFWEEK(CURDATE()) = 4 AND b.is_wednesday)
                OR (DAYOFWEEK(CURDATE()) = 5 AND b.is_thursday)
                OR (DAYOFWEEK(CURDATE()) = 6 AND b.is_friday)
                OR (DAYOFWEEK(CURDATE()) = 7 AND b.is_saturday)
                OR (DAYOFWEEK(CURDATE()) = 1 AND b.is_sunday)
            )
            UNION  
                    SELECT 
                        'Notice' AS event_type,
                        nd.notice_date AS event_date,
                        "" AS event_batch_name,
                        nd.message AS event_name,
                        GROUP_CONCAT(CONCAT(s.student_name, '-', s.student_id) SEPARATOR ', ') AS event_description
                    FROM 
                        notice_table nd
                    JOIN 
                        students s ON FIND_IN_SET(s.student_id, nd.student_ids) > 0
                    JOIN
                        student_batches sb ON sb.student_id = s.student_id
                    JOIN
                        teacher_batches tb ON tb.batch_id = sb.batch_id
                    WHERE 
                        tb.teacher_id = ?
                        AND nd.notice_date >= CURDATE()
                    GROUP BY 
                        nd.id, nd.notice_date, nd.message
                    
            UNION
                    SELECT 
                        'Test' AS event_type,
                        td.test_date AS event_date,
                        b.batch_name AS event_batch_name,
                        td.test_name AS event_name,
                        td.test_description AS event_description
                    FROM 
                        teacher_batches tb
                    JOIN 
                        tests_details td ON tb.batch_id = td.batch_id
                    JOIN 
                        batch b ON tb.batch_id = b.batch_id
                    WHERE 
                        tb.teacher_id = ?
                    AND 
                        td.test_date >= CURDATE()
            UNION
                    SELECT 
                        'Homework' AS event_type,
                        h.submission_date AS event_date,
                        b.batch_name AS event_batch_name,
                        h.homework_title AS event_name,
                        h.homework_description AS event_description
                    FROM teacher_batches tb
                    JOIN batch b ON tb.batch_id = b.batch_id
                    JOIN homework h ON b.batch_id = h.batch_id
                    WHERE tb.teacher_id = ?
                        AND h.submission_date >= CURDATE()
                    ORDER BY event_date;`

        queryParams = [id, id, id, id];
        }


        if(isAdmin == true) {
            query = `SELECT 
            'Classes' AS event_type,
            b.start_date AS event_date,
            b.batch_name AS event_batch_name,
            'Class' AS event_name,
            CONCAT(
                TIME_FORMAT(b.batch_start_timing, '%h:%i %p'), 
                " - ", 
                TIME_FORMAT(b.batch_end_timing, '%h:%i %p')
            ) AS event_description
        FROM batch b
        WHERE
            b.start_date <= CURDATE()
            AND (
                (DAYOFWEEK(CURDATE()) = 2 AND b.is_monday)
                OR (DAYOFWEEK(CURDATE()) = 3 AND b.is_tuesday)
                OR (DAYOFWEEK(CURDATE()) = 4 AND b.is_wednesday)
                OR (DAYOFWEEK(CURDATE()) = 5 AND b.is_thursday)
                OR (DAYOFWEEK(CURDATE()) = 6 AND b.is_friday)
                OR (DAYOFWEEK(CURDATE()) = 7 AND b.is_saturday)
                OR (DAYOFWEEK(CURDATE()) = 1 AND b.is_sunday)
            )
        UNION  
        SELECT 
            'Notice' AS event_type,
            nd.notice_date AS event_date,
            "" AS event_batch_name,
            nd.message AS event_name,
            GROUP_CONCAT(CONCAT(s.student_name, '-', s.student_id) SEPARATOR ', ') AS event_description
        FROM 
            notice_table nd
        JOIN 
            students s ON FIND_IN_SET(s.student_id, nd.student_ids) > 0
        WHERE 
            nd.notice_date >= CURDATE()
        GROUP BY 
            nd.id, nd.notice_date, nd.message
        
        UNION
        SELECT 
            'Test' AS event_type,
            td.test_date AS event_date,
            b.batch_name AS event_batch_name,
            td.test_name AS event_name,
            td.test_description AS event_description
        FROM tests_details td
        JOIN batch b ON td.batch_id = b.batch_id
        WHERE td.test_date >= CURDATE()
        UNION
        SELECT 
            'Homework' AS event_type,
            h.submission_date AS event_date,
            b.batch_name AS event_batch_name,
            h.homework_title AS event_name,
            h.homework_description AS event_description
        FROM homework h
        JOIN batch b ON h.batch_id = b.batch_id
        WHERE h.submission_date >= CURDATE()
        ORDER BY event_date;
        `,
        queryParams = [];
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(query, queryParams);

            const combinedData = {};
            rows.forEach((event) => {
                if(event['event_type'] === "Classes") {
                    const date = event.event_date;
                    const currentDate = new Date();
                    const isoFormattedDate = currentDate.toISOString();
                    if (!combinedData[date]) {
                      combinedData[date] = {
                        event_type: "Classes",
                        event_date: isoFormattedDate,
                        event_batch_name: [],
                        event_name: [],
                        event_description: [],
                      };
                    }
                    combinedData[date].event_batch_name.push(event.event_batch_name);
                    combinedData[date].event_name.push(event.event_batch_name);
                    combinedData[date].event_description.push(event.event_description);
                  }
                });
                
                const combinedResult = Object.values(combinedData);
                
                // Convert the lists in the dictionary to newline-separated strings
                combinedResult.forEach(entry => {
                  entry.event_batch_name = entry.event_batch_name.join(",");
                  entry.event_name = entry.event_name.join(",");
                  entry.event_description = entry.event_description.join(",");
                });


                const newRow = rows.filter((event) => event['event_type'] != 'Classes');
                // newRow.unshift(combinedResult[0]);
                if (combinedResult.length > 0) {
                    newRow.unshift(combinedResult[0]);
                  }
                

        res.json(successDataType(newRow));
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




//@desc Get  dashboard data of all notice for each student
//@route POST /dashboard/getNotice
//@access Public
const getNotice = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id, isStudent, isTeacher, isAdmin} = req.user;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        console.log(`id => ${id}, isStudent => ${isStudent}, isTeacher => ${isTeacher}, isAdmin => ${isAdmin}`);

        let query;
        let queryParams;

        if (isStudent == true) {
            query = ` 
            SELECT 
                'Notice' AS event_type,
                nd.notice_date AS event_date,
                "" AS event_batch_name,
                nd.message AS event_name,
                "" AS event_description
            FROM 
                notice_table nd
            WHERE 
                CONCAT(',', student_ids, ',') LIKE '%,?,%'
            ORDER BY 
                nd.id desc;`;
            queryParams = [id]
        }

        if (isTeacher == true) {
            query = `
                SELECT 
                    'Notice' AS event_type,
                    nd.notice_date AS event_date,
                    "" AS event_batch_name,
                    nd.message AS event_name,
                    GROUP_CONCAT(CONCAT(s.student_name, '-', s.student_id) SEPARATOR ', ') AS event_description
                FROM 
                    notice_table nd
                JOIN 
                    students s ON FIND_IN_SET(s.student_id, nd.student_ids) > 0
                JOIN
                    student_batches sb ON sb.student_id = s.student_id
                JOIN
                    teacher_batches tb ON tb.batch_id = sb.batch_id
                WHERE 
                    tb.teacher_id = ?
                GROUP BY 
                    nd.id, nd.notice_date, nd.message
                ORDER BY 
                    nd.id DESC;`;
            queryParams = [id]
        }

        if (isAdmin == true) {
            query = ` 
            SELECT 
                'Notice' AS event_type,
                nd.notice_date AS event_date,
                "" AS event_batch_name,
                nd.message AS event_name,
                GROUP_CONCAT(CONCAT(s.student_name, '-', s.student_id) SEPARATOR ', ') AS event_description
            FROM 
                notice_table nd
            JOIN 
                students s ON FIND_IN_SET(s.student_id, nd.student_ids) > 0
            GROUP BY 
                nd.id, nd.notice_date, nd.message
            ORDER BY 
                nd.id DESC;`;
            queryParams = [id]
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(query, queryParams);
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




//@desc Get  dashboard data of all test for each student
//@route POST /dashboard/getTest
//@access Public
const getTest = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id, isStudent, isTeacher, isAdmin} = req.user;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        console.log(`id => ${id}, isStudent => ${isStudent}, isTeacher => ${isTeacher}, isAdmin => ${isAdmin}`);

        let query;
        let queryParams;

        if (isStudent == true) {
            query = ` 
            SELECT 
                'Test' AS event_type,
                td.test_date AS event_date,
                b.batch_name AS event_batch_name,
                td.test_name AS event_name,
                td.test_description AS event_description
            FROM 
                student_batches sb
            JOIN 
                tests_details td ON sb.batch_id = td.batch_id
            JOIN 
                batch b ON sb.batch_id = b.batch_id
            WHERE 
                sb.student_id = ?
            ORDER BY 
                td.test_id desc;`;
            queryParams = [id]
        }

        if (isTeacher == true) {
            query = `
            SELECT 
                'Test' AS event_type,
                td.test_date AS event_date,
                b.batch_name AS event_batch_name,
                td.test_name AS event_name,
                td.test_description AS event_description
            FROM 
                teacher_batches tb
            JOIN 
                tests_details td ON tb.batch_id = td.batch_id
            JOIN 
                batch b ON tb.batch_id = b.batch_id
            WHERE 
                tb.teacher_id = ?
            ORDER BY 
                td.test_id desc;`;
            queryParams = [id]
        }

        if (isAdmin == true) {
            query = ` 
            SELECT 
                'Test' AS event_type,
                td.test_date AS event_date,
                b.batch_name AS event_batch_name,
                td.test_name AS event_name,
                td.test_description AS event_description
            FROM 
                tests_details td
            JOIN 
                batch b ON b.batch_id = td.batch_id
            ORDER BY 
                td.test_id desc;`;
            queryParams = [id]
        }


        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(query, queryParams);
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






//@desc Get  dashboard data of all notice for each student
//@route POST /dashboard/getHomework
//@access Public
const getHomework = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id, isStudent, isTeacher, isAdmin} = req.user;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        console.log(`id => ${id}, isStudent => ${isStudent}, isTeacher => ${isTeacher}, isAdmin => ${isAdmin}`);

        let query;
        let queryParams;

        if (isStudent == true) {
            query = ` 
            SELECT 
                'Homework' AS event_type,
                h.submission_date AS event_date,
                b.batch_name AS event_batch_name,
                h.homework_title AS event_name,
                h.homework_description AS event_description
            FROM 
                student_batches sb
            JOIN 
                batch b ON sb.batch_id = b.batch_id
            JOIN 
                homework h ON b.batch_id = h.batch_id
            WHERE 
                sb.student_id = ?
            ORDER BY 
                h.homework_id desc;
            `
            queryParams = [id]
        }

        if (isTeacher == true) {
            query = `
            SELECT 
                'Homework' AS event_type,
                h.submission_date AS event_date,
                b.batch_name AS event_batch_name,
                h.homework_title AS event_name,
                h.homework_description AS event_description
            FROM 
                teacher_batches tb
            JOIN 
                batch b ON tb.batch_id = b.batch_id
            JOIN 
                homework h ON b.batch_id = h.batch_id
            WHERE 
                tb.teacher_id = ?
            ORDER BY 
                h.homework_id desc;`;
            queryParams = [id]
        }

        if (isAdmin == true) {
            query = `
            SELECT 
                'Homework' AS event_type,
                h.submission_date AS event_date,
                b.batch_name AS event_batch_name,
                h.homework_title AS event_name,
                h.homework_description AS event_description
            FROM 
                homework h
            JOIN 
                batch b ON b.batch_id = h.batch_id
            ORDER BY 
                h.homework_id desc;`;
            queryParams = [id]
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(query, queryParams);
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


//@desc Get user info based on Token
//@route POST /dashboard/getUserInfo
//@access Public
const getUserInfo =  asyncHandler(async (req, res) => {
    let connection;
    try {
        const {id, isStudent, isTeacher, isAdmin} = req.user;
        if(!id) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        console.log(`id => ${id}, isStudent => ${isStudent}, isTeacher => ${isTeacher}, isAdmin => ${isAdmin}`);

        let query;
        let queryParams;

       
        if(isStudent == true) {
            query = `
            SELECT s.student_id as id, s.student_name as name, s.student_image_path as image  FROM students s 
            WHERE student_id = ?;`,
        queryParams = [id];
        }
       
        if(isTeacher == true) {
            query = `
            SELECT t.teacher_id as id, t.teacher_name as name, t.student_image_path as image  FROM teachers t 
            WHERE teacher_id = ?;`,
        queryParams = [id];
        }
       
        if(isAdmin == true) {
            res.status(404);
            throw new Error ("Admin shouldn't be suppose to be here");
        }

        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(query, queryParams);

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


module.exports = {
    getDashboardDataOnStudentId,
    getNotice,
    getTest,
    getHomework,
    getUserInfo
}