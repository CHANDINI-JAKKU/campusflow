import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  year: { type: Number, required: true, default: 1 },
  semester: { type: Number, required: true },
  section: { type: String, required: true, trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: String, trim: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  academicYear: { type: String, required: true, default: '2026-2027' },
  sessionType: { type: String, enum: ['LECTURE', 'LAB', 'TUTORIAL'], default: 'LECTURE' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

schema.index({ institution: 1, department: 1, year: 1, semester: 1, section: 1, dayOfWeek: 1 });
schema.index({ faculty: 1, dayOfWeek: 1 });

export default mongoose.model('Timetable', schema);
