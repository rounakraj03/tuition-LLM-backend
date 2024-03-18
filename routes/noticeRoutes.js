const express = require("express");
const { getBatchStudentMap, sendNotice } = require("../controllers/noticeController");
const router  = express.Router();


router.route("/getBatchStudentMap").post(getBatchStudentMap);


router.route("/sendNotice").post(sendNotice);


module.exports = router;