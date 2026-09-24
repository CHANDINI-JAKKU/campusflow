import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Department', schema);