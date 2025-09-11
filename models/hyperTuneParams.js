// const mongoose = require('mongoose');

// // Example parameter schemas for four project types
// const typeAParamsSchema = new mongoose.Schema({
//   paramA1: String,
//   paramA2: Number,
//   // ...add more fields as needed
// }, { _id: false });

// const typeBParamsSchema = new mongoose.Schema({
//   paramB1: Boolean,
//   paramB2: String,
//   // ...add more fields as needed
// }, { _id: false });

// const typeCParamsSchema = new mongoose.Schema({
//   paramC1: Date,
//   paramC2: Number,
//   // ...add more fields as needed
// }, { _id: false });

// const typeDParamsSchema = new mongoose.Schema({
//   paramD1: String,
//   paramD2: Boolean,
//   // ...add more fields as needed
// }, { _id: false });

// const hyperTuneParamsSchema = new mongoose.Schema({
//   project: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'project',
//     required: true,
//     unique: true // One-to-one relationship
//   },
//   model: {
//     type: String,
//     required: true,
//     enum: ['TypeA', 'TypeB', 'TypeC', 'TypeD']
//   },
//   typeAParams: { type: typeAParamsSchema },
//   typeBParams: { type: typeBParamsSchema },
//   typeCParams: { type: typeCParamsSchema },
//   typeDParams: { type: typeDParamsSchema },
// }, { timestamps: true });

// module.exports = mongoose.model('hyperTuneParams', hyperTuneParamsSchema);
