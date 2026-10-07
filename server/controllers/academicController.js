import Timetable from '../models/Timetable.js';
import ClassSession from '../models/ClassSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Grade from '../models/Grade.js';
import AcademicCalendarEvent from '../models/AcademicCalendarEvent.js';
import Enrollment from '../models/Enrollment.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { calcAttendanceStats, calcOverallAttendance } from '../utils/calcAttendance.js';
import { logActivity } from '../utils/auditLog.js';

const getNormalizedToday = (customDate) => {
  const d = customDate ? new Date(customDate) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// GET /api/academic/timetable/today OR /api/academic/daily-classes
export const getTodayTimetable = asyncHandler(async (req, res) => {
  const targetDate = req.query.date ? new Date(req.query.date) : new Date();
  const todayDate = getNormalizedToday(targetDate);
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  const query = {
    institution: req.user.institution,
    dayOfWeek,
    isActive: true
  };

  if (req.user.role === 'STUDENT') {
    // Student sees classes for subjects they are actively enrolled in
    const activeEnrollments = await Enrollment.find({
      student: req.user._id,
      status: 'ACTIVE',
      isActive: true
    });

    const enrolledSubjectIds = activeEnrollments.map((e) => e.subject).filter(Boolean);
    const enrolledSections = [...new Set(activeEnrollments.map((e) => e.section).filter(Boolean))];
    if (req.user.section) enrolledSections.push(req.user.section);

    query.subject = { $in: enrolledSubjectIds };
    query.section = { $in: enrolledSections };
  } else if (req.user.role === 'FACULTY') {
    query.faculty = req.user._id;
  } else if (req.user.role === 'COLLEGE_ADMIN' || req.user.role === 'SUPER_ADMIN') {
    if (req.query.department) query.department = req.query.department;
    if (req.query.section) query.section = req.query.section;
    if (req.query.faculty) query.faculty = req.query.faculty;
  }

  const timetableEntries = await Timetable.find(query)
    .populate('subject', 'name code credits department')
    .populate('course', 'name code')
    .populate('department', 'name code')
    .populate('faculty', 'firstName lastName email employeeId')
    .sort({ startTime: 1 });

  // For each timetable entry, find or create the ClassSession for todayDate
  const dailyClasses = await Promise.all(
    timetableEntries.map(async (entry) => {
      let session = await ClassSession.findOne({
        timetable: entry._id,
        date: todayDate
      });

      // Count registered students for this EXACT subject and section via Enrollment
      const enrolledStudentCount = await Enrollment.countDocuments({
        institution: entry.institution,
        subject: entry.subject?._id || entry.subject,
        section: entry.section,
        status: 'ACTIVE',
        isActive: true
      });

      if (!session) {
        session = await ClassSession.create({
          institution: entry.institution,
          department: entry.department,
          course: entry.course,
          year: entry.year,
          semester: entry.semester,
          section: entry.section,
          subject: entry.subject?._id || entry.subject,
          faculty: entry.faculty?._id || entry.faculty,
          timetable: entry._id,
          academicYear: entry.academicYear || '2026-2027',
          date: todayDate,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room,
          sessionType: entry.sessionType || 'LECTURE',
          status: 'SCHEDULED',
          totalStudents: enrolledStudentCount
        });
      } else if (session.totalStudents !== enrolledStudentCount) {
        session.totalStudents = enrolledStudentCount;
        await session.save();
      }

      // Check attendance status for student
      let studentAttendanceStatus = null;
      if (req.user.role === 'STUDENT') {
        const myRecord = await AttendanceRecord.findOne({
          classSession: session._id,
          student: req.user._id
        });
        studentAttendanceStatus = myRecord ? myRecord.status : (session.status === 'COMPLETED' ? 'ABSENT' : 'UPCOMING');
      }

      return {
        _id: session._id,
        sessionId: session._id,
        timetableId: entry._id,
        subject: entry.subject,
        course: entry.course,
        department: entry.department,
        year: entry.year,
        semester: entry.semester,
        section: entry.section,
        faculty: entry.faculty,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room || session.room,
        date: todayDate,
        dayOfWeek,
        sessionType: entry.sessionType || session.sessionType,
        status: session.status,
        isFinalized: session.isFinalized,
        totalStudents: enrolledStudentCount,
        presentCount: session.presentCount || 0,
        absentCount: session.absentCount || 0,
        studentAttendanceStatus
      };
    })
  );

  res.json(new ApiResponse(200, {
    timetable: dailyClasses,
    date: todayDate,
    dayOfWeek,
    totalClasses: dailyClasses.length
  }));
});

// GET /api/academic/timetable — weekly timetable
export const getTimetable = asyncHandler(async (req, res) => {
  const { dayOfWeek, faculty, semester, section, department, year } = req.query;
  const query = { institution: req.user.institution, isActive: true };

  if (dayOfWeek !== undefined) query.dayOfWeek = Number(dayOfWeek);
  if (faculty) query.faculty = faculty;
  if (semester) query.semester = Number(semester);
  if (section) query.section = section;
  if (department) query.department = department;
  if (year) query.year = Number(year);

  if (req.user.role === 'STUDENT') {
    const activeEnrollments = await Enrollment.find({
      student: req.user._id,
      status: 'ACTIVE',
      isActive: true
    });
    const enrolledSubjects = activeEnrollments.map((e) => e.subject).filter(Boolean);
    const enrolledSections = [...new Set(activeEnrollments.map((e) => e.section).filter(Boolean))];
    if (req.user.section) enrolledSections.push(req.user.section);

    query.subject = { $in: enrolledSubjects };
    query.section = { $in: enrolledSections };
  } else if (req.user.role === 'FACULTY') {
    query.faculty = req.user._id;
  }

  const timetable = await Timetable.find(query)
    .populate('subject', 'name code credits')
    .populate('course', 'name code')
    .populate('department', 'name code')
    .populate('faculty', 'firstName lastName employeeId')
    .sort({ dayOfWeek: 1, startTime: 1 });

  res.json(new ApiResponse(200, { timetable }));
});

// GET /api/academic/session/:sessionId/roster — fetch EXACT registered students from ENROLLMENT collection
export const getClassSessionRoster = asyncHandler(async (req, res) => {
  const session = await ClassSession.findById(req.params.sessionId)
    .populate('subject', 'name code credits')
    .populate('department', 'name code')
    .populate('course', 'name code')
    .populate('faculty', 'firstName lastName employeeId');

  if (!session) throw new ApiError(404, 'Class session not found');

  // Verify authorization
  if (req.user.role === 'FACULTY' && session.faculty._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied: You are not the assigned faculty for this class session');
  }

  // Fetch only students with an ACTIVE Enrollment for this subject and section!
  const enrollments = await Enrollment.find({
    institution: session.institution,
    subject: session.subject._id || session.subject,
    section: session.section,
    status: 'ACTIVE',
    isActive: true
  }).populate({
    path: 'student',
    select: 'firstName lastName rollNumber email avatar section year semester isActive',
    match: { isActive: true }
  });

  const students = enrollments
    .map((e) => e.student)
    .filter(Boolean)
    .sort((a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));

  // Fetch existing attendance records for this session
  const existingRecords = await AttendanceRecord.find({
    classSession: session._id
  });

  const recordMap = new Map();
  existingRecords.forEach((r) => {
    recordMap.set(r.student.toString(), r.status);
  });

  // Calculate overall attendance for each student in this subject
  const rosterWithStats = await Promise.all(
    students.map(async (st) => {
      const stats = await calcAttendanceStats(st._id, session.subject._id);
      const currentSessionStatus = recordMap.get(st._id.toString()) || (session.status === 'COMPLETED' ? 'ABSENT' : 'PRESENT');
      return {
        student: st,
        todayStatus: currentSessionStatus,
        overallAttendance: stats.percentage !== null ? `${stats.percentage}%` : 'No records yet',
        overallPercentage: stats.percentage,
        attendedClasses: stats.attended,
        totalClasses: stats.totalClasses,
        isAtRisk: stats.isAtRisk
      };
    })
  );

  res.json(new ApiResponse(200, {
    session,
    students: rosterWithStats,
    totalStudents: students.length,
    isCompleted: session.status === 'COMPLETED'
  }));
});

// POST /api/academic/session/:sessionId/attendance — record/update attendance for a class session
export const submitSessionAttendance = asyncHandler(async (req, res) => {
  const { records, notes } = req.body; // records: [{ studentId, status: 'PRESENT' | 'ABSENT' | 'LATE' }]
  if (!Array.isArray(records)) {
    throw new ApiError(400, 'Attendance records array is required');
  }

  const session = await ClassSession.findById(req.params.sessionId);
  if (!session) throw new ApiError(404, 'Class session not found');

  if (req.user.role === 'FACULTY' && session.faculty.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied: You cannot mark attendance for another faculty member’s class');
  }

  let presentCount = 0;
  let absentCount = 0;

  if (records.length > 0) {
    const ops = records.map((r) => {
      const status = (r.status || 'PRESENT').toUpperCase();
      if (status === 'PRESENT' || status === 'LATE') presentCount++;
      else absentCount++;

      return {
        updateOne: {
          filter: { classSession: session._id, student: r.studentId },
          update: {
            $set: {
              classSession: session._id,
              student: r.studentId,
              subject: session.subject,
              department: session.department,
              course: session.course,
              section: session.section,
              faculty: session.faculty,
              institution: session.institution,
              date: session.date,
              status,
              remarks: r.remarks || ''
            }
          },
          upsert: true
        }
      };
    });

    await AttendanceRecord.bulkWrite(ops);
  }

  session.status = 'COMPLETED';
  session.isFinalized = true;
  session.presentCount = presentCount;
  session.absentCount = absentCount;
  session.totalStudents = records.length;
  if (notes) session.notes = notes;
  await session.save();

  // Audit log
  await logActivity({
    user: req.user,
    institution: session.institution,
    action: 'MARK_ATTENDANCE',
    resource: 'CLASS_SESSION',
    resourceId: session._id,
    req
  });

  // Check and trigger notifications for students with low attendance
  for (const r of records) {
    const stats = await calcAttendanceStats(r.studentId, session.subject);
    if (stats.isAtRisk) {
      const existingNotif = await Notification.findOne({
        user: r.studentId,
        type: 'ATTENDANCE_WARNING',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      if (!existingNotif) {
        await Notification.create({
          user: r.studentId,
          institution: session.institution,
          type: 'ATTENDANCE_WARNING',
          title: '⚠️ Low Attendance Warning',
          message: `Your attendance in ${session.subject} has fallen to ${stats.percentage}%. Please attend the next ${stats.classesNeeded} classes to meet the 75% requirement.`,
          link: '/student/attendance'
        });
      }
    }
  }

  res.json(new ApiResponse(200, {
    session,
    presentCount,
    absentCount,
    totalStudents: records.length
  }, 'Attendance recorded and saved successfully'));
});

// POST /api/academic/session/:sessionId/marks — enter/update class assessment marks
export const submitClassMarks = asyncHandler(async (req, res) => {
  const { assessmentType, maxMarks, marksRecords } = req.body;

  if (!assessmentType || !maxMarks || !Array.isArray(marksRecords)) {
    throw new ApiError(400, 'assessmentType, maxMarks and marksRecords array are required');
  }

  const session = await ClassSession.findById(req.params.sessionId);
  if (!session) throw new ApiError(404, 'Class session not found');

  if (req.user.role === 'FACULTY' && session.faculty.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied: You cannot enter marks for another faculty’s class');
  }

  for (const rec of marksRecords) {
    let gradeDoc = await Grade.findOne({
      student: rec.studentId,
      subject: session.subject,
      semester: session.semester,
      academicYear: session.academicYear
    });

    if (!gradeDoc) {
      gradeDoc = new Grade({
        student: rec.studentId,
        subject: session.subject,
        course: session.course,
        institution: session.institution,
        department: session.department,
        semester: session.semester,
        academicYear: session.academicYear,
        internalMarks: []
      });
    }

    const existingIndex = gradeDoc.internalMarks.findIndex(m => m.type === assessmentType);
    if (existingIndex >= 0) {
      gradeDoc.internalMarks[existingIndex].marks = Number(rec.marks);
      gradeDoc.internalMarks[existingIndex].maxMarks = Number(maxMarks);
      gradeDoc.internalMarks[existingIndex].date = new Date();
    } else {
      gradeDoc.internalMarks.push({
        type: assessmentType,
        marks: Number(rec.marks),
        maxMarks: Number(maxMarks),
        date: new Date()
      });
    }

    gradeDoc.totalInternal = gradeDoc.internalMarks.reduce((acc, m) => acc + (m.marks || 0), 0);
    gradeDoc.total = gradeDoc.totalInternal + (gradeDoc.totalExternal || 0);

    await gradeDoc.save();
  }

  await logActivity({
    user: req.user,
    institution: session.institution,
    action: 'UPDATE_MARKS',
    resource: 'GRADE',
    resourceId: session._id,
    req
  });

  res.json(new ApiResponse(200, null, `${assessmentType} marks saved for ${marksRecords.length} students`));
});

// GET /api/academic/faculty/dashboard-stats — comprehensive summary for faculty dashboard
export const getFacultyDashboardStats = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;
  const todayDate = getNormalizedToday();
  const dayOfWeek = new Date().getDay();

  const todayTimetables = await Timetable.find({
    faculty: facultyId,
    dayOfWeek,
    isActive: true
  }).populate('subject', 'name code').populate('department', 'name code').populate('course', 'name code');

  let attendancePendingCount = 0;
  let attendanceCompletedCount = 0;
  let totalEnrolledStudents = 0;

  const todayClasses = await Promise.all(
    todayTimetables.map(async (t) => {
      let session = await ClassSession.findOne({ timetable: t._id, date: todayDate });
      
      const studentCount = await Enrollment.countDocuments({
        institution: t.institution,
        subject: t.subject?._id || t.subject,
        section: t.section,
        status: 'ACTIVE',
        isActive: true
      });

      totalEnrolledStudents += studentCount;

      if (!session) {
        session = await ClassSession.create({
          institution: t.institution,
          department: t.department,
          course: t.course,
          year: t.year,
          semester: t.semester,
          section: t.section,
          subject: t.subject?._id || t.subject,
          faculty: facultyId,
          timetable: t._id,
          academicYear: t.academicYear || '2026-2027',
          date: todayDate,
          startTime: t.startTime,
          endTime: t.endTime,
          room: t.room,
          status: 'SCHEDULED',
          totalStudents: studentCount
        });
      }

      if (session.status === 'COMPLETED') {
        attendanceCompletedCount++;
      } else {
        attendancePendingCount++;
      }

      return {
        _id: session._id,
        timetableId: t._id,
        subject: t.subject,
        department: t.department,
        course: t.course,
        year: t.year,
        semester: t.semester,
        section: t.section,
        startTime: t.startTime,
        endTime: t.endTime,
        room: t.room,
        status: session.status,
        totalStudents: studentCount,
        presentCount: session.presentCount || 0,
        absentCount: session.absentCount || 0,
        isCompleted: session.status === 'COMPLETED'
      };
    })
  );

  const weeklyClassCount = await Timetable.countDocuments({ faculty: facultyId, isActive: true });

  res.json(new ApiResponse(200, {
    todayClasses,
    totalTodayClasses: todayClasses.length,
    totalStudents: totalEnrolledStudents,
    attendancePending: attendancePendingCount,
    attendanceCompleted: attendanceCompletedCount,
    weeklyClassCount
  }));
});

// Admin Timetable & Enrollment Management Endpoints
export const createTimetableEntry = asyncHandler(async (req, res) => {
  const timetable = await Timetable.create({ ...req.body, institution: req.user.institution });
  res.status(201).json(new ApiResponse(201, { timetable }, 'Timetable entry created'));
});

export const updateTimetableEntry = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    req.body,
    { new: true, runValidators: true },
  );
  if (!timetable) throw new ApiError(404, 'Timetable entry not found');
  res.json(new ApiResponse(200, { timetable }, 'Timetable entry updated'));
});

