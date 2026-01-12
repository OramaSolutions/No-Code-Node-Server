
const getFlaskClient = require("../../utility/flaskClient");
const Project = require("../../models/projectModel");
const {
  RESPONSE_STATUS,
  RESPONSE_MESSAGES
} = require("../../constants");

// exports.buildImagePri = async (req, res) => {
//   const { projectId, username, version, task, projectName, applicationId } = req.body;
//   const userId = req.user_id;
//   // console.log("Build Image PRI Request:", userId, projectId, username, version, task, applicationId);

//   // 1️⃣ Verify project ownership
//   const project = await Project.findOne({
//     _id: projectId,
//     userId,
//     status: { $ne: "DELETED" }
//   });

//   if (!project) {
//     return res.status(RESPONSE_STATUS.NOT_FOUND).json({
//       error: "Project not found"
//     });
//   }

//   // 2️⃣ Mark build started in DB
//   project.buildStatus.buildStarted = true;
//   project.buildStatus.buildStartTime = new Date();
//   project.buildStatus.buildReady = false;
//   await project.save();

//   const flaskClient = getFlaskClient(task);

//   // 3️⃣ Call Flask (internal)
//   const resFlask = await flaskClient.post("/build-image-pri", {
//     projectId,
//     username,
//     version,
//     task,
//     applicationId,
//     projectName
//   });

//   console.log("Flask Build Image PRI Response:");

//   return res.status(RESPONSE_STATUS.SUCCESS).json({
//     success: true,
//     message: "Build started",
//     status: resFlask.data.status,
//     task_id: resFlask.data.task_id
//   });
// };


exports.buildImagePri = async (req, res) => {
  try {
    const { projectId, username, version, task, projectName, applicationId } = req.body;
    const userId = req.user_id;

    if (!projectId || !username || !version || !task || !applicationId) {
      return res.status(RESPONSE_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // 1️⃣ Verify project ownership
    const project = await Project.findOne({
      _id: projectId,
      userId,
      status: { $ne: "DELETED" },
    });

    if (!project) {
      return res.status(RESPONSE_STATUS.NOT_FOUND).json({
        success: false,
        message: "Project not found",
      });
    }

    // 2️⃣ Mark build started
    project.buildStatus.buildStarted = true;
    project.buildStatus.buildStartTime = new Date();
    project.buildStatus.buildReady = false;
    project.buildStatus.buildError = null;

    await project.save();

    const flaskClient = getFlaskClient(task);

    let resFlask;

    try {
      // 3️⃣ Call Flask
      
      resFlask = await flaskClient.post("/build-image-pri", {
        projectId,
        username,
        version,
        task,
        applicationId,
        projectName,
      });
    } catch (flaskErr) {
      console.error("Flask build-image-pri failed:", flaskErr?.response?.data || flaskErr.message);

      // 4️⃣ Rollback build state
      project.buildStatus.buildStarted = false;
      project.buildStatus.buildReady = false;
      project.buildStatus.buildError = "Flask service error";
      await project.save();

      return res.status(RESPONSE_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        message: "Build service is unavailable",
        error: flaskErr?.response?.data || flaskErr.message,
      });
    }

    // 5️⃣ Validate Flask response
    if (!resFlask.data || !resFlask.data.task_id) {
      project.buildStatus.buildStarted = false;
      project.buildStatus.buildError = "Invalid response from build service";
      await project.save();

      return res.status(RESPONSE_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Invalid response from build service",
      });
    }

    return res.status(RESPONSE_STATUS.SUCCESS).json({
      success: true,
      message: "Build started",
      status: resFlask.data.status,
      task_id: resFlask.data.task_id,
    });

  } catch (err) {
    console.error("buildImagePri controller error:", err);

    return res.status(RESPONSE_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
