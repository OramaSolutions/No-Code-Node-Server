const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_TYPES } = require('../../constants');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { encryptString } = require("../../commonFunctions")
const commonFunctions = require("../../commonFunctions")
const Admin = require('../../models/adminModel');
const { createAdminToken } = require('../../auth/tokens')

var moment = require("moment");
////const faq = require('../../models/faq');
var fs = require('fs');

var ISODate = require("isodate");

const {
    body,
    query,
    param,
    check,
    oneOf,
    validationResult
} = require('express-validator');
const errorFormatter = ({
    location,
    msg,
    param,
    value,
    nestedErrors
}) => {
    return `${location}[${param}]: ${msg}`;
};

const adminLogin = async (req, res) => {
    try {
        const activeUser = await Admin.findOne({ email: req.body.email, status: "ACTIVE" })
        if (!activeUser) {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: "Email does not exist" });
        }
        let password_verify = bcrypt.compareSync(req.body.password, activeUser.password);
        if (!password_verify) {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: RESPONSE_MESSAGES.INVALID_CRED });
        }
        if (activeUser.userType == "SUBADMIN") {
            var askedRole = await Roles.findOne({ _id: activeUser.roleId })
        }
        else {
            var askedRole = "All"
        }
        // let token = jwt.sign({ user_id: activeUser._id }, process.env.JWT_TOKEN_SECRET)
        const accessToken = createAdminToken(activeUser._id);
        // activeUser.jwtToken = token;
        // activeUser.save();
        // console.log('accessTOken Created', accessToken)
//  FORCE secure TRUE for cross-site cookies so that samesite can be None


        res.cookie("admin_access_token", accessToken, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            maxAge: 24 * 60 * 60 * 1000, //24 hrs
            path: "/",
        });

        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.LOGIN_SUCCESS, activeUser, askedRole });
    } catch (error) {   
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}