// GET /api/academic/enrollment-matrix — Admin gets students in a section and their enrolled subjects
export const getEnrollmentMatrix = asyncHandler(async (req, res) => {
  const { department, course, year, semester, section, subject } = req.query;
  const instId = req.user.institution;

  const query = { institution: instId, role: 'STUDENT', isActive: true };
  if (department) query.department = department;
  if (year) query.year = Number(year);
  if (semester) query.semester = Number(semester);
  if (section) query.section = section;

  const students = await User.find(query)
    .select('firstName lastName rollNumber email department year semester section')
    .sort({ rollNumber: 1 });

  let enrolledStudentIds = [];
  if (subject) {
    const enrollments = await Enrollment.find({
      institution: instId,
      subject,
      section,
      status: 'ACTIVE'
    });
    enrolledStudentIds = enrollments.map((e) => e.student.toString());
  }

  res.json(new ApiResponse(200, {
    students,
    enrolledStudentIds,
    totalStudents: students.length,
    enrolledCount: enrolledStudentIds.length
  }));
});

// POST /api/academic/enrollments/batch — Admin enrolls selected students in a subject
export const batchEnrollStudents = asyncHandler(async (req, res) => {
  const { subjectId, departmentId, courseId, year, semester, section, studentIds, academicYear } = req.body;

  if (!subjectId || !Array.isArray(studentIds)) {
    throw new ApiError(400, 'subjectId and studentIds array are required');
  }

  const subjectDoc = await Subject.findById(subjectId);
  if (!subjectDoc) throw new ApiError(404, 'Subject not found');

  const instId = req.user.institution;
  const acadYear = academicYear || '2026-2027';

  // Mark existing enrollments for this subject and section as DROPPED if not in studentIds
  await Enrollment.updateMany(
    {
      institution: instId,
      subject: subjectId,
      section: section || 'A',
      student: { $nin: studentIds }
    },
    { status: 'DROPPED', isActive: false }
  );

  // Upsert active enrollments for selected studentIds
  const ops = studentIds.map((sId) => ({
    updateOne: {
      filter: {
        student: sId,
        subject: subjectId,
        academicYear: acadYear
      },
      update: {
        $set: {
          student: sId,
          subject: subjectId,
          institution: instId,
          department: departmentId || subjectDoc.department,
          course: courseId || subjectDoc.course,
          year: Number(year) || 2,
          semester: Number(semester) || 1,
          section: section || 'A',
          academicYear: acadYear,
          status: 'ACTIVE',
          isActive: true
        }
      },
      upsert: true
    }
  }));

  if (ops.length > 0) {
    await Enrollment.bulkWrite(ops);
  }

  await logActivity({
    user: req.user,
    institution: instId,
    action: 'BATCH_ENROLL_STUDENTS',
    resource: 'ENROLLMENT',
    req
  });

  res.json(new ApiResponse(200, { enrolledCount: studentIds.length }, `Successfully enrolled ${studentIds.length} students in ${subjectDoc.name}`));
});

