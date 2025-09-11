const mongoose = require("mongoose");
const userNotification = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId },
    notificationId: { type: mongoose.Types.ObjectId },
    readStatus: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
        default: "ACTIVE"
    },

}, {
    minimize: false,
    timestamps: true,
});
mongoose.model("userNotification", userNotification);
module.exports = mongoose.model("userNotification");




