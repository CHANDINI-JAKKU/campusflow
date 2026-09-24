import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const models = {
  User: `import mongoose from 'mongoose';

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

export default mongoose.model('User', schema);`,

  Institution: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: String,
  phone: String,
  email: String,
  website: String,
  logo: String,
  isActive: { type: Boolean, default: true },
  establishedYear: Number,
  type: { type: String, enum: ['UNIVERSITY', 'COLLEGE', 'POLYTECHNIC'] },
  adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Institution', schema);`,

  Department: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Department', schema);`,

  Course: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  semester: Number,
  year: Number,
  credits: Number,
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Course', schema);`,

  Subject: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  credits: { type: Number, required: true },
  maxInternalMarks: { type: Number, default: 30 },
  maxExternalMarks: { type: Number, default: 70 }
}, { timestamps: true });

export default mongoose.model('Subject', schema);`,

  Enrollment: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  academicYear: String,
  semester: Number,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Enrollment', schema);`,

  Attendance: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  date: { type: Date, required: true },
  sessionType: { type: String, enum: ['LECTURE', 'LAB', 'TUTORIAL'], required: true },
  topic: String,
  isFinalized: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Attendance', schema);`,

  AttendanceRecord: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE'], required: true }
}, { timestamps: true });

export default mongoose.model('AttendanceRecord', schema);`,

  Assignment: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  deadline: { type: Date, required: true },
  maxMarks: { type: Number, required: true },
  allowedFileTypes: [String],
  maxFileSize: Number,
  attachments: [{ filename: String, url: String, mimetype: String }],
  allowLateSubmission: { type: Boolean, default: false },
  allowResubmission: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'CLOSED'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model('Assignment', schema);`,

  AssignmentSubmission: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  files: [{ filename: String, url: String, mimetype: String }],
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['PENDING', 'SUBMITTED', 'LATE', 'UNDER_REVIEW', 'GRADED', 'RESUBMISSION_REQUIRED'], default: 'SUBMITTED' },
  marks: Number,
  feedback: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  submissionHistory: [{ files: Array, submittedAt: Date, status: String }]
}, { timestamps: true });

export default mongoose.model('AssignmentSubmission', schema);`,

  Grade: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: Number,
  academicYear: String,
  internalMarks: [{ type: { type: String, enum: ['ASSIGNMENT', 'TEST', 'QUIZ', 'PROJECT'] }, marks: Number, maxMarks: Number, date: Date }],
  externalMarks: Number,
  totalInternal: Number,
  totalExternal: Number,
  total: Number,
  grade: String,
  gradePoints: Number,
  isFinalized: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Grade', schema);`,

  AcademicRecord: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  semester: Number,
  academicYear: String,
  sgpa: Number,
  cgpa: Number,
  totalCredits: Number,
  earnedCredits: Number,
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Grade' }]
}, { timestamps: true });

export default mongoose.model('AcademicRecord', schema);`,

  Event: `import mongoose from 'mongoose';

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

export default mongoose.model('Event', schema);`,

  Announcement: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audience: { type: String, enum: ['ALL', 'STUDENTS', 'FACULTY', 'SPECIFIC_COURSE', 'SPECIFIC_DEPT'] },
  priority: { type: String, enum: ['NORMAL', 'IMPORTANT', 'URGENT'], default: 'NORMAL' },
  expiresAt: Date,
  attachments: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Announcement', schema);`,

  StudentRequest: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  type: { type: String, enum: ['BONAFIDE', 'LEAVE', 'CERTIFICATE', 'ACADEMIC_CLARIFICATION', 'FEE', 'OTHER'] },
  subject: String,
  description: String,
  status: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  attachments: [String],
  workflow: [{ action: String, performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, comment: String, timestamp: { type: Date, default: Date.now } }],
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.model('StudentRequest', schema);`,

  Notification: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  type: String,
  title: String,
  message: String,
  link: String,
  isRead: { type: Boolean, default: false },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model('Notification', schema);`,

  Company: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  industry: String,
  website: String,
  location: String,
  description: String,
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  minPackage: Number,
  maxPackage: Number,
  jobRoles: [String],
  requiredSkills: [String],
  logo: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Company', schema);`,

  JobDrive: `import mongoose from 'mongoose';

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

export default mongoose.model('JobDrive', schema);`,

  JobApplication: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDrive', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  status: { type: String, enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'], default: 'APPLIED' },
  appliedAt: { type: Date, default: Date.now },
  resume: { filename: String, url: String }
}, { timestamps: true });

export default mongoose.model('JobApplication', schema);`,

  InterviewRound: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  drive: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDrive', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  roundNumber: Number,
  roundType: { type: String, enum: ['APTITUDE', 'TECHNICAL', 'HR', 'GROUP_DISCUSSION'] },
  scheduledAt: Date,
  result: { type: String, enum: ['PENDING', 'PASSED', 'FAILED'], default: 'PENDING' },
  feedback: String,
  conductedBy: String
}, { timestamps: true });

export default mongoose.model('InterviewRound', schema);`,

  PlacementOutcome: `import mongoose from 'mongoose';

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

export default mongoose.model('PlacementOutcome', schema);`,

  File: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  filename: String,
  originalName: String,
  url: String,
  mimetype: String,
  size: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

export default mongoose.model('File', schema);`,

  ActivityLog: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  action: String,
  resource: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

export default mongoose.model('ActivityLog', schema);`,

  RefreshToken: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  token: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('RefreshToken', schema);`,

  PasswordResetToken: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  token: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('PasswordResetToken', schema);`,

  AIConversation: `import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  messages: [{ role: { type: String, enum: ['user', 'assistant'] }, content: String, timestamp: { type: Date, default: Date.now } }],
  context: { courses: [String], weakSubjects: [String] }
}, { timestamps: true });

export default mongoose.model('AIConversation', schema);`,

  StudyPlan: `import mongoose from 'mongoose';

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

export default mongoose.model('StudyPlan', schema);`
};

for (const [name, content] of Object.entries(models)) {
  fs.writeFileSync(path.join(__dirname, 'models', name + '.js'), content);
}
console.log('Models generated!');
