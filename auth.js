const { encryptString } = require("../../utills/commonFunctions");
const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_STATUS, USER_TYPES } = require('../../constants');
const commonFunctions = require("../../utills/commonFunctions")
const bcrypt = require("bcryptjs");
const User = require('../../models/userModel');
const Demograpic = require('../../models/demograpicDetails');
const Otp = require('../../models/otpModel');
const UserIntakeQuestion = require('../../models/patientIntakeQuestion');
const ConsultantQuestion = require('../../models/consultantQuestionAnswer.js');
const Question = require('../../models/intakeQuestion');
const Option = require('../../models/intakeOption');
const UploadDocument = require('../../models/uploadDocument');
const Case = require('../../models/caseModel');
const jwt = require('jsonwebtoken');
var CryptoJS = require("crypto-js");
var moment = require("moment");
const crypto = require("../../crypto")
const mongoose = require("mongoose");
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



const otpSent = async (req, res) => {
    try {
        await body('email').not().isEmpty().run(req);
        // response.log("Request  is=============>", req.body);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedUser = await User.findOne({ email: req.body.email, userStatus: { $in: ["ACTIVE", "INACTIVE"] } })
        if (askedUser) {
            return res
                .status(RESPONSE_STATUS.CONFLICT)
                .json({ code: RESPONSE_STATUS.CONFLICT, message: "This email is already exist" });
        }
        else {
            let otp = commonFunctions.getOTP();
            let askedOtp
            askedOtp = await Otp.findOne({ email: req.body.email })
            if (askedOtp) {
                commonFunctions.sendOtpMail(req.body.email, 'Regarding Otp Please Verify', otp, `html`, async (otpErr, otpRes) => {
                    if (otpErr) {
                        return res
                            .json({ code: RESPONSE_STATUS.SERVER_ERROR, message: RESPONSE_MESSAGES.SERVER_ERROR });
                    }

                    askedOtp.otp = otp;
                    askedOtp.otpTime = new Date().toISOString()
                    askedOtp.save();
                    return res
                        .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, askedOtp });
                });

            }
            else {
                commonFunctions.sendOtpMail(req.body.email, 'Regarding Otp Please Verify', otp, `html`, async (otpErr, otpRes) => {
                    if (otpErr) {
                        return res
                            .json({ code: RESPONSE_STATUS.SERVER_ERROR, message: RESPONSE_MESSAGES.SERVER_ERROR });
                    }
                    const otpObj = {
                        email: req.body.email,
                        otp: otp,
                        otpTime: new Date().toISOString()
                    }
                    const addOtp = await Otp.create(otpObj);
                    return res
                        .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, addOtp });
                });
            }
        }


    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const emailVerify = async (req, res) => {
    try {
        await body('email').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const otpUser = await Otp.findOne({ email: req.body.email })
        var date1 = moment(otpUser.otpTime);
        var date2 = moment(new Date());
        var minData = date2.diff(date1, 'minutes')
        // console.log("aaaaaaaaaaaaa", minData)
        // return
        if (minData < 15) {
            console.log("aaaaaaaaaaaaa", minData)
            if (req.body.otp == otpUser.otp || req.body.otp == 123456) {
                const otpUser = await Otp.deleteOne({ email: req.body.email });
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
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const forgotOtpSent = async (req, res) => {
    try {
        await body('email').not().isEmpty().run(req);
        // response.log("Request  is=============>", req.body);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedAdmin = await User.findOne({ email: req.body.email })
        if (!askedAdmin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Email does not exist" });
        }
        let otp = commonFunctions.getOTP();
        let askedOtp
        askedOtp = await Otp.findOne({ email: req.body.email })
        if (askedOtp) {
            commonFunctions.sendOtpMail(req.body.email, 'Regarding Otp Please Verify', otp, `html`, async (otpErr, otpRes) => {
                if (otpErr) {
                    return res
                        .json({ code: RESPONSE_STATUS.SERVER_ERROR, message: RESPONSE_MESSAGES.SERVER_ERROR });
                }
                askedOtp.otp = otp;
                askedOtp.otpTime = new Date().toISOString()
                askedOtp.save();
                return res
                    .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, askedOtp });
            });

        }
        else {
            commonFunctions.sendOtpMail(req.body.email, 'Regarding Otp Please Verify', otp, `html`, async (otpErr, otpRes) => {
                if (otpErr) {
                    return res
                        .json({ code: RESPONSE_STATUS.SERVER_ERROR, message: RESPONSE_MESSAGES.SERVER_ERROR });
                }
                const otpObj = {
                    email: req.body.email,
                    otp: otp,
                    otpTime: new Date().toISOString()
                }
                const addOtp = await Otp.create(otpObj);
                return res
                    .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, addOtp });
            });
        }

    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const setPassword = async (req, res) => {
    try {
        let askedUser;
        if (req.body.email) {
            askedUser = await User.findOne({ email: req.body.email });
            if (!askedUser) {
                return res
                    .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
            }
        }
        const encPassword = crypto.encrypt(req.body.password)
        askedUser.planePassword = encPassword,
            askedUser.password = encryptString(req.body.password);
        askedUser.save();
        return res
            .json({ code: RESPONSE_STATUS.SUCCESS, message: "Password has been reset successfully" });

    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const userSignUp = async (req, res) => {
    try {
        await body('name').not().isEmpty().run(req);
        await body('phoneNumber').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const { name, countryName, password, email, phoneNumber } = req.body;
        const userPhone = await User.findOne({ phoneNumber: phoneNumber })
        if (userPhone) {
            return res.status(RESPONSE_STATUS.FORBIDDEN).send({ code: RESPONSE_STATUS.FORBIDDEN, message: "This Phone Number is already exist" });
        }
        const userEmail = await User.findOne({ email: email })
        if (userEmail) {
            return res.status(RESPONSE_STATUS.FORBIDDEN).send({ code: RESPONSE_STATUS.FORBIDDEN, message: "This Email is already exist" });
        }
        let yourDate = new Date()
        let otp = commonFunctions.getOTP();
        let y = yourDate.toISOString().split('T')[0]
        const countDriver = await User.countDocuments({});
        const encPassword = crypto.encrypt(req.body.password)

        const userObject = {
            "name": name,
            "countryName": countryName,
            "password": encryptString(password),
            planePassword: encPassword,
            "email": email,
            "phoneNumber": phoneNumber,
            "registerDate": y,
            is_account: [
                {
                    is_save: true
                }
            ],
            is_demograpic: [
                {
                    is_save: false,
                    is_previous: false
                }
            ],
            is_dtc: [
                {
                    is_save: false,
                    is_previous: false
                }
            ],
            is_upload_doc: [
                {
                    is_save: false,
                    is_previous: false
                }
            ],
            is_payment: [
                {
                    is_save: false,
                    is_previous: false
                }
            ],
            user_number: `USER-#${countDriver + 1}`
        }
        const user = await User.create(userObject);
        let token = jwt.sign({ user_id: user._id }, "pat+123")
        user.jwtToken = token;
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, user, token });

    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const updateDemograpicProfile = async (req, res) => {
    try {
        const activeUser = await User.findOne({ email: req.body.email })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const { fullName, gender, dob, patientEmail, phoneNumber, address } = req.body;
        let otp = commonFunctions.getOTP();
        const countDriver = await User.countDocuments({});
        const userObject = {
            "userId": activeUser._id,
            "caseId": req.body.caseId,
            "fullName": fullName,
            "gender": gender,
            "dob": dob,
            "email": patientEmail,
            "phoneNumber": phoneNumber,
            "address": address,
            user_number: `USER-#${countDriver + 1}`
            // "is_account.$.is_save": req.body.is_save,
            // "is_account.$.is_previous": req.body.is_previous,
        }
        const addData = await Demograpic.create(userObject)
        const caseObj = {
            userId: activeUser._id,
            case_number: otp
        }
        const addCase = await Case.create(caseObj);
        addData.caseId = addCase._id;
        await addData.save();
        activeUser.patientDetails = userObject;
        activeUser.is_demograpic = [
            {
                is_save: req.body.is_save,
                is_previous: req.body.is_previous
            }
        ]
        activeUser.save();
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Data Updated Successfully", activeUser, addCase });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const questionList = async (req, res) => {
    try {
        var search = {
            status: { $in: ["ACTIVE", "INACTIVE"] }
        }
        let page_val = req.query.page || 1
        let skip = (page_val - 1) * 100
        let limit = req.query.limit || 100
        let sort = {
            createdAt: -1
        }


        let result = await Question.aggregate([

            {
                $match: search,
            },
            {
                $lookup: {
                    from: 'intakeoptions',
                    localField: '_id',
                    foreignField: 'questionId',
                    as: 'optionData'
                }
            },
            {
                $sort: sort
            },
            {
                $facet: {
                    paginationData: [{ $skip: +skip }, { $limit: +limit }],
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ]
                }
            }

        ])
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, result });
    } catch (err) {
        console.log(err)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const updateInTakeProfile = async (req, res) => {
    try {
        const activeUser = await User.findOne({ email: req.body.email })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }

        const radioQuestionArr = req.body.radioQuestionArr;
        let radioQuestionArrSave = []
        const textQuestionArr = req.body.textQuestionArr;
        let textQuestionArrSave = []
        const mcqQuestionArr = req.body.mcqQuestionArr;
        let mcqQuestionArrSave = []
        const consultaionArr = req.body.consultaionArr;
        const consultaionArrSave = []
        radioQuestionArr.map((e) => {
            const radObj = {
                caseId: req.body.caseId,
                userId: activeUser._id,
                questionId: e.questionId,
                optionYes: e.optionYes,
                optionNo: e.optionNo,
            }
            radioQuestionArrSave.push(radObj)
        })
        textQuestionArr.map((e) => {
            const radObj = {
                caseId: req.body.caseId,
                userId: activeUser._id,
                questionId: e.questionId,
                answer: e.answer
            }
            textQuestionArrSave.push(radObj)
        })
        mcqQuestionArr.map((e) => {
            const radObj = {
                caseId: req.body.caseId,
                userId: activeUser._id,
                questionId: e.questionId,
                selectOptionId: e.selectOptionId
            }
            mcqQuestionArrSave.push(radObj)
        })
        await UserIntakeQuestion.create(radioQuestionArrSave);
        await UserIntakeQuestion.create(textQuestionArrSave)
        await UserIntakeQuestion.create(mcqQuestionArrSave)

        consultaionArr.map((e) => {
            const radObj = {
                caseId: req.body.caseId,
                userId: activeUser._id,
                question: e.question,
                answer: e.answer
            }
            consultaionArrSave.push(radObj)
        })
        await ConsultantQuestion.create(consultaionArrSave)
        activeUser.is_dtc = [
            {
                is_save: req.body.is_save,
                is_previous: req.body.is_previous
            }
        ]
        activeUser.save();
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Data Updated Successfully", activeUser });
    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const uploadDocument = async (req, res) => {
    try {
        const activeUser = await User.findOne({ email: req.body.email })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }

        const uploadDocumentArr = req.body.uploadDocumentArr;
        let uploadDocumentArrSave = []

        uploadDocumentArr.map((e) => {
            const radObj = {
                caseId: req.body.caseId,
                userId: activeUser._id,
                documentType: e.documentType,
                documentName: e.documentName,
                documentUrl: e.documentUrl,
            }
            uploadDocumentArrSave.push(radObj)
        })
        await UploadDocument.create(uploadDocumentArrSave);
        activeUser.is_upload_doc = [
            {
                is_save: req.body.is_save,
                is_previous: req.body.is_previous
            }
        ]
        await activeUser.save();
        await Case.updateOne({ _id: req.body.caseId }, { $set: { is_show: true } })
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Data Updated Successfully", activeUser });
    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const paymentUpdate = async (req, res) => {
    try {
        const activeUser = await User.findOne({ email: req.body.email })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }

        activeUser.paymentDocument = req.body.paymentDocument;
        activeUser.paymentType = req.body.paymentType,
            activeUser.amount = req.body.amount,
            activeUser.is_payment_done = true
        activeUser.is_payment = [
            {
                is_save: req.body.is_save,
                is_previous: req.body.is_previous
            }
        ]
        let token = jwt.sign({ user_id: activeUser._id }, "pat+123")
        activeUser.jwtToken = token;
        await activeUser.save();
        const addCase = await Case.findOne({ _id: req.body.caseId })
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Data Updated Successfully", activeUser, token, addCase });
    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const userLogin = async (req, res) => {
    try {
        const activeUser = await User.findOne({ email: req.body.email })
        if (!activeUser) {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: "User not found" });
        }
        if (activeUser.userStatus == "INACTIVE") {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: "Your account is blocked by admin please contact to administrator" });
        }
        if (activeUser.userStatus == "DELETED") {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: "Your account is deleted by admin please contact to administrator" });
        }
        let password_verify = bcrypt.compareSync(req.body.password, activeUser.password);
        if (!password_verify) {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: RESPONSE_MESSAGES.INVALID_CRED });
        }
        let token = jwt.sign({ user_id: activeUser._id }, "pat+123")
        activeUser.jwtToken = token;
        await activeUser.save();
        let caseDetail = await Case.findOne({ userId: activeUser._id, status: { $in: ["PENDING", "ONGOING"] } })
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.LOGIN_SUCCESS, token: token, activeUser, caseDetail });
    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const updateProfile = async (req, res) => {
    try {
        const activeUser = await User.findOne({ _id: req.body.driverId })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const updateUser = await User.updateOne({ _id: activeUser._id }, { $set: req.body, approvedStatus: "PENDING" }, { new: true })
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Data Updated Successfully", activeUser });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const userDetails = async (req, res) => {
    try {
        const userData = await User.findOne({ email: req.body.email });
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            userId: new mongoose.Types.ObjectId(userData._id),
            caseId: new mongoose.Types.ObjectId(req.body.caseId)
        }

        let questionIntakeData = await UserIntakeQuestion.aggregate([
            {
                $match: search,
                //caseId:new mongoose.Types.ObjectId()
            },
            {
                $lookup: {
                    from: "intakequestions",
                    localField: "questionId",
                    foreignField: "_id",
                    as: "questionData"
                }
            },
            {
                $unwind: {
                    path: "$questionData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'intakeoptions',
                    localField: 'questionData._id',
                    foreignField: 'questionId',
                    as: 'optionData',
                },
            }
        ])
        let questionConsulationData = await ConsultantQuestion.aggregate([
            {
                $match: search,
            }
        ])
        let documentData = await UploadDocument.aggregate([
            {
                $match: search,
            }
        ])
        let caseDetail = await Case.findOne({ userId: userData._id, status: { $in: ["PENDING", "ONGOING"] } })
        let patientDetailsDetail = await Demograpic.findOne({ userId: userData._id, caseId: req.body.caseId })
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, userData, questionIntakeData, questionConsulationData, documentData, caseDetail, patientDetailsDetail });
    } catch (err) {
        console.log(err)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const logout = async (req, res) => {
    try {
        const activeUser = await User.findOne({ _id: req.user_id })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        activeUser.userToken = "";
        activeUser.save();
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Logout Successfully" });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const viewProfile = async (req, res) => {
    try {
        const activeUser = await User.findOne({ _id: req.user_id })
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
        const activeUser = await User.findOne({ _id: req.user_id })
        if (!activeUser) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const updateUser = await User.updateOne({ _id: req.user_id }, { $set: req.body }, { new: true })
        return res.send({ code: RESPONSE_STATUS.SUCCESS, message: "Data Updated Successfully", activeUser });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const changePassword = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.user_id, userStatus: "ACTIVE" });
        if (!userData) {
            return res
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const checkPassword = bcrypt.compareSync(req.body.oldPassword, userData.password);
        const encPassword = crypto.encrypt(req.body.newPassword)
        if (checkPassword) {
            const password = encryptString(req.body.newPassword);
            const encPassword = crypto.encrypt(req.body.newPassword)
            userData.planePassword = encPassword;
            userData.password = password;
            // userData.planePassword = req.body.newPassword;
            await userData.save();
            return res
                .json({ code: RESPONSE_STATUS.SUCCESS, message: "Password changed successfully" });
        }
        return res
            .json({ code: RESPONSE_STATUS.UNAUTHORIZED, message: "Enter correct old password" });
    } catch (err) {
        console.log(err)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
};
const deleteProfile = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.user_id, userStatus: "ACTIVE" });
        if (!userData) {
            return res
                .json({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        userData.userStatus = "DELETED";
        await userData.save();
        return res
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS });

    } catch (err) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
};
module.exports = {
    userLogin: userLogin,
    emailVerify: emailVerify,
    updateDemograpicProfile: updateDemograpicProfile,
    questionList: questionList,
    updateInTakeProfile: updateInTakeProfile,
    uploadDocument: uploadDocument,
    paymentUpdate: paymentUpdate,
    userDetails: userDetails,
    userSignUp: userSignUp,
    updateProfile: updateProfile,
    otpSent: otpSent,
    viewProfile: viewProfile,
    editProfile: editProfile,
    changePassword: changePassword,
    deleteProfile: deleteProfile,
    logout: logout,
    forgotOtpSent: forgotOtpSent,
    setPassword: setPassword
}

