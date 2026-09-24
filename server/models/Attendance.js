import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  date: { type: Date, required: true },
  sessionType: { type: String, enum: ['LECTURE', 'LAB', 'TUTORIAL'], required: true },
  topic: String,
  isFinalized: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Attendance', schema);