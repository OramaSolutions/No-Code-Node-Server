const mongoose = require("mongoose");
const notes = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId },
    helpId: { type: mongoose.Types.ObjectId },
    note: { type: String },
    time: { type: String },
    date: { type: String },
    addedBy: { type: String },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
        default: "ACTIVE"
    },

}, {
    minimize: false,
    timestamps: true,
});
mongoose.model("notes", notes);
module.exports = mongoose.model("notes");




