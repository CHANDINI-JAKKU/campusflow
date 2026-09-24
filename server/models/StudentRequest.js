import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  type: { type: String, enum: ['BONAFIDE', 'LEAVE', 'CERTIFICATE', 'ACADEMIC_CLARIFICATION', 'FEE', 'OTHER'] },
  subject: String,
  description: String,
  status: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  attachments: [String],
  workflow: [{ action: String, performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, comment: String, timestamp: { type: Date, default: Date.now } }],
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.model('StudentRequest', schema);