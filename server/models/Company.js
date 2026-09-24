import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  industry: String,
  website: String,
  location: String,
  description: String,
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  minPackage: Number,
  maxPackage: Number,
  jobRoles: [String],
  requiredSkills: [String],
  logo: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Company', schema);