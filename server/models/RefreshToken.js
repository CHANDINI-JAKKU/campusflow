import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  token: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('RefreshToken', schema);