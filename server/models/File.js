import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  filename: String,
  originalName: String,
  url: String,
  mimetype: String,
  size: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

export default mongoose.model('File', schema);