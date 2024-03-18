// const AWS = require("aws-sdk");
// const mysql = require("mysql2");



//         const rdsConfig = {
//             host: process.env.MYSQL_HOST,
//             user: process.env.MYSQL_USER,
//             password: process.env.MYSQL_PASSWORD,
//             database: process.env.MYSQL_DATABASE
//         };

//         const rdsConnection = mysql.createConnection(rdsConfig).promise();        


// module.exports = rdsConnection;


const AWS = require("aws-sdk");
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 100, // Adjust this based on your needs
  waitForConnections: true,
  queueLimit: 0,
});

const rdsConnection = pool.promise();

module.exports = rdsConnection;
