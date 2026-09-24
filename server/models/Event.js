import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  eventType: { type: String, enum: ['COLLEGE', 'DEPARTMENT', 'WORKSHOP', 'SEMINAR', 'HACKATHON', 'PLACEMENT', 'CLUB'] },
  date: Date,
  startTime: String,
  endTime: String,
  venue: String,
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registrationDeadline: Date,
  capacity: Number,
  audience: { type: String, enum: ['ALL', 'STUDENTS', 'FACULTY', 'SPECIFIC_DEPT'] },
  registrations: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, registeredAt: { type: Date, default: Date.now } }],
  isActive: { type: Boolean, default: true },
  attachments: [String]
}, { timestamps: true });

export default mongoose.model('Event', schema);