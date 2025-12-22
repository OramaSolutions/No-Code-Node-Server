const jwt = require("jsonwebtoken");

const createAccessToken = (userId) =>
  jwt.sign(
    { user_id: userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

const createRefreshToken = (userId, tokenVersion) =>
  jwt.sign(
    { user_id: userId, tokenVersion },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "30d" }
  );

module.exports = {
  createAccessToken,
  createRefreshToken,
};
