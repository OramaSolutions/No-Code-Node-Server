const express = require("express");
const router = express.Router();
const { verifyToken } = require("../auth/verifyToken");
const { csrfProtection } = require("../auth/csrf");
const userController = require("../controller/user/user");
const multer = require("multer");
const multerS3 = require('multer-s3');
const aws = require("aws-sdk");
const projectController = require("../controller/user/projectServices");
const { refresh } = require("../controller/user/refreshController");

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

router.post("/userSignup", userController.userSignup);
router.put("/setPassword", userController.setPassword);

router.post("/userLogin", userController.userLogin);
router.post('/refresh', csrfProtection, refresh);
router.post("/sentEmail", userController.forgetEmail);
router.put("/resetPasword", userController.resetPassword);

router.use(verifyToken);
router.get("/me", userController.getMe);

router.get('/logout', userController.logoutUser)
router.get("/viewProfile", userController.viewProfile);
router.post("/editProfile", userController.editProfile);
router.post("/createSupport", userController.addSupport);
router.post("/changePassword", userController.changePassword);
router.post("/checkProject", projectController.projectCheck);
router.post("/createProject", projectController.addProject);
router.post("/addRemark", projectController.addRemark);
router.post("/getProjectForOpen", projectController.getProjectForOpen);
router.get("/myLatestProjectList", projectController.myLatestProjectList);
router.get("/myProjectList", projectController.myProjectList);
router.get("/versionDropDown", projectController.versionDropDown);
// router.get("/notificationList", projectController.notificationList);
router.post("/uploadDocumnet", upload.single("fileName"), userController.uploadDocumnet);

module.exports = router;
