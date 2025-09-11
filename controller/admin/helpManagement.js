const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_TYPES } = require('../../constants');
const commonFunctions = require("../../commonFunctions")

const Admin = require('../../models/adminModel');

const HelpUser = require('../../models/helpUserModel');
const mongoose = require("mongoose");
const Help = require('../../models/helpAndSupportModel');
const Note = require('../../models/notesModel');

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


const addUser = async (req, res) => {
    try {
        await body('name').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const user = await Admin.findOne({ _id: req.user_id })
        if (!user) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }

        const askedUser = await HelpUser.findOne({ email: req.body.email });
        if (askedUser) {
            return res.status(RESPONSE_STATUS.CONFLICT).send({ code: RESPONSE_STATUS.CONFLICT, message: RESPONSE_MESSAGES.EMAIL_ALREADY_EXIST });
        }
        const obj = {
            name: req.body.name,
            email: req.body.email
        }
        await HelpUser.create(obj)
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "User added Successfully" });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const helpUserDropDown = async (req, res) => {
    try {
        const user = await Admin.findOne({ _id: req.user_id })
        if (!user) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const askedUser = await HelpUser.find({});
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Data found Successfully", askedUser });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const assignHelp = async (req, res) => {
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
        const updatedUser = await Help.updateOne({ _id: req.body.id }, { $set: { status: "ASSIGN", assignTo: req.body.assignTo } })
        if (updatedUser.n == 0) {
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
        const updatedUser = await Help.updateOne({ _id: req.body.id }, { $set: { status: req.body.status.toUpperCase() } })
        if (updatedUser.n == 0) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Status Update Successfully", updatedUser });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}

const helpList = async (req, res) => {
    try {
        const userData = await Admin.findOne({ _id: req.user_id });
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
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
                "reportNumber": {
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
                "userDataphoneNumber": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            ]
        }
        const { startDate, endDate, timeframe } = req.query;

        // add search as per timing
        commonFunctions.searchAsPerDateTime(search, startDate, endDate, timeframe)
        let result = await Help.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData"
                }
            },
            {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "helpusers",
                    localField: "assignTo",
                    foreignField: "_id",
                    as: "assignData"
                }
            },
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
const addNote = async (req, res) => {
    try {
        await body('helpId').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const user = await Admin.findOne({ _id: req.user_id })
        if (!user) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const askedHelp = await Help.findOne({ _id: req.body.helpId })
        const obj = {
            helpId: req.body.helpId,
            time: req.body.time,
            date: req.body.date,
            userId: askedHelp.userId,
            note: req.body.note
        }
        await Note.create(obj);
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Note created successfully" });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}

const noteList = async (req, res) => {
    try {
        const userData = await Admin.findOne({ _id: req.user_id });
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            helpId: new mongoose.Types.ObjectId(req.query.helpId)
        }
        // if (req.query.status) {
        //     search.status = req.query.status
        // }

        let sort = {
            createdAt: -1
        }

        let result = await Note.aggregate([
            {
                $match: search,
            },
            {
                $sort: sort
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
module.exports = {
    addUser,
    helpUserDropDown,
    assignHelp,
    helpList,
    addNote,
    noteList,
    statusChanged: statusChanged,
}