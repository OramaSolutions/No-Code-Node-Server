const { RESPONSE_MESSAGES, RESPONSE_STATUS, USER_TYPES } = require('../../constants');
const commonFunctions = require("../../commonFunctions")

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

const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user_id;

        const filter = {
            isDeleted: false,
            $or: [
                { recipientId: userId },   // personal notifications
                { recipientId: null },     // global/broadcast notifications
            ],
        };

        // optional project filter
        if (req.query.projectId) {
            filter.projectId = req.query.projectId;
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(20);

        return res.status(RESPONSE_STATUS.SUCCESS).json({
            code: RESPONSE_STATUS.SUCCESS,
            notifications,
        });
    } catch (err) {
        console.error(err);
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
};


const markAsRead = async (req, res) => {
    try {
        const userId = req.user_id;
        const notificationId = req.params.id;

        const updated = await Notification.updateOne(
            {
                _id: notificationId,
                recipientId: userId, // 🔐 security check
            },
            {
                $set: { isRead: true },
            }
        );

        if (updated.matchedCount === 0) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ message: "Notification not found" });
        }

        return res.status(RESPONSE_STATUS.SUCCESS).json({
            code: RESPONSE_STATUS.SUCCESS,
            message: "Notification marked as read",
        });
    } catch (err) {
        console.error(err);
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
};

const unreadCount = async (req, res) => {
    try {
        const userId = req.user_id;

        const count = await Notification.countDocuments({
            recipientId: userId,
            isRead: false,
        });

        return res.status(RESPONSE_STATUS.SUCCESS).json({
            code: RESPONSE_STATUS.SUCCESS,
            count,
        });
    } catch (err) {
        console.error(err);
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
};


module.exports = {
    markAsRead,
    getUserNotifications,
    unreadCount
}