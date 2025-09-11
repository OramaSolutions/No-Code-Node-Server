const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_TYPES } = require('../../constants');
const commonFunctions = require("../../commonFunctions")

const Admin = require('../../models/adminModel');

const mongoose = require("mongoose");
const Project = require('../../models/projectModel');
const Remark = require('../../models/projectRemarkModel');

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


const updateStatusCloseOpen = async (req, res) => {
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
        const updatedUser = await Project.updateOne({ _id: req.body.id }, { $set: { projectStatus: req.body.status.toUpperCase() } })
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
const approvedStatusChanged = async (req, res) => {
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
        const updatedUser = await Project.updateOne({ _id: req.body.id }, { $set: { approvedStatus: req.body.status.toUpperCase() } })
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

const projectList = async (req, res) => {
    try {
        const userData = await Admin.findOne({ _id: req.user_id });
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            status: { $in: ["ACTIVE", "INACTIVE"] }
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
                "userData.user_number": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            {
                "name": {
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
        if (req.query.userId) {
            search.userId = new mongoose.Types.ObjectId(req.query.userId)
        }
        const { startDate, endDate, timeframe } = req.query;

        // add search as per timing
        commonFunctions.searchAsPerDateTime(search, startDate, endDate, timeframe)
        let result = await Project.aggregate([
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
const addRemark = async (req, res) => {
    try {
        await body('projectId').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const user = await Admin.findOne({ _id: req.user_id })
        if (!user) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }

        const addRemr = {
            projectId: req.body.projectId,
            notes: req.body.notes,
            userId: req.user_id
        }
        const addData = await Remark.create(addRemr);
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Added Successfully", addData });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
module.exports = {
    updateStatusCloseOpen,
    approvedStatusChanged,
    projectList,
    addRemark,
}