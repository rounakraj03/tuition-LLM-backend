const express = require("express");
const { studyMaterialUpload } = require("../middleware/s3StorageUpload");
const { getDashboardDataOnStudentId, getNotice, getTest, getHomework, getUserInfo } = require("../controllers/dashboardController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();


router.route("/getDashboardDataOnStudentId").post(validateToken, getDashboardDataOnStudentId);


router.route("/getNotice").post(validateToken, getNotice);


router.route("/getTest").post(validateToken, getTest);


router.route("/getHomework").post(validateToken, getHomework);

router.route("/getUserInfo").post(validateToken, getUserInfo);






module.exports = router;