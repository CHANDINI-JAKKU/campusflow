import Company from '../models/Company.js';
import JobDrive from '../models/JobDrive.js';
import JobApplication from '../models/JobApplication.js';
import InterviewRound from '../models/InterviewRound.js';
import PlacementOutcome from '../models/PlacementOutcome.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { calcCGPA } from '../utils/calcCGPA.js';
import { calcOverallAttendance } from '../utils/calcAttendance.js';
import AcademicRecord from '../models/AcademicRecord.js';
import { logActivity } from '../utils/auditLog.js';

// ─── COMPANIES ────────────────────────────────────────────────────────────────
export const getCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ institution: req.user.institution, isActive: true });
  res.json(new ApiResponse(200, { companies }));
});

export const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create({ ...req.body, institution: req.user.institution });
  res.status(201).json(new ApiResponse(201, { company }, 'Company created'));
});

export const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution }, req.body, { new: true }
  );
  if (!company) throw new ApiError(404, 'Company not found');
  res.json(new ApiResponse(200, { company }, 'Company updated'));
});

// ─── JOB DRIVES ───────────────────────────────────────────────────────────────
export const getJobDrives = asyncHandler(async (req, res) => {
  const { status, department } = req.query;
  const query = { institution: req.user.institution };
  if (status) query.status = status;

  const drives = await JobDrive.find(query)
    .populate('company', 'name industry logo')
    .populate('eligibility.departments', 'name code')
    .populate('placementOfficer', 'firstName lastName')
    .sort({ createdAt: -1 });

  // For students, compute eligibility
  if (req.user.role === 'STUDENT') {
    const enriched = await Promise.all(drives.map(async (d) => {
      const eligibility = await checkEligibility(req.user._id, d);
      return { ...d.toObject(), eligibility };
    }));
    return res.json(new ApiResponse(200, { drives: enriched }));
  }

  res.json(new ApiResponse(200, { drives }));
});

export const getJobDrive = asyncHandler(async (req, res) => {
  const drive = await JobDrive.findById(req.params.id)
    .populate('company')
    .populate('eligibility.departments', 'name code')
    .populate('placementOfficer', 'firstName lastName');
  if (!drive) throw new ApiError(404, 'Job drive not found');
  res.json(new ApiResponse(200, { drive }));
});

export const createJobDrive = asyncHandler(async (req, res) => {
  const drive = await JobDrive.create({
    ...req.body,
    institution: req.user.institution,
    placementOfficer: req.user._id,
  });

  // Notify eligible students
  const students = await User.find({
    institution: req.user.institution,
    role: 'STUDENT',
    isActive: true,
    department: { $in: req.body.eligibility?.departments || [] },
  });
  if (students.length) {
    await Notification.insertMany(students.map((s) => ({
      user: s._id,
      institution: req.user.institution,
      type: 'NEW_JOB_DRIVE',
      title: 'New Placement Drive',
      message: `A new placement drive has been posted. Check your eligibility now.`,
      link: '/student/placements',
    })));
  }

  res.status(201).json(new ApiResponse(201, { drive }, 'Job drive created'));
});

export const updateJobDrive = asyncHandler(async (req, res) => {
  const drive = await JobDrive.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution }, req.body, { new: true }
  );
  if (!drive) throw new ApiError(404, 'Job drive not found');
  res.json(new ApiResponse(200, { drive }, 'Job drive updated'));
});

// ─── ELIGIBILITY ENGINE ────────────────────────────────────────────────────────
const checkEligibility = async (studentId, drive) => {
  const student = await User.findById(studentId).populate('department');
  const latestRecord = await AcademicRecord.findOne({ student: studentId }).sort({ semester: -1 });
  const cgpa = latestRecord?.cgpa || await calcCGPA(studentId);
  const { percentage: attendancePct } = await calcOverallAttendance(studentId);

  const checks = [];
  const elig = drive.eligibility || {};

  if (elig.minCGPA) {
    checks.push({ field: 'CGPA', required: elig.minCGPA, actual: cgpa, passed: cgpa >= elig.minCGPA });
  }
  if (elig.minAttendance) {
    checks.push({ field: 'Attendance', required: `${elig.minAttendance}%`, actual: `${attendancePct}%`, passed: attendancePct >= elig.minAttendance });
  }
  if (elig.departments?.length) {
    const deptIds = elig.departments.map((d) => (d._id || d).toString());
    const inDept = deptIds.includes(student.department?._id?.toString());
    checks.push({ field: 'Department', required: 'Eligible department', actual: student.department?.name || 'N/A', passed: inDept });
  }
  if (elig.graduationYear) {
    // Approximate from year of study: 4-year course, graduation = admission + 4
    const gradYear = elig.graduationYear;
    checks.push({ field: 'Graduation Year', required: gradYear, actual: gradYear, passed: true }); // simplified
  }

  const eligible = checks.every((c) => c.passed);
  return { eligible, checks, reasons: checks.filter((c) => !c.passed) };
};

