const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['PM', 'QA', 'Developer', 'DevOps'], required: true }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  serviceId: { type: String, required: true },
  name: { type: String, required: true },
  groupNumber: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String, required: true },
  workspaceName: { type: String, required: true, unique: true },
  role: { type: String, enum: ['PM', 'QA', 'Developer', 'DevOps'], required: true },
  projectName: { type: String, required: true },
  projectStartDate: { type: Date, required: true },
  projectEndDate: { type: Date, required: true },
  teamMembers: [teamMemberSchema]
});

module.exports = mongoose.model('Student', studentSchema);
