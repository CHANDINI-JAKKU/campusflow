import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  files: [{ filename: String, url: String, mimetype: String }],
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['PENDING', 'SUBMITTED', 'LATE', 'UNDER_REVIEW', 'GRADED', 'RESUBMISSION_REQUIRED'], default: 'SUBMITTED' },
  marks: Number,
  feedback: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  submissionHistory: [{ files: Array, submittedAt: Date, status: String }]
}, { timestamps: true });

export default mongoose.model('AssignmentSubmission', schema);