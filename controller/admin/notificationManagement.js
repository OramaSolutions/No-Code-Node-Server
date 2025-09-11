const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_TYPES } = require('../../constants');
const commonFunctions = require("../../commonFunctions")

const Admin = require('../../models/adminModel');

const mongoose = require("mongoose");
const Project = require('../../models/projectModel');

const User = require('../../models/userModel');
const Notification = require('../../models/notificationModel');
const userNotification = require('../../models/userNotification');
var xlsx = require('node-xlsx').default
const fs = require('fs');
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

const addNotification = async (req, res) => {
    try {
        await body('title').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedAdmin = await Admin.findOne({ _id: req.user_id })
        if (!askedAdmin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const { title, content, userType, sendStatus } = req.body
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
        const findUser = await Notification.find({}).sort({ createdAt: -1 }).limit(1);
        if (findUser.length > 0) {
            const findValue = findUser[0].noti_number
            const regex = /\d{3}$/
            const result1 = findValue.match(regex)
            prevId = result1[0];
        }
        else {
            prevId = "100"
        }
        const userIdGenerator = new IdGenerator('NOT', prevId);
        const genId = userIdGenerator.generateId(); // User1001
        let userIds = []
        if (req.body.userType == "All") {
            const askedData = await User.find({});
            askedData.map((e) => {
                userIds.push(e._id)
            })
        }
        else if (req.body.userType == "Single") {
            const askedData = await User.findOne({ _id: req.body.userId });
            console.log("aa", askedData)
            userIds.push(askedData._id)
        }
        const catObject = {
            title: title,
            content: content,
            userType: userType,
            sendStatus: sendStatus,
            users: userIds,
            noti_number: genId

        }
        const addBanner = await Notification.create(catObject);
        let notArr = [];
        for (let i of userIds) {
            let obj = {
                userId: i,
                notificationId: addBanner._id
            }
            notArr.push(obj);
        }
        await userNotification.create(notArr);
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: "Notification added successfully", addBanner })

    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const notificationList = async (req, res) => {
    try {
        const userData = await Admin.findOne({ _id: req.user_id });
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            status: { $in: ["ACTIVE", "INACTIVE"] },
        }
        // if (req.query.status) {
        //     search.status = req.query.status
        // }
        let page_val = req.query.page || 1
        let skip = (page_val - 1) * 10
        let limit = req.query.limit || 10
        let sort = {
            createdAt: -1
        }

        if (req.query.search) {
            search.$or = [{
                "noti_number": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            {
                "title": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            {
                "userData.email": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            {
                "userData.name": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            {
                "userData.phoneNumber": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            ]
        }
        const { startDate, endDate, timeframe } = req.query;

        // add search as per timing
        commonFunctions.searchAsPerDateTime(search, startDate, endDate, timeframe)
        let result = await Notification.aggregate([

            {
                $match: search,
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
const editNotification = async (req, res) => {
    try {
        await body('id').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const user = await Admin.findOne({ _id: req.user_id })
        if (!user) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const updatedUser = await Notification.findOneAndUpdate({ _id: req.body.id }, { $set: req.body })
        if (!updatedUser) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Status Update Successfully", updatedUser });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const statusChanged = async (req, res) => {
    try {
        await body('id').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const user = await Admin.findOne({ _id: req.user_id })
        if (!user) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const updatedUser = await Notification.deleteOne({ _id: req.body.id })
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Deleted Successfully", updatedUser });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}


const resendNotification = async (req, res) => {
    try {
        await body('id').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedAdmin = await Admin.findOne({ _id: req.user_id })
        if (!askedAdmin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }

        const findUser = await Notification.findOne({ _id: req.body.id })
        let notArr = [];
        for (let i of findUser.users) {
            let obj = {
                userId: i,
                notificationId: findUser._id
            }
            notArr.push(obj);
        }
        await userNotification.create(notArr);
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: "Notification resend successfully", findUser })

    } catch (error) {
        console.log(error)
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}

module.exports = {
    addNotification,
    editNotification,
    notificationList,
    resendNotification,
    statusChanged: statusChanged
}