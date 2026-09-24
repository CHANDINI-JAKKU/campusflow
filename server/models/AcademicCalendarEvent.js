import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  academicYear: { type: String, required: true },
  semester: { type: Number, required: true },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['HOLIDAY', 'INSTRUCTION', 'MID_EXAM', 'END_SEM_EXAM', 'ASSIGNMENT', 'EVENT', 'PLACEMENT', 'REGISTRATION', 'RESULT', 'OTHER'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  section: { type: String, trim: true },
  description: { type: String, trim: true },
  isHoliday: { type: Boolean, default: false },
  isAcademic: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

schema.index({ institution: 1, startDate: 1, endDate: 1 });

export default mongoose.model('AcademicCalendarEvent', schema);