export const getCalendar = asyncHandler(async (req, res) => {
  const { from, to, semester, department } = req.query;
  const query = { institution: req.user.institution, isPublished: true };
  if (from || to) query.startDate = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (semester) query.semester = Number(semester);
  if (department) query.department = department;
  if (req.user.role === 'STUDENT') {
    query.$or = [{ department: req.user.department }, { department: null }];
    query.semester = req.user.semester;
  }
  const events = await AcademicCalendarEvent.find(query)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .sort({ startDate: 1 });
  res.json(new ApiResponse(200, { events }));
});

export const createCalendarEvent = asyncHandler(async (req, res) => {
  const event = await AcademicCalendarEvent.create({ ...req.body, institution: req.user.institution });
  res.status(201).json(new ApiResponse(201, { event }, 'Academic calendar event created'));
});

export const updateCalendarEvent = asyncHandler(async (req, res) => {
  const event = await AcademicCalendarEvent.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    req.body,
    { new: true, runValidators: true },
  );
  if (!event) throw new ApiError(404, 'Academic calendar event not found');
  res.json(new ApiResponse(200, { event }, 'Academic calendar event updated'));
});

export const deleteCalendarEvent = asyncHandler(async (req, res) => {
  const event = await AcademicCalendarEvent.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
  if (!event) throw new ApiError(404, 'Academic calendar event not found');
  res.json(new ApiResponse(200, null, 'Academic calendar event deleted'));
});
