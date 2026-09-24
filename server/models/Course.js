import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  semester: Number,
  year: Number,
  credits: Number,
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Course', schema);