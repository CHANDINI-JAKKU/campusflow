import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  role: String,
  description: String,
  location: String,
  package: Number,
  eligibility: {
    minCGPA: Number,
    maxBacklogs: Number,
    minAttendance: Number,
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
    graduationYear: Number
  },
  requiredSkills: [String],
  applicationDeadline: Date,
  status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'CLOSED'], default: 'UPCOMING' },
  placementOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('JobDrive', schema);