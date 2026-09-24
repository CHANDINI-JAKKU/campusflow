import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: Number,
  academicYear: String,
  internalMarks: [{ type: { type: String, enum: ['ASSIGNMENT', 'TEST', 'QUIZ', 'PROJECT'] }, marks: Number, maxMarks: Number, date: Date }],
  externalMarks: Number,
  totalInternal: Number,
  totalExternal: Number,
  total: Number,
  grade: String,
  gradePoints: Number,
  isFinalized: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Grade', schema);