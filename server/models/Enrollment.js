import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true, trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  academicYear: { type: String, required: true, default: '2026-2027' },
  status: { type: String, enum: ['ACTIVE', 'DROPPED', 'COMPLETED'], default: 'ACTIVE' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ student: 1, subject: 1, semester: 1, academicYear: 1 }, { unique: true });
schema.index({ institution: 1, department: 1, year: 1, semester: 1, section: 1, subject: 1, status: 1 });
schema.index({ student: 1, status: 1 });

export default mongoose.model('Enrollment', schema);