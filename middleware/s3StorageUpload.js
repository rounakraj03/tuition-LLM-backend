const AWS = require('aws-sdk');
const multerS3 = require('multer-s3-transform');
const multer = require('multer');
const moment = require('moment'); 
// const multerSharpS3 = require('multer-sharp-s3');


const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});


const studyMaterialUpload = multer({
    storage: multerS3({
        s3: s3, 
        bucket: process.env.AWS_BUCKET_NAME,
        acl: "public-read",
        key: function (req, file, cb) {
            const timestamp = moment().format('YYYYMMDDHHmmss');
            cb(null, "study-material/"+timestamp+file.originalname);
        },
    }),
});


//basically put size 400 becauseI generally use small image to display photo so need of heavy image
// const studentProfilePictureUpload = multer({
//     storage: multerSharpS3({
//         s3: s3,
//         Bucket: process.env.AWS_BUCKET_NAME,
//         ACL: 'public-read',
//         Key: (req, file, cb) => {
//             const timestamp = moment().format('YYYYMMDDHHmmss');
//             cb(null, 'profile-pictures/' + timestamp + file.originalname);
//         },
//         resize: {
//             // width: 800,
//             height: 400,
//             withoutEnlargement: true
//             // options: {
//             //     fit: 'inside',
//             // },
//         },
//         quality: 80, // Adjust the quality as needed
//     }),
// });



const studentProfilePictureUpload = multer({
    storage: multerS3({
        s3: s3, 
        bucket: process.env.AWS_BUCKET_NAME,
        acl: "public-read",
        key: function (req, file, cb) {
            const timestamp = moment().format('YYYYMMDDHHmmss');
            cb(null, "profile-pictures/"+timestamp+file.originalname);
        },
    }),
});


async function deleteFileFromS3(storagePath) {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: storagePath
    };

    try {
        await s3.deleteObject(params).promise();
        console.log(`Deleted file from S3: ${storagePath}`);
    } catch (error) {
        console.error(`Error deleting file from S3: ${storagePath}`, error);
        throw new Error("Error deleting the object", error);
    }
}


module.exports = {
    studyMaterialUpload,
    studentProfilePictureUpload,
    deleteFileFromS3
}