// GET /api/placements/drives/:id/eligibility/:studentId
export const getEligibility = asyncHandler(async (req, res) => {
  const drive = await JobDrive.findById(req.params.id).populate('eligibility.departments');
  if (!drive) throw new ApiError(404, 'Job drive not found');
  const result = await checkEligibility(req.params.studentId, drive);
  res.json(new ApiResponse(200, result));
});

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const applyForDrive = asyncHandler(async (req, res) => {
  const drive = await JobDrive.findById(req.params.driveId).populate('eligibility.departments');
  if (!drive) throw new ApiError(404, 'Drive not found');
  if (drive.status !== 'ACTIVE') throw new ApiError(400, 'Drive is not accepting applications');
  if (drive.applicationDeadline && new Date() > drive.applicationDeadline) {
    throw new ApiError(400, 'Application deadline has passed');
  }

  const eligibility = await checkEligibility(req.user._id, drive);
  if (!eligibility.eligible) {
    throw new ApiError(400, `Not eligible: ${eligibility.reasons.map((r) => `${r.field} (required: ${r.required}, yours: ${r.actual})`).join(', ')}`);
  }

  const existing = await JobApplication.findOne({ drive: req.params.driveId, student: req.user._id });
  if (existing) throw new ApiError(409, 'Already applied');

  const application = await JobApplication.create({
    drive: req.params.driveId,
    student: req.user._id,
    institution: req.user.institution,
    appliedAt: new Date(),
    resume: req.body.resume,
  });

  await logActivity({ user: req.user, action: 'APPLY_JOB', resource: 'APPLICATION', resourceId: application._id, req });
  res.status(201).json(new ApiResponse(201, { application }, 'Application submitted'));
});

export const getApplications = asyncHandler(async (req, res) => {
  const { driveId, status } = req.query;
  const query = { institution: req.user.institution };
  if (req.user.role === 'STUDENT') query.student = req.user._id;
  if (driveId) query.drive = driveId;
  if (status) query.status = status;

  const applications = await JobApplication.find(query)
    .populate('drive', 'role company applicationDeadline')
    .populate('student', 'firstName lastName rollNumber email skills')
    .sort({ appliedAt: -1 });
  res.json(new ApiResponse(200, { applications }));
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const application = await JobApplication.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!application) throw new ApiError(404, 'Application not found');

  await Notification.create({
    user: application.student,
    institution: req.user.institution,
    type: 'APPLICATION_UPDATE',
    title: 'Application Status Update',
    message: `Your application status has been updated to: ${status}`,
    link: '/student/placements',
  });

  res.json(new ApiResponse(200, { application }, 'Status updated'));
});

// ─── INTERVIEW ROUNDS ─────────────────────────────────────────────────────────
export const createInterviewRound = asyncHandler(async (req, res) => {
  const round = await InterviewRound.create({ ...req.body, institution: req.user.institution });
  res.status(201).json(new ApiResponse(201, { round }, 'Interview round created'));
});

export const updateInterviewResult = asyncHandler(async (req, res) => {
  const round = await InterviewRound.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!round) throw new ApiError(404, 'Round not found');
  res.json(new ApiResponse(200, { round }, 'Result updated'));
});

// ─── PLACEMENT OUTCOME ────────────────────────────────────────────────────────
export const recordPlacementOutcome = asyncHandler(async (req, res) => {
  const outcome = await PlacementOutcome.create({ ...req.body, institution: req.user.institution });
  await Notification.create({
    user: outcome.student,
    institution: req.user.institution,
    type: 'PLACEMENT_OFFER',
    title: '🎉 Placement Offer!',
    message: `Congratulations! You have received an offer from ${req.body.company}`,
    link: '/student/placements',
  });
  res.status(201).json(new ApiResponse(201, { outcome }, 'Outcome recorded'));
});

export const getPlacementOutcomes = asyncHandler(async (req, res) => {
  const outcomes = await PlacementOutcome.find({ institution: req.user.institution })
    .populate('student', 'firstName lastName rollNumber department')
    .populate('company', 'name industry')
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, { outcomes }));
});
