const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_TYPES } = require('../../constants');
const commonFunctions = require("../../commonFunctions")

const Admin = require('../../models/adminModel');

const mongoose = require("mongoose");
const Project = require('../../models/projectModel');

const User = require('../../models/userModel');
const Notification = require('../../models/notificationModel');
// const userNotification = require('../../models/userNotification');
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
        const admin = await Admin.findById(req.user_id);
        if (!admin) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        let {
            recipientId,
            projectId,
            projectName,
            title,
            message,
            type,
            data,
        } = req.body;

        if (!projectId) projectId = null;
        if (!recipientId) recipientId = null;
        if (!projectName) projectName = null;

        // Rule enforcement
        if (projectId && !recipientId) {
            return res.status(400).json({
                message: "recipientId is required when projectId is provided",
            });
        }
        if (recipientId && !mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ message: "Invalid recipientId" });
        }

        if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid projectId" });
        }

        const notification = await Notification.create({
            recipientId,
            projectId,
            projectName,
            title,
            message,
            type,
            data,
        });

        return res.status(200).json({
            message: "Notification sent successfully",
            notification,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};


const adminNotificationList = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user_id);
        if (!admin) {
            return res.status(RESPONSE_STATUS.UNAUTHORIZED).json({
                message: RESPONSE_MESSAGES.UNAUTHORIZED,
            });
        }

        const {
            page = 1,
            limit = 10,
            projectId,
            recipientId,
            isRead,
            search,
        } = req.query;

        const filter = {};

        if (projectId) filter.projectId = projectId;
        if (recipientId) filter.recipientId = recipientId;
        if (isRead !== undefined) filter.isRead = isRead === "true";

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
                { projectName: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .populate("recipientId", "name email")
                .populate("projectId", "name")
                .sort({ createdAt: -1 })
                .skip(Number(skip))
                .limit(Number(limit)),
            Notification.countDocuments(filter),
        ]);

        return res.status(RESPONSE_STATUS.SUCCESS).json({
            code: RESPONSE_STATUS.SUCCESS,
            data: notifications,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(RESPONSE_STATUS.SERVER_ERROR).json({
            message: RESPONSE_MESSAGES.SERVER_ERROR,
        });
    }
};

const softDeleteOldReadNotifications = async () => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 1); // 1 month old

        const result = await Notification.updateMany(
            {
                isRead: true,
                isDeleted: false,
                updatedAt: { $lt: cutoffDate },
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            }
        );

        console.log(
            `[CRON] Soft-deleted ${result.modifiedCount} notifications`
        );
    } catch (err) {
        console.error("[CRON] Notification cleanup failed", err);
    }
};


module.exports = {
    addNotification,
    adminNotificationList,
    softDeleteOldReadNotifications
}