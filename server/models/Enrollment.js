import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  academicYear: String,
  semester: Number,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Enrollment', schema);