// this file contains controllers for project-related endpoints for mostly python services

const mongoose = require('mongoose');
const Joi = require('joi');
const Project = require('../../models/projectModel');
const User = require('../../models/userModel');
const {
    RESPONSE_STATUS,
    RESPONSE_MESSAGES
} = require('../../constants');

const syncStatusSchema = Joi.object({
    username: Joi.string().min(1).max(50).required(),
    projectId: Joi.string().hex().length(24).required(),
    name: Joi.string().min(1).max(255).required(),
    version: Joi.string().min(1).max(50).required(),
    // ['labelled', 'augmented', 'images', 'dataSplit', 'HyperTune', 'infer', 'remark', 'application']
    current_step: Joi.string().valid('labelled', 'augmented', 'images', 'dataSplit', 'HyperTune', 'infer', 'remark', 'application').required(),
    overall_status: Joi.string().valid('in_progress', 'completed', 'failed', 'pending').required(),
    overall_progress: Joi.number().min(0).max(100).required(),
    step_status: Joi.object().required(),
    last_activity: Joi.string().isoDate().required(),
    task: Joi.string().optional()
});

const projectQuerySchema = Joi.object({
    project_number: Joi.string().min(3).max(100).required(),
    include_steps: Joi.boolean().optional().default(true)
});

function normalizeModel(model) {
    return model.toLowerCase().replace(/[\s-_]/g, '');
}

const createErrorResponse = (message, code, details = null) => ({
    error: message,
    code,
    ...(details && { details }),
    timestamp: new Date().toISOString()
});

const createSuccessResponse = (data, message = 'Success') => ({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
});

const updateBuildStatusSchema = Joi.object({
    username: Joi.string().min(1).max(50).required(),
    name: Joi.string().min(1).max(255).required(),
    version: Joi.string().min(1).max(50).required(),
    task: Joi.string().optional(),
    projectId: Joi.string().hex().length(24).required(),
    buildStarted: Joi.boolean().required(),
    buildStartTime: Joi.date().iso().allow(null).optional(),
    buildEndTime: Joi.date().iso().allow(null).optional(),
    tokensConsumed: Joi.number().min(0).allow(null).optional(),
    buildReady: Joi.boolean().allow(null).optional()
});

const updateApplicationSchema = Joi.object({
    username: Joi.string().min(1).max(50).required(),
    userId: Joi.string().hex().length(24).required(),
    name: Joi.string().min(1).max(255).required(),
    version: Joi.string().min(1).max(50).required(),
    task: Joi.string().optional(),
    projectId: Joi.string().hex().length(24).required(),
    appDownloaded: Joi.boolean().optional(),
    downloadedFromIp: Joi.string().optional().allow(null, ''),
    downloadTime: Joi.date().iso().optional(),
    app_id: Joi.string().optional().allow(null, '')
});

// Controller for sync status endpoint
exports.syncStatus = async (req, res) => {
    // console.log("Request Body for sync status:", req.body);
    const session = await mongoose.startSession();

    try {
        const { error, value } = syncStatusSchema.validate(req.body);
        if (error) {
            console.log('validation error', error);
            return res.status(RESPONSE_STATUS.BAD_REQUEST).json(
                createErrorResponse('Validation failed', 'VALIDATION_ERROR', error.details.map(d => d.message))
            );
        }

        const {
            username, projectId, name, version, current_step, overall_status,
            overall_progress, step_status, last_activity, task
        } = value;
        
      

        session.startTransaction();
        const normalizedModel = normalizeModel(task);
        let project = await Project.findById(projectId).session(session);
        // console.log('project by id', project)
        if (!project) {
            console.log('project by id not found, searching by details')
            project = await Project.findOne({
                userId, name, model: normalizedModel, versionNumber: version
            }).session(session);
        }


        if (!project) {
            await session.abortTransaction();
            console.log('project not found')
            return res.status(RESPONSE_STATUS.NOT_FOUND).json(
                createErrorResponse('Project not found for syncing. Sync aborted.', 'PROJECT_NOT_FOUND')
            );
        }

        // Conflict detection
        if (project.stepData?.version_hash) {
            const currentHash = require('crypto')
                .createHash('md5')
                .update(JSON.stringify(project.stepData.step_status || {}))
                .digest('hex');
            const incomingHash = require('crypto')
                .createHash('md5')
                .update(JSON.stringify(step_status))
                .digest('hex');
            if (currentHash !== project.stepData.version_hash &&
                currentHash !== incomingHash) {
                await session.abortTransaction();
                return res.status(RESPONSE_STATUS.CONFLICT || 409).json(
                    createErrorResponse('Conflict detected - project was modified elsewhere', 'SYNC_CONFLICT')
                );
            }
        }

        switch (overall_status) {
            case 'completed':
                project.projectStatus = 'CLOSE';
                project.approvedStatus = 'ACCEPT';
                break;
            case 'failed':
                project.approvedStatus = 'REJECT';
                project.projectStatus = 'OPEN';
                break;
            default:
                project.projectStatus = 'OPEN';
                project.approvedStatus = 'PENDING';
        }

        project.stepData = {
            current_step,
            overall_progress,
            step_status,
            last_sync: new Date(last_activity),
            sync_source: 'python_service',
            task: task
        };

        await project.save({ session });
        await session.commitTransaction();

        const responseData = {
            id: project._id,
            project_number: project.project_number,
            name: project.name,
            version: project.versionNumber,
            status: project.projectStatus,
            approvedStatus: project.approvedStatus,
            current_step: project.stepData.current_step,
            overall_progress: project.stepData.overall_progress,
            last_sync: project.stepData.last_sync
        };

        res.status(RESPONSE_STATUS.SUCCESS).json(
            createSuccessResponse(responseData, 'Project synced successfully')
        );
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (error.name === 'ValidationError') {
            return res.status(RESPONSE_STATUS.BAD_REQUEST).json(
                createErrorResponse('Database validation failed', 'DB_VALIDATION_ERROR',
                    Object.values(error.errors).map(e => e.message)
                )
            );
        }
        res.status(RESPONSE_STATUS.SERVER_ERROR).json(
            createErrorResponse(RESPONSE_MESSAGES.SERVER_ERROR, 'INTERNAL_ERROR')
        );
    } finally {
        await session.endSession();
    }
};


