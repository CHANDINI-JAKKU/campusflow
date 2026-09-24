import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: String,
  phone: String,
  email: String,
  website: String,
  logo: String,
  isActive: { type: Boolean, default: true },
  establishedYear: Number,
  type: { type: String, enum: ['UNIVERSITY', 'COLLEGE', 'POLYTECHNIC'] },
  adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Institution', schema);