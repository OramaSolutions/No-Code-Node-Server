const axios = require("axios");

const FLASK_URLS = {
  classification: process.env.FLASK_CLASSIFICATION_URL,
  objectdetection: process.env.FLASK_OBJECT_DETECTION_URL,
  defectdetection: process.env.FLASK_DEFECT_DETECTION_URL,
  textextraction: process.env.FLASK_TEXT_EXTRACTION_URL,
};

function getFlaskClient(task) {
  const baseURL = FLASK_URLS[task];

  if (!baseURL) {
    throw new Error(`No Flask URL configured for task: ${task}`);
  }

  return axios.create({
    baseURL,
    timeout: 30 * 60 * 1000,
    headers: {
      "X-Internal-Token": process.env.FLASK_INTERNAL_SECRET,
      "Content-Type": "application/json",
    },
  });
}

module.exports = getFlaskClient;