exports.updateBuildStatus = async (req, res) => {
    try {
        console.log("Request Body for build status update:", req.body);
        const { error, value } = updateBuildStatusSchema.validate(req.body, { abortEarly: false });

        if (error) {
            console.log('validation error', error);
            return res.status(RESPONSE_STATUS.BAD_REQUEST).json(
                createErrorResponse('Validation failed', 'VALIDATION_ERROR', error.details.map(d => d.message))
            );
        }

        const {
            username, projectId, name, version, task,
            buildStarted, buildStartTime, buildEndTime, tokensConsumed, buildReady
        } = value;

        const userId = req.user_id;
        const normalizedModel = normalizeModel(task);

        let project = await Project.findById(projectId);
        if (!project) {
            project = await Project.findOne({
                userId, name, model: normalizedModel, versionNumber: version
            });
        }


        if (!project) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).json(
                createErrorResponse('Project not found', 'PROJECT_NOT_FOUND')
            );
        }

        project.buildStatus = project.buildStatus || {};
        project.buildStatus.buildStarted = buildStarted;

        if (buildStartTime) project.buildStatus.buildStartTime = new Date(buildStartTime);
        if (buildEndTime) project.buildStatus.buildEndTime = new Date(buildEndTime);
        if (typeof tokensConsumed === 'number') project.buildStatus.tokensConsumed = tokensConsumed;
        if (typeof buildReady === 'boolean') project.buildStatus.buildReady = buildReady;

        await project.save();

        res.status(RESPONSE_STATUS.SUCCESS).json(
            createSuccessResponse(project.buildStatus, 'Build status updated successfully')
        );

    } catch (error) {
        console.error('Error updating build status:', error);
        res.status(RESPONSE_STATUS.SERVER_ERROR).json(
            createErrorResponse(RESPONSE_MESSAGES.SERVER_ERROR, 'INTERNAL_ERROR')
        );
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        console.log("Request Body for application status update:", req.body);
        const { error, value } = updateApplicationSchema.validate(req.body, { abortEarly: false });
        if (error) {
            console.log('validation error', error);
            return res.status(RESPONSE_STATUS.BAD_REQUEST).json(
                createErrorResponse('Validation failed', 'VALIDATION_ERROR', error.details.map(d => d.message))
            );
        }

        const {
            username, projectId, name, version, userId, task,
            appDownloaded, downloadedFromIp, downloadTime,
            app_id
        } = value;


        const normalizedModel = normalizeModel(task);




        let project = await Project.findById(projectId);
        if (!project) {
            project = await Project.findOne({
                userId, name, model: normalizedModel, versionNumber: version
            });
        }


        if (!project) {
            return res.status(RESPONSE_STATUS.NOT_FOUND).json(
                createErrorResponse('Project not found', 'PROJECT_NOT_FOUND')
            );
        }

        project.applicationStatus = project.applicationStatus || {};
        if (typeof appDownloaded === 'boolean') project.applicationStatus.appDownloaded = appDownloaded;
        if (downloadedFromIp !== undefined) project.applicationStatus.downloadedFromIp = downloadedFromIp;
        if (downloadTime) project.applicationStatus.downloadTime = new Date(downloadTime);
        if (app_id !== undefined) project.applicationStatus.app_id = app_id;

        await project.save();

        res.status(RESPONSE_STATUS.SUCCESS).json(
            createSuccessResponse(project.applicationStatus, 'Application status updated successfully')
        );

    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(RESPONSE_STATUS.SERVER_ERROR).json(
            createErrorResponse(RESPONSE_MESSAGES.SERVER_ERROR, 'INTERNAL_ERROR')
        );
    }
};

exports.deleteProjectVersion = async(req,res)=> {
try {
    
} catch (error) {
    
}
}
