const express = require("express");
const { studentListWithAttendanceDetail, addBatchAttendance, getStudentAttendancebyStudentId } = require("../controllers/attendanceController");
const router  = express.Router();


router.route("/studentListWithAttendanceDetail").post(studentListWithAttendanceDetail);

router.route("/addBatchAttendance").post(addBatchAttendance);

router.route("/getStudentAttendancebyStudentId").post(getStudentAttendancebyStudentId);



module.exports = router;