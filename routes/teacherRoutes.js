const express = require("express");
const { getTeacherData, getAllTeacherFromBatches, getAllTeacherList, editTeacherData, addTeacherData, editTeacherNoImageChange, deleteTeacher } = require("../controllers/teacherController");
const { studentProfilePictureUpload } = require("../middleware/s3StorageUpload");
const router = express.Router();



router.route("/getTeacherList").post(getAllTeacherFromBatches);

router.route("/getAllTeacherList").post(getAllTeacherList);

router.route("/getTeacher").post(getTeacherData);

router.route("/addTeacher").post(studentProfilePictureUpload.single("file"), addTeacherData);

router.route("/editTeacher").post(studentProfilePictureUpload.single("file"), editTeacherData);

router.route("/editTeacherNoImageChange").post(editTeacherNoImageChange);

router.route("/deleteTeacher").post(deleteTeacher);



module.exports = router;