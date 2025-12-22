const mongoose = require('mongoose')
const { encryptString } = require("../commonFunctions")
const Admin = new mongoose.Schema({
    roleId: {
        type: mongoose.Types.ObjectId
    },
    subadmin_Id: {
        type: String
    },
    name: {
        type: String
    },
    userName: {
        type: String
    },
    password: {
        type: String
    },
    plainPassword: {
        type: String
    },
    driver_number: {
        type: Number,
        default: 100
    },
    profilePic: {
        type: String,
        default: "https://res.cloudinary.com/a2karya80559188/image/upload/v1584446275/admin_nke1cg.jpg"
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Others'],
        default: 'Male'
    },
    userType: {
        type: String,
        enum: ['ADMIN', 'SUBADMIN', "STAFF"],
        default: 'ADMIN'
    },
    adminId: { type: mongoose.Types.ObjectId },
    staff_number: { type: String },
    phoneNumber: { type: String },
    email: { type: String },
    designation: { type: String },
    address: { type: String },
    permission: [
        {
            name: { type: String },
            read: { type: Boolean, default: false },
            fullAccess: { type: Boolean, default: false },
            approve_disapprove: { type: Boolean, default: false },
            //fullAccess: { type: Boolean, default: false }
        }
    ],
    jwtToken: {
        type: String
    },
    otp: {
        type: String
    },
    otpTime: { type: Date },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
        default: 'ACTIVE'
    }

}, {
    timestamps: true
})


const AdminModel = mongoose.model('admins', Admin, 'admins');
module.exports = AdminModel


AdminModel.findOne({}).then(success => {

    if (!success) {

        new AdminModel({
            email: "aditya@oramasolutions.in",
            password: encryptString('aditya@123'),
            profilePic: "https://res.cloudinary.com/a2karya80559188/image/upload/v1584446275/admin_nke1cg.jpg"
        }).save().then((success) => {

            console.log("Admin created successfully");
            console.log("Admin data is==========>", success);

        }).catch((error) => {
            if (error) {
                console.log("Error in creating admin");
            }
        })

    }

}).catch(error => {
    if (error) {
        console.log("Error");
    }
})