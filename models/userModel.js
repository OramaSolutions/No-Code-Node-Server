// const mongoose = require("mongoose");
// const { encryptString } = require("../commonFunctions")
// const user = new mongoose.Schema({
//     user_number: { type: String },
//     name: { type: String },
//     email: { type: String },
//     phoneNumber: { type: String },
//     userName: { type: String },
//     password: { type: String },
//     profilePic: { type: String, default: "" },
//     jwtToken: {
//         type: String
//     },
//     userStatus: {
//         type: String,
//         enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
//         default: "ACTIVE"
//     },
//     otp: { type: String },

// }, {
//     minimize: false,
//     timestamps: true,
// });
// mongoose.model("user", user);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        user_number: { type: String },

        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phoneNumber: { type: String, required: true },
        userName: { type: String, required: true, unique: true },

        city: { type: String },
        company: { type: String },
        designation: { type: String },
        usageFor: { type: String },

        password: { type: String },
        profilePic: { type: String, default: "" },

        tokenVersion: {
            type: Number,
            default: 0,
        },

        userStatus: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
            default: "PENDING"   // ✅ signups start as PENDING until password is set
        },

        // ✅ Signup / security
        passwordSetupToken: { type: String },
        passwordSetupExpiry: { type: Date },

        // ✅ Trial control
        trialExpiresAt: { type: Date },
        isTrialExpired: { type: Boolean, default: false },

        otp: { type: String }
    },
    {
        minimize: false,
        timestamps: true,
    }
);

module.exports = mongoose.model("user", userSchema);

const UserModel = mongoose.model("user");
module.exports = mongoose.model("user");

UserModel.findOne({}).then(user => {

    if (!user) {

        new UserModel({
            user_number: "USR001",
            name: "Test User",
            email: "testuser@yopmail.com",
            phoneNumber: "+911234567890",
            userName: "testuser",
            password: encryptString('user@123'),
            profilePic: "https://res.cloudinary.com/demo/image/upload/v1584446275/user_sample.jpg",
            jwtToken: "", // Optional, can leave empty
            userStatus: "ACTIVE",
            otp: "123456"
        }).save().then((savedUser) => {
            console.log("User created successfully");
            console.log("User data is==========>", savedUser);
        }).catch((error) => {
            console.log("Error in creating user:", error);
        });

    }

}).catch(error => {
    console.log("Error during user lookup:", error);
});