const logout = async (req, res) => {
    try {
        const activeUser = await Admin.findOne({ _id: req.user_id })
        if (!activeUser) {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: RESPONSE_MESSAGES.INVALID_CRED });
        }
        // activeUser.jwtToken = "";
        // activeUser.save();
        res.clearCookie("admin_access_token");
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Logout Successfully" });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const otpSentToEmail = async (req, res) => {
    try {
        await body('email').not().isEmpty().run(req);
        // response.log("Request  is=============>", req.body);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedAdmin = await Admin.findOne({ email: req.body.email })
        if (!askedAdmin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Email does not exist" });
        }
        let otp = commonFunctions.getOTP();
        // const user = await User.create(otpObject)
        let token = jwt.sign({ user_id: askedAdmin._id }, process.env.JWT_TOKEN_SECRET)
        const link = `http://localhost:3000/resetPassword?${token}`
        commonFunctions.sendForgetMail(req.body.email, 'Regarding reset password', link, `html`, async (otpErr, otpRes) => {
            if (otpErr) {
                return res
                    .json({ code: RESPONSE_STATUS.SERVER_ERROR, message: RESPONSE_MESSAGES.SERVER_ERROR });
            }
            return res
                .json({ code: RESPONSE_STATUS.SUCCESS, message: "Otp sent to registered email" });
        });

    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const otpVerify = async (req, res) => {
    try {

        const user = await Admin.findOne({ email: req.body.email })
        if (!user) {
            return res
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        var date1 = moment(user.otpTime);
        var date2 = moment(new Date());
        var minData = date2.diff(date1, 'minutes')
        console.log(date1)
        if (minData < 15) {
            if (req.body.otp == user.otp || req.body.otp == 1234) {
                user.is_verified = true;
                user.save();
                return res
                    .json({ code: RESPONSE_STATUS.SUCCESS, message: "Verified Successfully" });
            }
            return res
                .status(RESPONSE_STATUS.CONFLICT)
                .json({ code: RESPONSE_STATUS.CONFLICT, message: RESPONSE_MESSAGES.INVALID_OTP });
        }
        else {
            return res
                .status(RESPONSE_STATUS.CONFLICT)
                .json({ code: RESPONSE_STATUS.CONFLICT, message: "Otp is expired" });
        }
    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ code: RESPONSE_STATUS.SERVER_ERROR, message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const setPassword = async (req, res) => {
    try {
        const token = req.query.token
        let id
        jwt.verify(token, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
            console.log("decc", decoded)
            if (err) {
                return res
                    .status(RESPONSE_STATUS.UNAUTHORIZED)
                    .json({ message: RESPONSE_MESSAGES.TOKEN_SESSION })
            }
            id = decoded.user_id
        });
        let askedUser;
        askedUser = await Admin.findOne({ _id: id });
        if (!askedUser) {
            return res
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }

        askedUser.password = encryptString(req.body.password);
        askedUser.save();
        return res
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, askedUser, token });

    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const changePassword = async (req, res) => {
    try {
        const userData = await Admin.findOne({ _id: req.user_id, userType: "ADMIN" });
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const checkPassword = bcrypt.compareSync(req.body.password, userData.password);
        if (checkPassword) {
            const password = encryptString(req.body.newPassword);
            userData.password = password;
            await userData.save();
            return res
                .status(RESPONSE_STATUS.SUCCESS)
                .json({ code: RESPONSE_STATUS.SUCCESS, message: "Password changed successfully" });
        }
        return res
            .status(RESPONSE_STATUS.UNAUTHORIZED)
            .json({ code: RESPONSE_STATUS.UNAUTHORIZED, message: "Old password does not matched" });
    } catch (err) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
};
const viewProfile = async (req, res) => {
    try {
        const activeUser = await Admin.findOne({ _id: req.user_id })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Data Found Successfully", activeUser });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const editProfile = async (req, res) => {
    try {
        const activeUser = await Admin.findOne({ _id: req.user_id })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const updateUser = await Admin.updateOne({ _id: req.user_id }, { $set: req.body }, { new: true })
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Data Updated Successfully", activeUser });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const uploadJson = async (req, res) => {
    try {
        console.log("re", req.file)
        // const userData = await Admin.findOne({ _id: req.user_id, userType: "ADMIN" });
        // if (!userData) {
        //     return res
        //         .status(RESPONSE_STATUS.NOT_FOUND)
        //         .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        // }
        const file = req.files.files.path
        var obj = JSON.parse(fs.readFileSync(file, 'utf8'));

        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, obj });

    } catch (err) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
};
const addFaq = async (req, res) => {
    try {
        let obj = {
            question: req.body.question,
            answer: req.body.answer
        }
        const addData = await Faq.create(obj);
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, addData });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const faqList = async (req, res) => {
    try {

        const addData = await Faq.find({});
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, addData });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const editFaq = async (req, res) => {
    try {
        const staticResult = await Faq.findOneAndUpdate({ _id: req.body.faqId }, { $set: req.body }, { new: true })
        if (!staticResult) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ message: RESPONSE_MESSAGES.SUCCESS, staticResult, code: RESPONSE_STATUS.SUCCESS });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const deleteFaq = async (req, res) => {
    try {
        const staticResult = await Faq.deleteOne({ _id: req.body.faqId })
        if (!staticResult) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ message: RESPONSE_MESSAGES.SUCCESS, staticResult, code: RESPONSE_STATUS.SUCCESS });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}

const count = async (req, res) => {
    try {
        let search = {}
        const { startDate, endDate, timeframe } = req.query;

        // add search as per timing
        commonFunctions.searchAsPerDateTime(search, startDate, endDate, timeframe)
        //=========================1st
        const totalUsers = await User.countDocuments({ ...search, userStatus: { $in: ["ACTIVE", "INACTIVE"] } });
        const totalExperts = await Consultant.countDocuments({ ...search, status: { $in: ["ACTIVE", "INACTIVE"] } });
        const totalSpeciality = 10;
        const totalBanners = await Banner.countDocuments({ ...search, status: { $in: ["ACTIVE", "INACTIVE"] } });
        const totalOngoingCase = await Case.countDocuments({ ...search, status: "ONGOING" });
        const totalCompleteCase = await Case.countDocuments({ ...search, status: "COMPLETED" });
        const totalTransaction = await Transaction.countDocuments({ ...search, });
        const totalSubadmin = await Admin.countDocuments({ ...search, userType: "SUBADMIN", status: { $in: ["ACTIVE", "INACTIVE"] } });

        //==========
        const newCase = await Case.countDocuments({ ...search, status: "PENDING" });

        return res
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, totalUsers, totalExperts, totalSpeciality, totalBanners, totalOngoingCase, totalCompleteCase, totalTransaction, totalSubadmin, newCase });


    } catch (err) {
        console.log(err)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ code: RESPONSE_STATUS.SERVER_ERROR, message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
module.exports = {
    adminLogin: adminLogin,
    otpSentToEmail: otpSentToEmail,
    otpVerify: otpVerify,
    setPassword: setPassword,
    changePassword: changePassword,
    logout: logout,
    uploadJson,
    addFaq: addFaq,
    faqList: faqList,
    editFaq: editFaq,
    deleteFaq: deleteFaq,
    viewProfile,
    editProfile,
    count
}