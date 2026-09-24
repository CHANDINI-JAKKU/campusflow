import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true, trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: String, trim: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

schema.index({ institution: 1, dayOfWeek: 1, semester: 1, section: 1 });
schema.index({ faculty: 1, dayOfWeek: 1 });

export default mongoose.model('Timetable', schema);
