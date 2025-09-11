//const NOTIFICATONS = require("../models/notificationModel");
//const USER = require('../models/userModel')
const {
    RESPONSE_MESSAGES,
    RESPONSE_STATUS,
    USER_STATUS,
    USER_TYPES,
    distanceforPreBid,
} = require("../constants");
//const response = require("../utility/httpResponseMessage");

var admin = require("firebase-admin");
var serviceAccount = require("../config/firebase-config.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = {

    chatNotification: async (req, res) => {
        console.log(req.title, req.content, req.token)
        try {

            const message = {
                notification: {
                    title: req.title,
                    body: req.content,
                    // data : req.data
                },
                data: {
                    title: req.title,
                    body: req.content,
                    sender: req.sender,
                    reciever: req.reciever,
                    roomId: req.roomId,
                    chatType: req.chatType,
                    msgType: req.msgType,
                    reciverProfilePic: req.reciverProfilePic,
                    reciverRole: req.reciverRole,
                    reciverProfileName: req.reciverProfileName,
                    reciverPhoneNo: req.reciverPhoneNo,
                    senderProfilePic: req.senderProfilePic,
                    senderRole: req.senderRole,
                    senderProfileName: req.senderProfileName,
                    senderPhoneNo: req.senderPhoneNo,
                    type: 'New_Chat_Mesg',
                },
                android: {
                    notification: {
                        icon: 'stock_ticker_update',
                        color: '#7e55c3'
                    }
                },
                token: req.token
            };
            admin.messaging().send(message)
                .then(async (response) => {
                    // if(req.notiCategory == 'running_noti'){
                    //     let customerNotiUpdate = await USER.findOneAndUpdate({
                    //         _id: req.user
                    //     }, {
                    //         $inc: {
                    //             notiCount: 1
                    //         }
                    //     })
                    // }
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        } catch (error) {
            console.log(error)
            return response.responseHandlerWithMessage(res, 500, error);
        }
    },
    appNotification: async (req, res) => {
        try {

            message = {
                notification: {
                    title: req.title,
                    body: req.notiMessage,
                    // data : req.data
                },
                data: {
                    notiTo: req.notiTo.toString(),
                    title: req.title,
                    body: req.notiMessage, 
                    type: req.type,
                    jsonData: req.jsonData
                    // data: req.data
                },
                android: {
                    notification: {
                        icon: 'stock_ticker_update',
                        color: '#7e55c3'
                    }
                },
                token: req.token
            };
            admin.messaging().send(message)
                .then(async (response) => {
                    // if(req.notiCategory == 'running_noti'){
                    //     let customerNotiUpdate = await USER.findOneAndUpdate({
                    //         _id: req.user
                    //     }, {
                    //         $inc: {
                    //             notiCount: 1
                    //         }
                    //     })
                    // }
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        } catch (error) {
            console.log(error)
            return res
                .status(RESPONSE_STATUS.SERVER_ERROR)
                .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
        }
    },
    appNotification2: async (req, res) => {
        try {

            const message = {
                notification: {
                    title: req.title,
                    body: req.notiMessage,
                    // data : req.data
                },
                data: {
                    // notiTo: req.user,
                    user: req.user.toString(),
                    title: req.title,
                    body: req.content,
                    // visitorName: req.visitorName,
                    // mobileNumber: req.mobileNumber,
                    // address: req.address,
                    // note: req.note,
                    // photo: req.photo,
                    // flatName: req.flatName,
                    // visitCategoryName: req.visitCategoryName,
                    type: req.type
                    // data: req.data
                },
                android: {
                    notification: {
                        icon: 'stock_ticker_update',
                        color: '#7e55c3'
                    }
                },
                token: req.token
            };
            admin.messaging().send(message)
                .then(async (response) => {
                    // if(req.notiCategory == 'running_noti'){
                    //     let customerNotiUpdate = await USER.findOneAndUpdate({
                    //         _id: req.user
                    //     }, {
                    //         $inc: {
                    //             notiCount: 1
                    //         }
                    //     })
                    // }
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        } catch (error) {
            console.log(error)
            return response.responseHandlerWithMessage(res, 500, error);
        }
    },
    billNotification: async (req, res) => {
        try {
            let message
            if (req.deviceType == "android") {
                message = {
                    data: {
                        // notiTo: req.user,
                        notiTo: req.notiTo.toString(),
                        title: req.title,
                        body: req.notiMessage,
                        manager: req.manager.toString(),
                        billId: req.billId.toString(),
                        // visitorName: req.visitorName,
                        // mobileNumber: req.mobileNumber,
                        // address: req.address,
                        // note: req.note,
                        // photo: req.photo,
                        // flatName: req.flatName,
                        // visitCategoryName: req.visitCategoryName,
                        type: req.type
                        // data: req.data
                    },
                    android: {
                        notification: {
                            icon: 'stock_ticker_update',
                            color: '#7e55c3'
                        }
                    },
                    token: req.token
                }
            }
            message = {
                notification: {
                    title: req.title,
                    body: req.notiMessage,
                    // data : req.data
                },
                data: {
                    // notiTo: req.user,
                    notiTo: req.notiTo.toString(),
                    title: req.title,
                    body: req.notiMessage,
                    manager: req.manager.toString(),
                    billId: req.billId.toString(),
                    // visitorName: req.visitorName,
                    // mobileNumber: req.mobileNumber,
                    // address: req.address,
                    // note: req.note,
                    // photo: req.photo,
                    // flatName: req.flatName,
                    // visitCategoryName: req.visitCategoryName,
                    type: req.type
                    // data: req.data
                },


            };
            admin.messaging().send(message)
                .then(async (response) => {
                    // if(req.notiCategory == 'running_noti'){
                    //     let customerNotiUpdate = await USER.findOneAndUpdate({
                    //         _id: req.user
                    //     }, {
                    //         $inc: {
                    //             notiCount: 1
                    //         }
                    //     })
                    // }
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        } catch (error) {
            console.log(error)
            return response.responseHandlerWithMessage(res, 500, error);
        }
    },
    adminSendNotification: async (req, res) => {
        try {
            let getRegistrationToken = await USER.find({
                deviceToken: {
                    $ne: ''
                },
                status: "Active",
            });
            console.log('registrationToken--------------------------------------------------------------->', getRegistrationToken.length)
            if (getRegistrationToken && getRegistrationToken.length > 0) {
                for (let i = 0; i < getRegistrationToken.length; i++) {

                    const newNotifications = new NOTIFICATONS({
                        notiTo: getRegistrationToken[i]._id,
                        notiTitle: req.notiTitle,
                        notiMessage: req.notiMessage,
                        for: 'user'
                    })
                    let saveNotifications = await newNotifications.save()

                    const message = {
                        notification: {
                            title: req.notiTitle,
                            body: req.notiMessage
                        },
                        data: {
                            title: req.notiTitle,
                            body: req.notiMessage,
                            // data: req.data
                        },
                        android: {
                            notification: {
                                icon: 'stock_ticker_update',
                                color: '#7e55c3'
                            }
                        },
                        token: getRegistrationToken[i].deviceToken
                    };
                    admin.messaging().send(message)
                        .then(async (response) => {
                            console.log('Successfully sent message:', response);
                        })
                        .catch((error) => {
                            console.log('Error sending message:', error);
                        })
                }
            }
        } catch (error) {
            console.log(error)
            return response.responseHandlerWithMessage(res, 500, error);
        }
    },

    adminNotification: async (req, res) => {
        try {
            const message = {
                notification: {
                    title: req.title,
                    body: req.content,
                    // data : req.data
                },
                data: {
                    title: req.title,
                    body: req.content,
                    data: req.data
                },
                android: {
                    notification: {
                        icon: 'stock_ticker_update',
                        color: '#7e55c3'
                    }
                },
                token: req.token
            };
            admin.messaging().send(message)
                .then(async (response) => {
                    const newNotifications = new NOTIFICATONS({
                        notiTo: req.user,
                        notiMessage: req.content,
                        notiTitle: req.title,
                        data: req.data,
                        type: req.type,
                        type: req.type,
                        for: 'adminNotiList'
                    })
                    let saveNotifications = await newNotifications.save()
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        } catch (error) {
            console.log(error)
            return response.responseHandlerWithMessage(res, 500, error);
        }
    },

    storeNotification: async (req, res) => {
        try {
            const message = {
                notification: {
                    title: req.title,
                    body: req.content,
                    // data : req.data
                },
                data: {
                    title: req.title,
                    body: req.content,
                    data: req.data
                },
                android: {
                    notification: {
                        icon: 'stock_ticker_update',
                        color: '#7e55c3'
                    }
                },
                token: req.token
            };
            admin.messaging().send(message)
                .then(async (response) => {
                    const newNotifications = new NOTIFICATONS({
                        notiTo: req.user,
                        notiMessage: req.content,
                        notiTitle: req.title,
                        data: req.data,
                        type: req.type,
                        store: req.store,
                        for: 'store',
                    })
                    let saveNotifications = await newNotifications.save()
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        } catch (error) {
            console.log(error)
            return response.responseHandlerWithMessage(res, 500, error);
        }
    },

    appRunningNotification: async (req, res) => {
        try {
            const message = {
                notification: {
                    title: req.title,
                    body: req.content,
                    // data : req.data
                },
                data: {
                    title: req.title,
                    body: req.content,
                    data: req.data
                },
                android: {
                    notification: {
                        icon: 'stock_ticker_update',
                        color: '#7e55c3'
                    }
                },
                token: req.token
            };
            admin.messaging().send(message)
                .then(async (response) => {
                    // const newNotifications = new NOTIFICATONS({
                    //     notiTo: req.user,
                    //     notiMessage: req.content,
                    //     notiTitle: req.title,
                    //     data: req.data,
                    //     type:req.type,
                    //     for: 'user'
                    // })
                    // let saveNotifications = await newNotifications.save()
                    // if(req.notiCategory == 'running_noti'){
                    let customerNotiUpdate = await USER.findOneAndUpdate({
                        _id: req.user
                    }, {
                        $inc: {
                            notiCount: 1
                        }
                    })
                    // }
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        } catch (error) {
            console.log(error)
            return response.responseHandlerWithMessage(res, 500, error);
        }
    },




}



