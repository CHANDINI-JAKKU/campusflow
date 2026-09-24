import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDrive', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  roundNumber: Number,
  roundType: { type: String, enum: ['APTITUDE', 'TECHNICAL', 'HR', 'GROUP_DISCUSSION'] },
  scheduledAt: Date,
  result: { type: String, enum: ['PENDING', 'PASSED', 'FAILED'], default: 'PENDING' },
  feedback: String,
  conductedBy: String
}, { timestamps: true });

export default mongoose.model('InterviewRound', schema);