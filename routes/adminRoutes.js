const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require("../auth/verifyToken");
const adminServices = require('../controller/admin/adminService');
const userController = require('../controller/admin/userManagement');
const staticController = require('../controller/admin/staticManagement');
const helpController = require('../controller/admin/helpManagement');
const projectController = require('../controller/admin/projectManagement');
const notificationController = require('../controller/admin/notificationManagement');
const userCont = require("../controller/user/user");
const multer = require("multer");
const multerS3 = require('multer-s3');
const aws = require("aws-sdk");

aws.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
    // region: 'us-east-1'
});
const s3 = new aws.S3();
var upload = multer({
    storage: multerS3({
        s3: s3,
        acl: 'public-read',
        bucket: 'mobileapplications',
        key: function (req, file, cb) {
            console.log(file);
            cb(null, file.originalname); //use Date.now() for unique file keys
        }
    })
});
router.post("/adminLogin", adminServices.adminLogin);
router.post("/sentEmail", adminServices.otpSentToEmail);
router.post("/otpVerify", adminServices.otpVerify);
router.put("/setPassword", adminServices.setPassword);



router.use(verifyAdminToken);
router.get("/logout", adminServices.logout);
router.put("/changePassword", adminServices.changePassword);
router.get("/count", adminServices.count);
router.get("/viewProfile", adminServices.viewProfile);
router.put("/editProfile", adminServices.editProfile);
//=======================USER============================
router.post("/addUser", userController.addUser);
router.put("/editUser", userController.editUser);
router.patch("/userStatusChanged", userController.statusChanged);
router.get("/userList", userController.userList);
router.get("/userProjectList", userController.projectList);
router.get("/searchUserList", userController.searchUserList);
router.get("/deleteUser", userController.deleteUser);

//=======================Help============================
router.post("/addAssignUser", helpController.addUser);
router.get("/helpUserDropDown", helpController.helpUserDropDown);
router.patch("/assignHelp", helpController.assignHelp);
router.patch("/helpStatus", helpController.statusChanged);
router.get("/helpList", helpController.helpList);
router.post("/addNote", helpController.addNote);
router.get("/noteList", helpController.noteList);
//=======================Project============================
router.post("/updateStatusCloseOpen", projectController.updateStatusCloseOpen);
router.post("/approvedStatusChanged", projectController.approvedStatusChanged);
router.get("/projectList", projectController.projectList);
router.post("/addRemark", projectController.addRemark);
router.post("/getRemark", projectController.getProjectRemarks)

//=======================Notification==============
router.post("/notifications", notificationController.addNotification);
router.get("/notifications", notificationController.adminNotificationList);
// router.post("/editNotification", notificationController.editNotification);
// router.post("/resendNotification", notificationController.resendNotification);
// router.get("/notificationList", notificationController.notificationList);
// router.delete("/deleteNotification", notificationController.statusChanged);

//=======================Static and social==============
router.get("/getStaticContent", staticController.getStaticContent);
router.put("/editStaticContent", staticController.editStaticContent);

router.post("/uploadDocumnet", upload.single("fileName"), userCont.uploadDocumnet);

module.exports = router;
