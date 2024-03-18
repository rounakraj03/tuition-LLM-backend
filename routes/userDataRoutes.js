const express = require("express");
const { getStudyMaterial, addNewStudyMaterialFile } = require("../controllers/studyMaterialController");
const { studyMaterialUpload } = require("../middleware/s3StorageUpload");
const { addPhoneNumberLinkToStudent, fetchPhoneNumberLinkToStudent, addFcmToken, fetchPhoneNumberLinkToTeacher, addPhoneNumberLinkToTeacher, generateAdminAuthToken } = require("../controllers/userDataController");
const router = express.Router();


router.route("/addFcmToken").post(addFcmToken);

router.route("/generateAdminAuthToken").post(generateAdminAuthToken);

router.route("/fetchPhoneNumberLinkToStudent").post(fetchPhoneNumberLinkToStudent);

router.route("/addPhoneNumberLinkToStudent").post(addPhoneNumberLinkToStudent);

router.route("/fetchPhoneNumberLinkToTeacher").post(fetchPhoneNumberLinkToTeacher);

router.route("/addPhoneNumberLinkToTeacher").post(addPhoneNumberLinkToTeacher);


module.exports = router;