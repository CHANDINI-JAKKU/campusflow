import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  title: String,
  examDate: Date,
  hoursPerDay: Number,
  subjects: [{ name: String, priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] }, topics: [String] }],
  schedule: [{ day: String, date: Date, tasks: [{ topic: String, subject: String, duration: Number, isCompleted: Boolean }] }],
  aiGenerated: Boolean,
  progress: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

export default mongoose.model('StudyPlan', schema);