const mongoose = require("mongoose");
const projectRemark = new mongoose.Schema({
    projectId: { type: mongoose.Types.ObjectId },
    notes: { type: String },
    ovservation: { type: String },
    scopeOfImprovement: { type: String },
    numOfTries: { type: String },
    userId: { type: mongoose.Types.ObjectId },
    date: { type: Date },
    hardwareSetting: { type: String },
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
mongoose.model("projectRemark", projectRemark);
module.exports = mongoose.model("projectRemark");




