import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  messages: [{ role: { type: String, enum: ['user', 'assistant'] }, content: String, timestamp: { type: Date, default: Date.now } }],
  context: { courses: [String], weakSubjects: [String] }
}, { timestamps: true });

export default mongoose.model('AIConversation', schema);