function successDataType(result) {
    const data = {
        status: "200",
        message: "SUCCESS",
        result: result,
    };
    return data;
}

function successEmptyDataType() {
    const data = {
        status: "200",
        message: "SUCCESS",
    };
    return data;
}


module.exports = {successDataType, successEmptyDataType}