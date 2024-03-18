const express = require("express");
const { getAllBatches, getAllBatchesWithCount, deleteBatch, addBatch, updateBatch } = require("../controllers/batchController");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();

router.route("/getAllBatches").post(getAllBatches);

router.route("/showBatch").post(validateToken ,getAllBatchesWithCount);

router.route("/deleteBatch").post(deleteBatch);

router.route("/addBatch").post(addBatch);

router.route("/updateBatch").post(updateBatch);

module.exports = router;