const cron = require('node-cron');
var schedule = require('node-schedule');

//const { findCase } = require("./controller/admin/caseManagement.js");
// const { checkForActiveDriver } = require("./controller/driver/driverController.js");
// const { checkForActivePlan } = require("./controller/advertisement/advController.js");

// cron.schedule('*/1 * * * *', () => {
//     console.info("Cron Run At =>", (new Date()).toUTCString());
//     console.log("caaaaaaaaaaaaaaaaaaa", new Date(2024, 5, 23, 7, 55, 0));
//     console.log(findCase,"gaaaaa")
//     //checkForActivePartner().then(() => { }).catch((error) => { console.error("error while running cron =>", error) });
// });

// cron.schedule('* * 23 * * *', () => {
//     console.info("Cron Run At =>", (new Date()).toUTCString());
//     checkForActiveDriver().then(() => { }).catch((error) => { console.error("error while running cron =>", error) });
// });

// cron.schedule('* * 23 * * *', () => {
//     console.info("Cron Run At =>", (new Date()).toUTCString());
//     checkForActivePlan().then(() => { }).catch((error) => { console.error("error while running cron =>", error) });
// });
// var date = new Date(2024, 4, 23, 7, 55, 0);
// var j = schedule.scheduleJob(date, function () {
//     console.log('shedule run.');
// });