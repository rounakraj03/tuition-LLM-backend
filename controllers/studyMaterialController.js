const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const { successDataType, successEmptyDataType } = require("../responseFormat");
const { deleteFileFromS3 } = require("../middleware/s3StorageUpload");


//@desc Gets all Study Material
//@route POST /study-material/getStudyMaterial
//@access Public
const getStudyMaterial = asyncHandler(async (req, res) => {
    let connection; 
    try {
        connection = await rdsConnection.getConnection();
        const [rows] = await connection.query(
            `SELECT * FROM study_materials;`);
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



//@desc Adds a new study material info in study material table
//@route POST /study-material/addNewStudyMaterialFile
//@access Public
const addNewStudyMaterialFile = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {
            file_name,
            path_to_show_in_app
        } = req.body;


        const storage_path = req.file.location;
        const storage_key = req.file.key;


        if(!file_name || !path_to_show_in_app) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();

        const [existingFile] = await connection.query(
            `
            SELECT storage_path,storage_key
            FROM study_materials
            WHERE file_name = ? AND path_to_show_in_app = ?;
            `,
            [file_name, path_to_show_in_app]
        );

        if (existingFile.length > 0) {
            // File with the same file_name and path_to_show_in_app exists; delete it from S3.
            const existingStoragePath = existingFile[0].storage_key;
            await deleteFileFromS3(existingStoragePath);
        }

        // Insert attendance record for the current student.
        const [studyMaterialRows] = await connection.query(
        `
        INSERT INTO study_materials (file_name, path_to_show_in_app, storage_path, storage_key) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE storage_path = ?, storage_key = ?;`,
            [file_name, path_to_show_in_app, storage_path, storage_key, storage_path, storage_key]
        );

        await connection.commit();

        res.json(successEmptyDataType());
    } catch (error) {
        if (connection) {
            await connection.rollback();
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





//@desc delets study material info in study material table
//@route POST /study-material/deleteStudyMaterial
//@access Public
const deleteStudyMaterialFile = asyncHandler(async (req, res) => {
    let connection;
    try {
        const {
            storage_key
        } = req.body;




        if(!storage_key) {
            res.status(400);
            throw new Error("All fields are mandatory");
        }

        connection = await rdsConnection.getConnection();
        await connection.beginTransaction();

        await deleteFileFromS3(storage_key);

        const [existingFile] = await connection.query(
            `
            DELETE
            FROM study_materials
            WHERE storage_key = ? ;
            `,
            [storage_key]
        );

     

        await connection.commit();

        res.json(successEmptyDataType());
    } catch (error) {
        if (connection) {
            await connection.rollback();
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
    getStudyMaterial,
    addNewStudyMaterialFile,
    deleteStudyMaterialFile
}