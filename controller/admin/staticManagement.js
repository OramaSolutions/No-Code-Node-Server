const { RESPONSE_MESSAGES, RESPONSE_STATUS } = require('../../constants');
const staticContent = require('../../models/staticContent');




const getStaticContent = async (req, res) => {
    try {
        let staticResult
        if (req.query.type) {
            if (req.query.type == "All") {
                staticResult = await staticContent.find({});
            }
            else {
                staticResult = await staticContent.findOne({ type: req.query.type.toUpperCase() });
            }
            return res
                .status(RESPONSE_STATUS.SUCCESS)
                .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, staticResult });
        }
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}
const editStaticContent = async (req, res) => {
    try {
        const staticResult = await staticContent.findOneAndUpdate({ _id: req.body.staticId, status: "ACTIVE" }, { $set: req.body }, { new: true })
        if (!staticResult) {
            return res
                .status(RESPONSE_STATUS.NOT_FOUND)
                .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.NOT_FOUND });
        }
        return res
            .status(RESPONSE_STATUS.SUCCESS)
            .json({ code: RESPONSE_STATUS.SUCCESS, message: RESPONSE_MESSAGES.SUCCESS, staticResult });
    } catch (error) {
        return res
            .status(RESPONSE_STATUS.SERVER_ERROR)
            .json({ message: RESPONSE_MESSAGES.SERVER_ERROR });
    }

}

module.exports = {
    getStaticContent: getStaticContent,
    editStaticContent: editStaticContent
}

