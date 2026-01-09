const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_TYPES } = require('../../constants');
const commonFunctions = require("../../commonFunctions")

const User = require('../../models/userModel');
const Projects = require('../../models/projectModel');
const Remark = require('../../models/projectRemarkModel');
const userNotification = require('../../models/userNotification');

const mongoose = require("mongoose");
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


function normalizeModel(model) {
    return model.toLowerCase().replace(/[\s-_]/g, '');
}

const projectCheck = async (req, res) => {
    try {
        await body('name').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedAdmin = await User.findOne({ _id: req.user_id });
        if (!askedAdmin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const { name, model } = req.body;
        const normalizedModel = normalizeModel(model);
        const project = await Projects.findOne({ userId: req.user_id, name, model: normalizedModel });
        if (project) {
            // Project exists for this user, same name, same model: suggest new version
            return res.status(402).send({
                code: 402,
                message: "You have already created a project with this name under the same model. Do you want to create a new version"
            });
        }
        // Otherwise: new project allowed
        return res.status(RESPONSE_STATUS.SUCCESS).json({
            code: RESPONSE_STATUS.SUCCESS,
            message: "This is new project"
        });
    } catch (error) {
        console.log(error)
        return res.status(RESPONSE_STATUS.SERVER_ERROR).json({
            message: RESPONSE_MESSAGES.SERVER_ERROR
        });
    }
}



const MODEL_STEPS = {
    objectdetection: [
        "labelled",
        "augmented",
        "images",
        "dataSplit",
        "HyperTune",
        "infer",
        "remark",
        "application",
    ],
    classification: [
        "labelled",
        "augmented",
        "images",
        "dataSplit",
        "HyperTune",
        "infer",
        "remark",
        "application",
    ],
    defectdetection: [
        "labelled",
        "HyperTune",
        "infer",
        "remark",
        "application",
    ],
};
const buildStepStatus = (model) => {
    const steps = MODEL_STEPS[model] || [];
    const stepStatus = {};

    steps.forEach((step) => {
        stepStatus[step] = {
            status: "pending",
            validation_errors: [],
            last_modified: new Date(),
        };
    });

    return stepStatus;
};


// const addProject = async (req, res) => {
//     try {
//         await body('name').not().isEmpty().run(req);
//         const errors = validationResult(req).formatWith(errorFormatter);
//         if (!errors.isEmpty()) {
//             return res.status(RESPONSE_STATUS.NOT_FOUND).send({
//                 code: RESPONSE_STATUS.NOT_FOUND,
//                 message: "Please check your request",
//                 errs: errors.array()
//             });
//         }

//         const askedAdmin = await User.findOne({ _id: req.user_id });
//         if (!askedAdmin) {
//             return res.status(RESPONSE_STATUS.NOT_FOUND).send({
//                 code: RESPONSE_STATUS.NOT_FOUND,
//                 message: RESPONSE_MESSAGES.NOT_FOUND
//             });
//         }

//         const { name, model, versionNumber } = req.body;
//         const normalizedModel = normalizeModel(model);
//         // Check if project with same userId, name, model, versionNumber already exists
//         const existingProject = await Projects.findOne({
//             userId: req.user_id,
//             name: name,
//             model: normalizedModel,
//             versionNumber: versionNumber
//         });

//         if (existingProject) {
//             return res.status(RESPONSE_STATUS.CONFLICT).send({
//                 code: RESPONSE_STATUS.CONFLICT,
//                 message: "This project already exists with the same version"
//             });
//         }

//         // IdGenerator to safely generate project_number
//         class IdGenerator {
//             constructor(prefix = '', start = 0) {
//                 this.prefix = prefix;
//                 this.currentId = Number(start) || 0;
//             }
//             generateId() {
//                 this.currentId++;
//                 return `${this.prefix}${this.currentId}`;
//             }
//         }

//         // Find the latest project_number issued, extract numeric portion safely
//         const lastProject = await Projects.find({ userId: req.user_id, status: { $in: ["ACTIVE", "INACTIVE"] } })
//             .sort({ createdAt: -1 })
//             .limit(1);

//         let prevId = 100;  // Default starting id
//         if (lastProject.length > 0) {
//             const lastProjectNumber = lastProject[0].project_number || '';
//             // Extract numeric part from project_number, e.g. "PROC101" -> 101
//             const numericPart = lastProjectNumber.replace(/\D/g, '');
//             prevId = parseInt(numericPart, 10) || 100;
//         }

//         const userIdGenerator = new IdGenerator('PROC', prevId);
//         const genId = userIdGenerator.generateId(); // e.g., PROC101

//         const newProjectData = {
//             name,
//             model: normalizedModel,
//             versionNumber,
//             userId: req.user_id,
//             project_number: genId,
//             status: "ACTIVE" // Or default as needed
//         };

//         const addedProject = await Projects.create(newProjectData);

//         return res.status(RESPONSE_STATUS.SUCCESS).json({
//             code: RESPONSE_STATUS.SUCCESS,
//             message: "Project added successfully",
//             data: addedProject
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(RESPONSE_STATUS.SERVER_ERROR).json({
//             message: RESPONSE_MESSAGES.SERVER_ERROR
//         });
//     }
// }

const addProject = async (req, res) => {
    try {
        await body('name').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({
                code: RESPONSE_STATUS.NOT_FOUND,
                message: "Please check your request",
                errs: errors.array()
            });
        }

        const askedAdmin = await User.findOne({ _id: req.user_id });
        if (!askedAdmin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({
                code: RESPONSE_STATUS.NOT_FOUND,
                message: RESPONSE_MESSAGES.NOT_FOUND
            });
        }

        const { name, model, versionNumber } = req.body;
        const normalizedModel = normalizeModel(model);
        // Check if project with same userId, name, model, versionNumber already exists
        const existingProject = await Projects.findOne({
            userId: req.user_id,
            name: name,
            model: normalizedModel,
            versionNumber: versionNumber
        });

        if (existingProject) {
            return res.status(RESPONSE_STATUS.CONFLICT).send({
                code: RESPONSE_STATUS.CONFLICT,
                message: "This project already exists with the same version"
            });
        }

        // IdGenerator to safely generate project_number
        class IdGenerator {
            constructor(prefix = '', start = 0) {
                this.prefix = prefix;
                this.currentId = Number(start) || 0;
            }
            generateId() {
                this.currentId++;
                return `${this.prefix}${this.currentId}`;
            }
        }

        // Find the latest project_number issued, extract numeric portion safely
        const lastProject = await Projects.find({ userId: req.user_id, status: { $in: ["ACTIVE", "INACTIVE"] } })
            .sort({ createdAt: -1 })
            .limit(1);

        let prevId = 100;  // Default starting id
        if (lastProject.length > 0) {
            const lastProjectNumber = lastProject[0].project_number || '';
            // Extract numeric part from project_number, e.g. "PROC101" -> 101
            const numericPart = lastProjectNumber.replace(/\D/g, '');
            prevId = parseInt(numericPart, 10) || 100;
        }

        const userIdGenerator = new IdGenerator('PROC', prevId);
        const genId = userIdGenerator.generateId(); // e.g., PROC101
        const stepsForModel = MODEL_STEPS[normalizedModel];
        if (!stepsForModel) {
            return res.status(RESPONSE_STATUS.BAD_REQUEST).json({
                code: RESPONSE_STATUS.BAD_REQUEST,
                message: "Invalid model type",
            });
        }

        const newProjectData = {
            name,
            model: normalizedModel,
            versionNumber,
            userId: req.user_id,
            project_number: genId,
            status: "ACTIVE",

            stepData: {
                current_step: stepsForModel[0], // first step
                overall_progress: 0,
                step_status: buildStepStatus(normalizedModel),
                last_sync: new Date(),
                sync_source: "node_service",
            },
        };

        const addedProject = await Projects.create(newProjectData);

        return res.status(RESPONSE_STATUS.SUCCESS).json({
            code: RESPONSE_STATUS.SUCCESS,
            message: "Project added successfully",
            data: addedProject
        });

    } catch (error) {
        console.error(error);
        return res.status(RESPONSE_STATUS.SERVER_ERROR).json({
            message: RESPONSE_MESSAGES.SERVER_ERROR
        });
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
        const user = await User.findOne({ _id: req.user_id })
        if (!user) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }

        const addRemr = {
            projectId: req.body.projectId,
            ovservation: req.body.ovservation,
            scopeOfImprovement: req.body.scopeOfImprovement,
            numOfTries: req.body.numOfTries,
            userId: req.user_id,
            date: req.body.date,
            hardwareSetting: req.body.hardwareSetting,
        }
        const addData = await Remark.create(addRemr);
        return res.status(RESPONSE_STATUS.SUCCESS).send({ code: RESPONSE_STATUS.SUCCESS, message: "Added Successfully", addData });

    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}
const getProjectForOpen = async (req, res) => {
    try {
        await body('name').not().isEmpty().run(req);
        const errors = validationResult(req).formatWith(errorFormatter);
        const errs = errors.array();
        if (!errors.isEmpty()) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: "Please check your request", errs });
        }
        const askedAdmin = await User.findOne({ _id: req.user_id })
        if (!askedAdmin) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).send({ code: RESPONSE_STATUS.NOT_FOUND, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        const askedProject = await Projects.findOne({ name: req.body.name, versionNumber: req.body.versionNumber })
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: "Data Found", askedProject })


    } catch (error) {
        console.log(error)
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
        const updatedUser = await User.updateOne({ _id: req.body.id }, { $set: { userStatus: req.body.status.toUpperCase() } })
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

const userList = async (req, res) => {
    try {
        const userData = await Admin.findOne({ _id: req.user_id });
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            userStatus: { $in: ["ACTIVE", "INACTIVE"] }
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
                "user_number": {
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
                "email": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            {
                "userName": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            {
                "phoneNumber": {
                    $regex: "^" + req.query.search,
                    $options: 'i'
                }
            },
            ]
        }
        const { startDate, endDate, timeframe } = req.query;

        // add search as per timing
        commonFunctions.searchAsPerDateTime(search, startDate, endDate, timeframe)
        let result = await User.aggregate([
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
const myProjectList = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.user_id })
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            status: { $in: ["ACTIVE", "INACTIVE"] },
            userId: new mongoose.Types.ObjectId(req.user_id)
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
        if (req.query.model) {
            search.userId = new mongoose.Types.ObjectId(req.user_id),
                search.model = req.query.model

        }
        const { startDate, endDate, timeframe } = req.query;

        // add search as per timing
        commonFunctions.searchAsPerDateTime(search, startDate, endDate, timeframe)
        let result = await Projects.aggregate([
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
                $group: {
                    _id: "$name",
                    doc: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$doc" }
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

const myLatestProjectList = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.user_id })
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            status: { $in: ["ACTIVE", "INACTIVE"] },
            userId: new mongoose.Types.ObjectId(req.user_id)
        }

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
        let result = await Projects.aggregate([
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
                $limit: 3
            },
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

const versionDropDown = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.user_id })
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            status: { $in: ["ACTIVE", "INACTIVE"] },
            userId: new mongoose.Types.ObjectId(req.user_id),
            name: req.query.name
        }
        let result = await Projects.aggregate([

            {
                $match: search,
            },
            {
                $project: { versionNumber: 1 }
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
const notificationList = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.user_id });
        if (!userData) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        let search = {
            userId: new mongoose.Types.ObjectId(req.user_id),
            status: { $in: ["ACTIVE", "INACTIVE"] },
        }
        let sort = {
            createdAt: -1
        }
        let result = await userNotification.aggregate([

            {
                $match: search,
            },

            {
                $lookup: {
                    from: "notifications",
                    localField: "notificationId",
                    foreignField: "_id",
                    as: "notificationData"
                }
            },
            {
                $unwind: {
                    path: "$notificationData",
                    preserveNullAndEmptyArrays: true
                }
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
    projectCheck,
    addProject,
    addRemark,
    getProjectForOpen,
    myProjectList,
    myLatestProjectList,
    versionDropDown,
    notificationList
    // userList,
    // statusChanged: statusChanged,
}