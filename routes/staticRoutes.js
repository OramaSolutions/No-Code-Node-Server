const express = require('express');
const staticServices = require('../controller/admin/staticManagement.js');
const router = express.Router();
router.put("/edit-static-content", staticServices.editStaticContent);
router.get("/get-static-content", staticServices.getStaticContent);

module.exports = router;