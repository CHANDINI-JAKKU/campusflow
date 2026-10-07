import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  classSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSession' },
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }, // Legacy/compat
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  section: { type: String, trim: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE'], default: 'PRESENT', required: true },
  remarks: { type: String, trim: true }
}, { timestamps: true });

schema.index({ classSession: 1, student: 1 }, { unique: true, sparse: true });
schema.index({ student: 1, subject: 1, date: 1 });
schema.index({ institution: 1, student: 1 });

export default mongoose.model('AttendanceRecord', schema);