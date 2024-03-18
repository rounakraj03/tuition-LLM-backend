const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const  {initializeApp, applicationDefault } = require('firebase-admin/app');
const  { getMessaging } = require("firebase-admin/messaging");
const schedule = require('node-schedule');
const { myScheduledFunction } = require("./middleware/dailyRunningTask");




// Initialize Firebase Messaging.
initializeApp({
    Credential: applicationDefault(),
    projectid: 'tution-app'
});

const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());


app.use("/app-data", require("./routes/appDataRoutes"));
app.use("/batch", require("./routes/batchRoutes"));
app.use("/student", require("./routes/studentRoutes"));
app.use("/test", require("./routes/testRoutes"));
app.use("/homework", require("./routes/homeworkRoutes"));
app.use("/attendance", require("./routes/attendanceRoutes"));
app.use("/study-material", require("./routes/studyMaterialRoutes"));
app.use("/user-data", require("./routes/userDataRoutes"));
app.use("/dashboard", require("./routes/dashboardRoutes"));
app.use("/notice", require("./routes/noticeRoutes"));
app.use("/teacher", require("./routes/teacherRoutes"));


// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/pages/mainPage.html");
// });

app.get("/", (req, res) => {
    res.redirect("http://r3d.org.in");
});


const scheduledTask = schedule.scheduleJob('30 15 * * *', myScheduledFunction);



app.use(errorHandler);

app.listen(port, () => {
    let date_ob = new Date();
    // current hours
let hours = date_ob.getHours();

// current minutes
let minutes = date_ob.getMinutes();

// current seconds
let seconds = date_ob.getSeconds();
    
console.log(`server is running in port ${port}// time  ->  ${hours} - ${minutes} - ${seconds}`);
});


