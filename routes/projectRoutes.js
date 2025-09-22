const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { verifyToken } = require("../auth/verifyToken");
const jwt = require('jsonwebtoken');
// const { validateSyncApiKey } = require("./yourMiddlewareFile"); 
const projectController = require('../controller/projects/projectsController'); 
const licenseController = require('../controller/projects/licecnseIssuer');
const D_S_K = 'mimimimi'

function generateSignedUrl({ filename, username, task, project, version, userId, projectId }, expiresInSeconds = 300) {
  const token = jwt.sign(
    { filename, username, task, project, version, userId, projectId},
    D_S_K,
    { expiresIn: expiresInSeconds }
  );
  return `fetch_file/${encodeURIComponent(filename)}?token=${token}`;
}



router.post('/update-application-status', projectController.updateApplicationStatus)

router.post('/generate_license', licenseController.issueLicense);
router.post('/deactivate_license', licenseController.deactivateLicense);

// Apply verifyToken middleware globally if needed
router.use(verifyToken);

// Rate limiting for sync operations
const syncRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many sync requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.put('/sync-status',
  syncRateLimit,
  // validateSyncApiKey,
  projectController.syncStatus
);

router.get('/project-status/:project_number',
  projectController.getProjectStatus
);

router.get('/projects-with-sync-status',
  projectController.getProjectsWithSyncStatus
);

//  route for check(auth) and update build status in db 
router.post('/update-build-status',
  projectController.updateBuildStatus
);

router.get('/get-download-url/:filename', (req, res) => {
  const { filename } = req.params;
  const userId = req.user_id;
  const { username, task, project, version, projectId } = req.query; // Optional, if needed to validate outside token

  // Typically, token validation middleware should verify and decode token from Authorization header or query param
  // But for this example, generate a signed URL passing all user context:
  const signedUrl = generateSignedUrl({ filename, username, task, project, version, userId, projectId }, 600);
  res.json({ url: signedUrl });
});





module.exports = router;
