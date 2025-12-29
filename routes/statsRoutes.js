// statsRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require("../auth/verifyToken");
const statsController = require('../controller/statsController');

router.use(verifyAdminToken);

// User routes
router.get('/users/total', statsController.getTotalUsers);
router.get('/users/active', statsController.getActiveUsers);
router.get('/users/new', statsController.getNewUsers);
router.get('/users/by-status', statsController.getUsersByStatus); // ✅ Changed from getUsersByRole
router.get('/users/with-projects', statsController.getUsersWithProjects);
router.get('/users/without-projects', statsController.getUsersWithoutProjects);
router.get('/users/top', statsController.getTopUsers);

// Project routes
router.get('/projects/total', statsController.getTotalProjects);
router.get('/projects/active', statsController.getActiveProjects);
router.get('/projects/open', statsController.getOpenProjects); // ✅ New route for open projects
router.get('/projects/closed', statsController.getClosedProjects); // ✅ New route for closed projects
router.get('/projects/by-approval-status', statsController.getProjectsByApprovalStatus); // ✅ New route
router.get('/projects/new', statsController.getNewProjects);
router.get('/projects/by-user', statsController.getProjectsByUser);
router.get('/projects/by-model', statsController.getProjectsByModel); // ✅ Changed from getProjectsByCategory
router.get('/projects/without-users', statsController.getProjectsWithoutUsers);

// Summary routes
router.get('/average-projects-per-user', statsController.getAverageProjectsPerUser);
router.get('/summary', statsController.getSummary);

module.exports = router;
