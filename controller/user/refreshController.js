const jwt = require('jsonwebtoken');
const User = require('../../models/userModel');
const { createAccessToken, createRefreshToken } = require('../../auth/tokens');

const refresh = async (req, res) => {
    const token = req.cookies.refresh_token;
    if (!token) return res.sendStatus(401);
    console.log("REFRESH TOKEN>>>", token)

    let payload;
    try {
        payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        console.log('payload mismatch 1')
        return res.sendStatus(401);
    }

    const user = await User.findById(payload.user_id);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
        console.log('no user or no token versin match',user, payload.tokenVersion)
        return res.sendStatus(401);
    }

    // 🔁 ROTATE
    user.tokenVersion += 1;
    await user.save();

    const newAccess = createAccessToken(user._id);
    const newRefresh = createRefreshToken(user._id, user.tokenVersion);

    res.cookie("access_token", newAccess, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", newRefresh, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/api/v1/user/refresh",
    });

    res.sendStatus(200);
};

module.exports = {
    refresh,
};