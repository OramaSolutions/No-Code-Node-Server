module.exports = function internalAuth(req, res, next) {
    const token = req.headers["x-internal-token"];
    // console.log("Internal Auth Token:", token);
    if (!token) {
        return res.status(401).json({ error: "Missing internal token" });
    }

    if (token !== process.env.FLASK_INTERNAL_SECRET) {
        return res.status(403).json({ error: "Invalid internal token" });
    }

    next();
};
