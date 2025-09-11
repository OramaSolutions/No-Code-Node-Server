const mongoose = require('mongoose');
const { type } = require('os');
const schema = mongoose.Schema;
let staticContent = new schema(
    {
        title:
        {
            type: String
        },
        description:
        {
            type: String
        },
        Fee:
        {
            type: Number
        },
        facebookLink: { type: String },
        instagramLink: { type: String },
        twiterLink: { type: String },
        linkedinLink: { type: String },
        snapchatLink: { type: String },
        tiktokLink: { type: String },
        status: {
            type: String,
            enum: ["ACTIVE", "BLOCK", 'DELETE'],
            default: "ACTIVE"
        },
        type:
        {
            type: String,
            default: 'NONE'
        },

    },
    { timestamps: true }
);
const staticModel = mongoose.model('staticContents', staticContent, 'staticContents');
module.exports = staticModel

//-----------------------Term and condition-----------------------
staticModel.findOne({}).then(success => {

    if (!success) {
        new staticModel({
            'title': "Term And Condition",
            'description': "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
            'type': "TERMS",
        }).save().then((success) => {

            console.log("static Content successfully");
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
//================================About Us=======================
staticModel.findOne({}).then(success => {

    if (!success) {
        new staticModel({
            'title': "About Us",
            'description': "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
            'type': "ABOUT",
        }).save().then((success) => {

            console.log("static Content successfully");
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
//================================Privacy Policy=======================

staticModel.findOne({}).then(success => {

    if (!success) {
        new staticModel({
            'title': "Privacy Policy",
            'description': "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
            'type': "PRIVACY",
        }).save().then((success) => {

            console.log("static Content successfully");
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


//=================================Contact Us===========================
staticModel.findOne({}).then(success => {

    if (!success) {
        new staticModel({
            'title': "Contact Us",
            'description': "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
            'type': "CONTACT",
        }).save().then((success) => {

            console.log("static Content successfully");
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

