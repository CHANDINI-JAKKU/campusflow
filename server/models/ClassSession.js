import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true, trim: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timetable: { type: mongoose.Schema.Types.ObjectId, ref: 'Timetable' },
  academicYear: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  room: { type: String, trim: true },
  sessionType: { type: String, enum: ['LECTURE', 'LAB', 'TUTORIAL'], default: 'LECTURE' },
  topic: { type: String, trim: true },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  isFinalized: { type: Boolean, default: false },
  totalStudents: { type: Number, default: 0 },
  presentCount: { type: Number, default: 0 },
  absentCount: { type: Number, default: 0 }
}, { timestamps: true });

// Prevent duplicate sessions for the same timetable entry on the same date
schema.index({ timetable: 1, date: 1 }, { unique: true, partialFilterExpression: { timetable: { $type: 'objectId' } } });
schema.index({ institution: 1, department: 1, year: 1, semester: 1, section: 1, date: 1 });
schema.index({ faculty: 1, date: 1 });

export default mongoose.model('ClassSession', schema);
