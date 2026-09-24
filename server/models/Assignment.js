import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  deadline: { type: Date, required: true },
  maxMarks: { type: Number, required: true },
  allowedFileTypes: [String],
  maxFileSize: Number,
  attachments: [{ filename: String, url: String, mimetype: String }],
  allowLateSubmission: { type: Boolean, default: false },
  allowResubmission: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model('Assignment', schema);