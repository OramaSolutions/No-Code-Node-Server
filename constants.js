exports.USER_STATUS = {
    PENDING: "PENDING",
    ACTIVE: "ACTIVE",
    DELETED: "DELETED",
    BLOCKED: "BLOCKED",
    LOCKED: "LOCKED"
};
exports.USER_TYPES = {
    USER: "USER",
    ADMIN: "ADMIN"
};

exports.DEFAULT_PROFILE_PIC =
    "https://t3.ftcdn.net/jpg/03/46/83/96/360_F_346839683_6nAPzbhpSkIpb8pmAwufkC7c5eD7wYws.jpg";
exports.RESPONSE_STATUS = {
    GONE: 410,
    CREATED: 201,
    SUCCESS: 200,
    BAD_REQUEST: 400,
    SERVER_ERROR: 500,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    DUPLICATE: 402,
    NOT_FOUND: 404,
    CONFLICT: 409,
};

exports.RESPONSE_MESSAGES = {
    "USER_NOT_APPROVED": "YOUR ACOUNT IS NOT APPROVED",
    "SUCCESS": "Request Successful",
    "LOGIN_SUCCESS": "Login Successfully",
    "OTP_VERIFIED": "Otp verify successfully",
    "OTP_EXPIRED": "Otp expired",
    "INVALID_OTP": "Invalid Otp",
    "USER_NOT_VERIFIED_OR_DOES_NOT_EXISTS": "User not verfied or does not exists",
    "USER_NOT_VERIFIED": "User not verfied",
    "FAILURE": "Request Failed",
    "CONFLICT": "Request Conflicted",
    "PASS_MISMATCH": "Password not match",
    "SERVER_ERROR": "Server error occured",
    "NOT_VERIFIED": 'User not verified',
    "NOT_FOUND": "Resource not found",
    "TOKEN_NOT_FOUND": "No token provided.",
    "TOKEN_SESSION": "User session expired, Please log in again!",
    "DATA_FOUND": "Data found successfully",
    "PARAMETER_NOT_FOUND": "Parameter Missing",
    "INVALID_CRED": "Invalid credentials",
    "UNAUTHORIZED": "Request Unauthorized",
    "PHONE_ALREADY_EXIST": "This Phone Number is already exists",
    "PHONE_NOT_EXIST": "This Phone Number is not exists",
    "EMAIL_ALREADY_EXIST": "This Email is already exists",
    "USER_ALREADY_EXIST": "This UserName is already exists",
    "EMAIL_ALREADY_REGISTERED": "Already Registered",
    "EMAIL_NOT_REGISTERED": "Email Not Registered",
    "EMAIL_SENT": "check updated email",
    "BLOCKED_USER": "This user is inactive, Please contact to admin"

};

exports.distanceforPreBid = 20;