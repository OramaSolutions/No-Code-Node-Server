const mongoose = require("mongoose");
const helpUser = new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    is_assign: { type: Boolean, default: false },
    userStatus: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
        default: "ACTIVE"
    },
    otp: { type: String },

}, {
    minimize: false,
    timestamps: true,
});
mongoose.model("helpUser", helpUser);
module.exports = mongoose.model("helpUser");




