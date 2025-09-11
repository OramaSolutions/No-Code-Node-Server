const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_STATUS, USER_TYPES } = require('../../constants');
const bcrypt = require("bcryptjs");
const commonFunctions = require("../../commonFunctions")
const User = require('../../models/userModel');
const Help = require('../../models/helpAndSupportModel');
const jwt = require('jsonwebtoken');
var moment = require("moment");
const mongoose = require("mongoose");
var xlsx = require('node-xlsx').default
const fs = require('fs');
const {
    body,
    query,
    param,
    check,
    oneOf,
    validationResult
} = require('express-validator');
const { group } = require('console');
const errorFormatter = ({
    location,
    msg,
    param,
    value,
    nestedErrors
}) => {
    return `${location}[${param}]: ${msg}`;
};



const uploadDocumnet = async (req, res) => {
    try {
        const result = req
        const url = result.file.location
        if (result.file.location) {
            return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.LOGIN_SUCCESS, url });
        }
        else {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: "Error" });
        }
        // let result = req.files.files;
        // console.log("ddadaad", result)
    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}

const userLogin = async (req, res) => {
    try {
        const activeUser = await User.findOne({ userName: req.body.userName })
        if (!activeUser) {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: "User not found" });
        }
        let password_verify = bcrypt.compareSync(req.body.password, activeUser.password);
        if (!password_verify) {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).send({ code: RESPONSE_STATUS.UNAUTHORIZED, message: RESPONSE_MESSAGES.INVALID_CRED });
        }
        const secret = process.env.JWT_TOKEN_SECRET || 'orama_solutions';
        console.log('Secret Key in login>>>', secret);
        let token = jwt.sign({ user_id: activeUser._id }, secret)
        activeUser.jwtToken = token;
        await activeUser.save();
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // true - only over HTTPS(for production) flase - for locally
            sameSite: 'Lax', // Lax when backend and frontend are on different domains and can be strict if they are on the same domain.
            maxAge: 60 * 60 * 1000 // 1 hour, adjust as needed
        });
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.LOGIN_SUCCESS, token: token, activeUser });
    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}

const forgetEmail = async (req, res) => {
    try {
        await body('email').not().isEmpty().run(req);
        // response.log("Request  is=============>", req.body);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedUser = await User.findOne({ email: req.body.email })
        if (!askedUser) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Email does not exist" });
        }
        let otp = commonFunctions.getOTP();
        // const user = await User.create(otpObject)
        let token = jwt.sign({ user_id: askedUser._id }, process.env.JWT_TOKEN_SECRET || "orama_solutions")
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

const setPassword = async (req, res) => {
    try {
        const token = req.query.token
        let id
        jwt.verify(token, process.env.JWT_TOKEN_SECRET || 'orama_solutions', (err, decoded) => {
            console.log("decc", decoded)
            if (err) {
                return res
                    .status(RESPONSE_STATUS.UNAUTHORIZED)
                    .json({ message: RESPONSE_MESSAGES.TOKEN_SESSION })
            }
            id = decoded.user_id
        });
        let askedUser;
        askedUser = await User.findOne({ _id: id });
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
const addSupport = async (req, res) => {
    try {
        await body('subject').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedAdmin = await User.findOne({ _id: req.user_id })
        if (!askedAdmin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const { addressTo, subject, description, uploadFile, projectName, taskName, versionNumber } = req.body
        class IdGenerator {
            constructor(prefix = '', start = 0) {
                this.prefix = prefix;
                this.currentId = start;
            }
            generateId() {
                this.currentId++;
                return `${this.prefix}${this.currentId}`;
            }

        }
        let prevId;
        const findUser = await Help.find({}).sort({ createdAt: -1 }).limit(1);
        if (findUser.length > 0) {
            const findValue = findUser[0].reportNumber
            prevId = findValue.substr(4, findValue.length);
        }
        else {
            prevId = "100"
        }
        const userIdGenerator = new IdGenerator('HELP', prevId);
        const genId = userIdGenerator.generateId(); // User1001
        const catObject = {
            addressTo: addressTo,
            projectName: projectName,
            taskName: taskName,
            versionNumber: versionNumber,
            subject: subject,
            description: description,
            uploadFile: uploadFile,
            reportNumber: genId

        }

        const addBanner = await Help.create(catObject);
        let userName = askedAdmin.name;
        if (addBanner) {
            commonFunctions.sendPasswordMail(addressTo, subject, userName, description, taskName, versionNumber, projectName, `html`, async (otpErr, otpRes) => {
                if (otpErr) {
                    return res
                        .json({ code: RESPONSE_STATUS.SERVER_ERROR, message: RESPONSE_MESSAGES.SERVER_ERROR });
                }
                return res
                    .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, addBanner });
            });
        }
    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const changePassword = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.user_id });
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
module.exports = {
    userLogin: userLogin,
    forgetEmail,
    setPassword,
    viewProfile: viewProfile,
    editProfile: editProfile,
    deleteProfile: deleteProfile,
    logout: logout,
    addSupport,
    uploadDocumnet,
    changePassword
}

