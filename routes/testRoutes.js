const express = require("express");
const { createTest, getTestsBasedOnBatchId, getTestsWithAssignedInfoBasedOnBatchId, studentPerformance, markStudentMarks, studentListWithMarksObtainedDetail } = require("../controllers/testController");
const router = express.Router();



router.route("/createTest").post(createTest);

router.route("/getTestsBasedOnBatchId").post(getTestsBasedOnBatchId );

router.route("/getTestsWithAssignedInfoBasedOnBatchId").post(getTestsWithAssignedInfoBasedOnBatchId);

router.route("/studentListWithMarksObtainedDetail").post(studentListWithMarksObtainedDetail);

router.route("/markStudentMarks").post(markStudentMarks);

router.route("/studentPerformance").post(studentPerformance);


module.exports = router;

