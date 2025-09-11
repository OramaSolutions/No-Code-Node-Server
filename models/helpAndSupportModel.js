const mongoose = require('mongoose');
const schema = mongoose.Schema;
let help = new schema(
    {
        reportNumber:
        {
            type: String
        },
        userId:
        {
            type: mongoose.Types.ObjectId
        },
        assignTo:
        {
            type: mongoose.Types.ObjectId
        },
        addressTo:
        {
            type: String
        },
        subject:
        {
            type: String
        },
        description: { type: String },
        uploadFile: { type: String },
        status: {
            type: String,
            enum: ["PENDING", "BLOCKED", 'DELETED', "SOLVED", "ASSIGN"],
            default: "PENDING"
        },
    },
    { timestamps: true }
);
module.exports = mongoose.model("help", help);

