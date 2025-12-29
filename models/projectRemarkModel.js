const mongoose = require("mongoose");
const projectRemark = new mongoose.Schema({
    projectId: { type: mongoose.Types.ObjectId, required: true },

    notes: { type: String },

    observation: { type: String },
    scopeOfImprovement: { type: String },
    numOfTries: { type: String },

    visible: {                  
        type: Boolean,
        default: false,
    },

    userId: { type: mongoose.Types.ObjectId, required: true },

    date: { type: Date },

    hardwareSetting: { type: String },

    addedBy: { type: String },

    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
        default: "ACTIVE",
    },
}, {
    minimize: false,
    timestamps: true,
});
mongoose.model("projectRemark", projectRemark);
module.exports = mongoose.model("projectRemark");

