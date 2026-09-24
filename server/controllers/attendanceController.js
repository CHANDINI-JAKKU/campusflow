import Attendance from '../models/Attendance.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { calcAttendanceStats } from '../utils/calcAttendance.js';
import { ATTENDANCE_THRESHOLD } from '../config/constants.js';
import { logActivity } from '../utils/auditLog.js';

// POST /api/attendance — mark attendance for a session
export const markAttendance = asyncHandler(async (req, res) => {
  const { subjectId, date, sessionType, topic, records } = req.body;
  // records: [{ studentId, status }]

  // Check if session already exists for this date+subject
  const existing = await Attendance.findOne({ subject: subjectId, date: new Date(date), faculty: req.user._id });
  if (existing) throw new ApiError(409, 'Attendance already marked for this session');

  const session = await Attendance.create({
    subject: subjectId,
    faculty: req.user._id,
    institution: req.user.institution,
    department: req.user.department,
    date: new Date(date),
    sessionType: sessionType || 'LECTURE',
    topic,
  });

  // Create attendance records for each student
  const recordDocs = records.map((r) => ({
    attendance: session._id,
    student: r.studentId,
    status: r.status || 'ABSENT',
    institution: req.user.institution,
  }));
  await AttendanceRecord.insertMany(recordDocs);

  // Check for at-risk students and send notifications
  for (const r of records) {
    const stats = await calcAttendanceStats(r.studentId, subjectId);
    if (stats.isAtRisk) {
      const existing = await Notification.findOne({
        user: r.studentId,
        type: 'ATTENDANCE_WARNING',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      if (!existing) {
        await Notification.create({
          user: r.studentId,
          institution: req.user.institution,
          type: 'ATTENDANCE_WARNING',
          title: 'Attendance Warning',
          message: `Your attendance has dropped to ${stats.percentage}%. You need ${stats.classesNeeded} more consecutive classes to reach ${ATTENDANCE_THRESHOLD}%.`,
          link: '/student/attendance',
        });
      }
    }
  }

  await logActivity({ user: req.user, action: 'MARK_ATTENDANCE', resource: 'ATTENDANCE', resourceId: session._id, req });
  res.status(201).json(new ApiResponse(201, { session }, 'Attendance marked'));
});

// PUT /api/attendance/:sessionId — update attendance for a session
export const updateAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body;
  const session = await Attendance.findOne({ _id: req.params.sessionId, faculty: req.user._id });
  if (!session) throw new ApiError(404, 'Session not found or not yours');

  for (const r of records) {
    await AttendanceRecord.findOneAndUpdate(
      { attendance: session._id, student: r.studentId },
      { status: r.status },
      { upsert: true }
    );
  }
  session.isFinalized = true;
  await session.save();
  res.json(new ApiResponse(200, null, 'Attendance updated'));
});

// GET /api/attendance/sessions/:subjectId — faculty sees all sessions for a subject
export const getSessionsBySubject = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = { subject: req.params.subjectId };
  if (req.user.role === 'FACULTY') query.faculty = req.user._id;
  if (startDate) query.date = { $gte: new Date(startDate) };
  if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };

  const sessions = await Attendance.find(query)
    .populate('faculty', 'firstName lastName')
    .sort({ date: -1 });
  res.json(new ApiResponse(200, { sessions }));
});

// GET /api/attendance/session/:sessionId/records — get all records for a session
export const getSessionRecords = asyncHandler(async (req, res) => {
  const records = await AttendanceRecord.find({ attendance: req.params.sessionId })
    .populate('student', 'firstName lastName rollNumber');
  res.json(new ApiResponse(200, { records }));
});

// GET /api/attendance/student/:studentId — student's attendance stats per subject
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? req.user._id : req.params.studentId;

  // Authorization check
  if (req.user.role === 'STUDENT' && studentId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  // Get all subjects for this student
  const Subject = (await import('../models/Subject.js')).default;
  const Enrollment = (await import('../models/Enrollment.js')).default;

  const enrollments = await Enrollment.find({ student: studentId, isActive: true }).populate('course');
  const courseIds = enrollments.map((e) => e.course._id);
  const subjects = await Subject.find({ course: { $in: courseIds }, institution: req.user.institution });

  const stats = await Promise.all(
    subjects.map(async (sub) => {
      const s = await calcAttendanceStats(studentId, sub._id);
      return { subject: { _id: sub._id, name: sub.name, code: sub.code }, ...s };
    })
  );

  const overall = stats.length
    ? Math.round(stats.reduce((acc, s) => acc + s.percentage, 0) / stats.length)
    : 0;

  res.json(new ApiResponse(200, { subjects: stats, overall }));
});

// GET /api/attendance/students/:subjectId — for faculty, enrollment + attendance summary
export const getEnrolledStudentsForSubject = asyncHandler(async (req, res) => {
  const Subject = (await import('../models/Subject.js')).default;
  const subject = await Subject.findById(req.params.subjectId).populate('course');
  if (!subject) throw new ApiError(404, 'Subject not found');

  const enrollments = await Enrollment.find({ course: subject.course._id, isActive: true })
    .populate('student', 'firstName lastName rollNumber section year semester');

  const withStats = await Promise.all(
    enrollments.map(async (e) => {
      const stats = await calcAttendanceStats(e.student._id, req.params.subjectId);
      return { student: e.student, ...stats };
    })
  );

  res.json(new ApiResponse(200, { students: withStats }));
});
