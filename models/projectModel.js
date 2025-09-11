const mongoose = require("mongoose");

const stepStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  accessible: { type: Boolean, default: false },
  completion_date: { type: Date },
  last_modified: { type: Date, default: Date.now },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  validation_errors: [String]
}, { _id: false });

const project = new mongoose.Schema({
  project_number: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9_-]+$/.test(v);
      },
      message: 'Project number can only contain alphanumeric characters, underscores, and hyphens'
    }
  },
  name: {
    type: String,
    required: true,
    maxlength: 255
  },
  // Reference to hyperTuneParams (one-to-one)
  hyperTuneParams: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'hyperTuneParams',
    unique: true
  },
  versionNumber: {
    type: String,
    required: true,
    maxlength: 50
  },
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    index: true
  },
  projectStatus: {
    type: String,
    enum: ["OPEN", "CLOSE"],
    default: "OPEN"
  },
  approvedStatus: {
    type: String,
    enum: ["ACCEPT", "REJECT", "PENDING"],
    default: "PENDING"
  },
  buildStatus: {
    buildStarted: { type: Boolean, default: false },
    buildStartTime: { type: Date },
    buildEndTime: { type: Date },
    tokensConsumed: { type: Number, default: 0 },
    buildReady: { type: Boolean, default: false }
  },

  applicationStatus: {
    appDownloaded: { type: Boolean, default: false },
    downloadedFromIp: { type: String },
    downloadTime: { type: Date },

    app_id: { type: String },
    license_id: { type: String },
    status: { type: String },
    issued: { type: Number },
    machine_fingerprint: { type: String },
    last_verification: { type: Number }
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "DELETED", "PENDING"],
    default: "ACTIVE"
  },
  otp: { type: String },

  // Enhanced step tracking
  stepData: {
    current_step: {
      type: String,
      enum: ['labelled', 'HyperTune', 'infer', 'remark', 'application'],
      default: 'labelled'
    },
    overall_progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    step_status: {
      labelled: { type: stepStatusSchema, default: () => ({}) },
      HyperTune: { type: stepStatusSchema, default: () => ({}) },
      infer: { type: stepStatusSchema, default: () => ({}) },
      remark: { type: stepStatusSchema, default: () => ({}) },
      application: { type: stepStatusSchema, default: () => ({}) }
    },
    last_sync: { type: Date, default: Date.now },
    sync_source: { type: String, default: 'python_service' },
    version_hash: String // For detecting conflicts
  }
}, {
  minimize: false,
  timestamps: true,
});

// Compound index for efficient querying
project.index({ project_number: 1, userId: 1 }, { unique: true });
project.index({ userId: 1, 'stepData.current_step': 1 });

// Pre-save middleware for validation
project.pre('save', function (next) {
  // Generate version hash for conflict detection
  this.stepData.version_hash = require('crypto')
    .createHash('md5')
    .update(JSON.stringify(this.stepData.step_status))
    .digest('hex');

  next();
});

mongoose.model("project", project);
module.exports = mongoose.model("project");
