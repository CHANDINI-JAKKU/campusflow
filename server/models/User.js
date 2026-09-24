import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FACULTY', 'STUDENT', 'PLACEMENT_OFFICER'], required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  rollNumber: { type: String, unique: true, sparse: true },
  employeeId: { type: String, unique: true, sparse: true },
  phone: String,
  avatar: String,
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  year: Number,
  semester: Number,
  section: String,
  profileCompletion: { type: Number, default: 0, min: 0, max: 100 },
  skills: [String],
  github: String,
  linkedin: String
}, { timestamps: true });

export default mongoose.model('User', schema);