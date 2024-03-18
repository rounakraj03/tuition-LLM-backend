const express = require("express");
const { createHomework, getHomeworkByBatch } = require("../controllers/homeworkController");
const router  = express.Router();


router.route("/createHomework").post(createHomework);


router.route("/getHomeworkByBatch").post(getHomeworkByBatch);




module.exports = router;