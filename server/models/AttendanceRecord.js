import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE'], required: true }
}, { timestamps: true });

export default mongoose.model('AttendanceRecord', schema);