const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            index: true,
            default: null,
        },

        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "project",
            index: true,
            default: null,
        },

        projectName: String,

        title: { type: String, required: true },
        message: String,

        type: {
            type: String,
            enum: ["info", "warning", "success", "error"],
            default: "info",
        },

        data: mongoose.Schema.Types.Mixed,

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },

        expiresAt: Date,
    },
    { timestamps: true }
);

/**
 * CONDITIONAL VALIDATION
 * - projectId → recipientId required
 */
notificationSchema.pre("validate", function (next) {
    if (this.projectId && !this.recipientId) {
        return next(
            new Error("recipientId is required when projectId is provided")
        );
    }
    next();
});

// indexes
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, projectId: 1 });
notificationSchema.index({
    isRead: 1,
    isDeleted: 1,
    updatedAt: 1,
});
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
