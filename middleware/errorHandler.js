const {constants} = require("../constants");

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 400;
    switch (statusCode) {

        case constants.VALIDATION_ERROR:
            res.json({
                status: constants.VALIDATION_ERROR,
                errorMessage: err.message, 
                // stacktrace: err.stack
            });
            break;
    
        case constants.NOT_FOUND:
            res.json({
                status: constants.NOT_FOUND,
                errorMessage: err.message, 
                // stacktrace: err.stack
            });
            break;
    
        case constants.UNAUTHORIZED:
            res.json({
                status: constants.UNAUTHORIZED,
                errorMessage: err.message, 
                // stacktrace: err.stack
            });
            break;
    
        case constants.FORBIDDEN:
            res.json({
                status: constants.FORBIDDEN,
                errorMessage: err.message, 
                // stacktrace: err.stack
            });
            break;

    
        // case constants.SERVER_ERROR:
        //     res.json({
        //         status: constants.SERVER_ERROR,
        //         errorMessage: err.message, 
        //         // stacktrace: err.stack
        //     });
        //     break;
    
        default:
            console.log("No error, All good!",err);
            break;
    }
}



module.exports = errorHandler;