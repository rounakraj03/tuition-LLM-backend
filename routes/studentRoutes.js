const express = require("express");
const { getAllStudentFromBatches, getStudentData, addStudentData, editStudentData, editStudentNoImageChange, deleteStudent, getAllStudentList, updateStudentMonthlyFeesNotifier } = require("../controllers/studentController");
const { studentProfilePictureUpload } = require("../middleware/s3StorageUpload");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();


router.route("/getStudentList").post(getAllStudentFromBatches);

router.route("/getAllStudentList").post(getAllStudentList);

router.route("/getStudent").post(getStudentData);

router.route("/addStudent").post(studentProfilePictureUpload.single("file"), addStudentData);


router.route("/editStudent").post(studentProfilePictureUpload.single("file"), editStudentData);

router.route("/editStudentNoImageChange").post(editStudentNoImageChange);

router.route("/deleteStudent").post(deleteStudent);

router.route("/updateStudentMonthlyFeesNotifier").post(validateToken, updateStudentMonthlyFeesNotifier);




module.exports = router;