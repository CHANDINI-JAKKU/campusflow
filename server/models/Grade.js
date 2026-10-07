import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true },
  internalMarks: [{
    type: { 
      type: String, 
      enum: ['ASSIGNMENT', 'QUIZ', 'INTERNAL', 'MID_EXAM', 'LAB', 'PRACTICAL', 'END_SEMESTER', 'TEST', 'PROJECT'],
      required: true 
    },
    marks: { type: Number, required: true },
    maxMarks: { type: Number, required: true, default: 30 },
    date: { type: Date, default: Date.now }
  }],
  externalMarks: { type: Number, default: 0 },
  totalInternal: { type: Number, default: 0 },
  totalExternal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  grade: String,
  gradePoints: Number,
  isFinalized: { type: Boolean, default: false }
}, { timestamps: true });

schema.index({ student: 1, subject: 1, semester: 1, academicYear: 1 }, { unique: true });
schema.index({ institution: 1, department: 1, semester: 1 });

export default mongoose.model('Grade', schema);