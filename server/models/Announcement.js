import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audience: { type: String, enum: ['ALL', 'STUDENTS', 'FACULTY', 'SPECIFIC_COURSE', 'SPECIFIC_DEPT'] },
  priority: { type: String, enum: ['NORMAL', 'IMPORTANT', 'URGENT'], default: 'NORMAL' },
  expiresAt: Date,
  attachments: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Announcement', schema);