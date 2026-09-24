import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  semester: Number,
  academicYear: String,
  sgpa: Number,
  cgpa: Number,
  totalCredits: Number,
  earnedCredits: Number,
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grade' }]
}, { timestamps: true });

export default mongoose.model('AcademicRecord', schema);