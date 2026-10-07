import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  instructions: { type: String, trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  year: { type: Number, required: true, default: 2 },
  semester: { type: Number, required: true, default: 1 },
  section: { type: String, required: true, trim: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  academicYear: { type: String, default: '2026-2027' },
  deadline: { type: Date, required: true },
  maxMarks: { type: Number, required: true, default: 20 },
  allowedFileTypes: [String],
  maxFileSize: Number,
  attachments: [{ filename: String, url: String, mimetype: String }],
  allowLateSubmission: { type: Boolean, default: false },
  allowResubmission: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' }
}, { timestamps: true });

schema.index({ institution: 1, department: 1, year: 1, semester: 1, section: 1, subject: 1 });
schema.index({ faculty: 1 });

export default mongoose.model('Assignment', schema);