const asyncHandler = require ("express-async-handler");
const rdsConnection = require("../config/dbConnections");
const { constants } = require("../constants");
const { successDataType, successEmptyDataType } = require("../responseFormat");



//@desc Add fcm token in 
//@route POST /app-data/appLogo
//@access Public
const appLogo = asyncHandler(async (req, res) => {
    try {
        const data = {
            appName: process.env.TUTION_NAME,
            logoUrl: process.env.TUTION_LOGO_URL
        }
        res.json(successDataType(data));
    } catch (error) {
        res.status(400);
        throw new Error(`${error}`);
    }
});


module.exports = {
    appLogo
};