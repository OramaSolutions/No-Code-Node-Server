const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_TYPES } = require('../../constants');
const commonFunctions = require("../../commonFunctions")

const Admin = require('../../models/adminModel');
const sanitizeHtml = require("sanitize-html");
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

exports.sanitizeRichText = (html) => {
    return sanitizeHtml(html, {
        allowedTags: [
            "p", "b", "i", "u", "strong", "em",
            "ul", "ol", "li",
            "a", "br"
        ],
        allowedAttributes: {
            a: ["href", "target", "rel"],
        },
        allowedSchemes: ["http", "https", "mailto"],
        transformTags: {
            a: sanitizeHtml.simpleTransform("a", {
                target: "_blank",
                rel: "noopener noreferrer",
            }),
        },
    });
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
        // console.log('user data in pro list', req.user_id)
        if (!userData) {
            console.log('no userdata')
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            status: { $in: ["ACTIVE", "INACTIVE"] }
        }
        // console.log('1', search)
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
            // console.log('2', search)
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
            { $unwind: "$userData" },

            { $match: search },

            {
                $group: {
                    _id: {
                        name: "$name",
                        model: "$model",
                        userId: "$userId"
                    },
                    projectName: { $first: "$name" },
                    model: { $first: "$model" },
                    userData: { $first: "$userData" },
                    createdAt: { $min: "$createdAt" },
                    updatedAt: { $max: "$updatedAt" },
                    versions: {
                        $push: {
                            _id: "$_id",
                            versionNumber: "$versionNumber",
                            fullItem: "$$ROOT"
                        }
                    }
                }
            },

            { $sort: { updatedAt: -1 } },

            {
                $facet: {
                    paginationData: [{ $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: "count" }]
                }
            }
        ]);

        // console.log('res in pro list', result)
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

// const addRemark = async (req, res) => {
//     try {
//         await body('projectId').not().isEmpty().run(req);
//         const errors = validationResult(req).formatWith(errorFormatter);
//         const errs = errors.array();
//         if (!errors.isEmpty()) {
//             return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
//         }
//         const user = await Admin.findOne({ _id: req.user_id })
//         if (!user) {
//             return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
//         }

//         const addRemr = {
//             projectId: req.body.projectId,
//             notes: req.body.notes,
//             userId: req.user_id
//         }
//         const addData = await Remark.create(addRemr);
//         return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Added Successfully", addData });

//     } catch (error) {
//         console.log('err', error)
//         return res
//             .status(RESPONSE_STATUS.SERVER_ERROR)
//             .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
//     }
// }

const addRemark = async (req, res) => {
    try {
        await body('projectId').notEmpty().run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).json({
                code: RESPONSE_STATUS.NOT_FOUND,
                message: "Please check your request",
                errors: errors.array(),
            });
        }

        const admin = await Admin.findById(req.user_id);
        if (!admin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).json({
                code: RESPONSE_STATUS.NOT_FOUND,
                message: RESPONSE_MESSAGES.NOT_FOUND,
            });
        }

        const {
            projectId,
            notes,
            observation,
            scopeOfImprovement,
            numOfTries,
            hardwareSetting,
            visible,
            date,
            userId
        } = req.body;

        const cleanNotes = sanitizeRichText(notes);

        const addRemr = {
            projectId,
            notes: cleanNotes,
            observation,
            scopeOfImprovement,
            numOfTries,
            hardwareSetting,
            visible,
            userId,
            addedBy: req.user_id,
            date: date || new Date(),
            status: "ACTIVE",
        };

        const addData = await Remark.create(addRemr);

        return res.status(RESPONSE_STATUS.SUCCESS).json({
            code: RESPONSE_STATUS.SUCCESS,
            message: "Added Successfully",
            addData,
        });

    } catch (error) {
        console.error("addRemark error:", error);
        return res.status(RESPONSE_STATUS.SERVER_ERROR).json({
            message: RESPONSE_MESSAGES.SERVER_ERROR,
        });
    }
};

const getProjectRemarks = async (req, res) => {
    try {
        const { projectId } = req.query;;

        if (!projectId) {
            return res.status(400).json({
                code: 400,
                message: "projectId is required",
            });
        }

        // Optional: role-based visibility
        // If req.user_role !== 'ADMIN', show only visible remarks
        const filter = {
            projectId,
            status: "ACTIVE",
            visible: true,
        };


        const remarks = await Remark.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            code: 200,
            message: "Remarks retrieved successfully",
            remarks,
        });

    } catch (error) {
        console.error("getProjectRemarks error:", error);
        return res.status(500).json({
            code: 500,
            message: "Server error",
        });
    }
};


module.exports = {
    updateStatusCloseOpen,
    approvedStatusChanged,
    projectList,
    addRemark,
    getProjectRemarks
}