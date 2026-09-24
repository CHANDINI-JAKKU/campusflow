import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  credits: { type: Number, required: true },
  maxInternalMarks: { type: Number, default: 30 },
  maxExternalMarks: { type: Number, default: 70 }
}, { timestamps: true });

export default mongoose.model('Subject', schema);