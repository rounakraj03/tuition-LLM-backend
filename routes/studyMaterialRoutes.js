const express = require("express");
const { getStudyMaterial, addNewStudyMaterialFile, deleteStudyMaterialFile } = require("../controllers/studyMaterialController");
const { studyMaterialUpload } = require("../middleware/s3StorageUpload");
const router = express.Router();


router.route("/getStudyMaterial").post(getStudyMaterial);

router.route("/addNewStudyMaterialFile").post(studyMaterialUpload.single("file"), addNewStudyMaterialFile);

router.route("/deleteStudyMaterial").post(deleteStudyMaterialFile);




module.exports = router;