const mongoose = require("mongoose");
const notification = new mongoose.Schema({
    noti_number: { type: String },
    title: { type: String },
    content: { type: String },
    userType: { type: String },
    users: { type: Array },
    sendStatus: { type: String, enum: ["DRAFT", "SEND"] },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
        default: "ACTIVE"
    },

}, {
    minimize: false,
    timestamps: true,
});
mongoose.model("notification", notification);
module.exports = mongoose.model("notification");




