import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  token: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('PasswordResetToken', schema);