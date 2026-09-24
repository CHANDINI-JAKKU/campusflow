import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDrive' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  role: String,
  package: Number,
  joiningDate: Date,
  status: { type: String, enum: ['OFFERED', 'ACCEPTED', 'DECLINED', 'JOINED'], default: 'OFFERED' }
}, { timestamps: true });

export default mongoose.model('PlacementOutcome', schema);