
const getFlaskClient = require("../../utility/flaskClient");
const Project = require("../../models/projectModel");
const {
  RESPONSE_STATUS,
  RESPONSE_MESSAGES
} = require("../../constants");

exports.buildImagePri = async (req, res) => {
  const { projectId, username, version, task, projectName, applicationId } = req.body;
  const userId = req.user_id;
  // console.log("Build Image PRI Request:", userId, projectId, username, version, task, applicationId);

  // 1️⃣ Verify project ownership
  const project = await Project.findOne({
    _id: projectId,
    userId,
    status: { $ne: "DELETED" }
  });

  if (!project) {
    return res.status(RESPONSE_STATUS.NOT_FOUND).json({
      error: "Project not found"
    });
  }

  // 2️⃣ Mark build started in DB
  project.buildStatus.buildStarted = true;
  project.buildStatus.buildStartTime = new Date();
  project.buildStatus.buildReady = false;
  await project.save();

  const flaskClient = getFlaskClient(task);

  // 3️⃣ Call Flask (internal)
  const resFlask = await flaskClient.post("/build-image-pri", {
    projectId,
    username,
    version,
    task,
    applicationId,
    projectName
  });

  console.log("Flask Build Image PRI Response:", resFlask.data);

  return res.status(RESPONSE_STATUS.SUCCESS).json({
    success: true,
    message: "Build started",
    status: resFlask.data.status,
    task_id: resFlask.data.task_id
  });
};
