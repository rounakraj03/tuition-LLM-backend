const express = require("express");
const { appLogo } = require("../controllers/appDataController");
const router = express.Router();


router.route("/appLogo").post(appLogo);


module.exports = router;