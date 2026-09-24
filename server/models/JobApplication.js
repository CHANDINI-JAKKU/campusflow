import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDrive', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  status: { type: String, enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'], default: 'APPLIED' },
  appliedAt: { type: Date, default: Date.now },
  resume: { filename: String, url: String }
}, { timestamps: true });

export default mongoose.model('JobApplication', schema);