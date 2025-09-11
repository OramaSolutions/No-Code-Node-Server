const jwt = require("jsonwebtoken");


const Admin = require("./../models/adminModel");

const {
    RESPONSE_STATUS,
    RESPONSE_MESSAGES
} = require("../constants");

function verifyToken(req, res, next) {
    try {
        // console.log('Reqest Header>>>>', req.headers)
        token = req.headers["authorization"];
        // console.log(token)
        if (!token) {
            return res
                .status(RESPONSE_STATUS.UNAUTHORIZED)
                .json({ message: RESPONSE_MESSAGES.TOKEN_NOT_FOUND });
        }
        // console.log("token", token)
        // console.log('sec', process.env.JWT_TOKEN_SECRET)
        const secret = process.env.JWT_TOKEN_SECRET || 'orama_solutions';
        token = token.split(" ");
        token = token.length > 1 ? token[1] : token[0];
        // console.log('token>>', token)
        jwt.verify(token, secret, (err, decoded) => {
            console.log("decc???????", decoded)
            if (err) {
                console.log("err", err)
                return res
                    .status(RESPONSE_STATUS.UNAUTHORIZED)
                    .json({ message: RESPONSE_MESSAGES.TOKEN_SESSION })
            }
            req.user_id = decoded.user_id

            //req.user_type = decoded.user_type
            //req.email = decoded.email
            //req.profile_pic = decoded.profile_pic || ''
            next();
        });
    } catch (error) {
        console.error("verify token function :", error);
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }
}


exports.verifyToken = verifyToken;


