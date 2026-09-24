import Grade from '../models/Grade.js';
import Subject from '../models/Subject.js';
import Enrollment from '../models/Enrollment.js';
import AcademicRecord from '../models/AcademicRecord.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { calcGradePoints, calcSGPA, calcCGPA } from '../utils/calcCGPA.js';
import { logActivity } from '../utils/auditLog.js';

// GET /api/grades/student/:studentId — all grades for a student
export const getStudentGrades = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? req.user._id : req.params.studentId;
  if (req.user.role === 'STUDENT' && studentId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }
  const grades = await Grade.find({ student: studentId })
    .populate('subject', 'name code credits maxInternalMarks maxExternalMarks')
    .populate('course', 'name code semester')
    .sort({ semester: -1 });

  const cgpa = await calcCGPA(studentId);
  res.json(new ApiResponse(200, { grades, cgpa }));
});

// GET /api/grades/subject/:subjectId — faculty sees grades for a subject
export const getSubjectGrades = asyncHandler(async (req, res) => {
  const grades = await Grade.find({ subject: req.params.subjectId })
    .populate('student', 'firstName lastName rollNumber section')
    .sort({ 'student.rollNumber': 1 });
  res.json(new ApiResponse(200, { grades }));
});

// POST /api/grades — create or update grade entry
export const upsertGrade = asyncHandler(async (req, res) => {
  const { studentId, subjectId, courseId, semester, academicYear, internalMarks, externalMarks } = req.body;

  const subject = await Subject.findById(subjectId);
  if (!subject) throw new ApiError(404, 'Subject not found');

  const totalInternal = internalMarks?.reduce((acc, m) => acc + (m.marks || 0), 0) || 0;
  const totalExternal = externalMarks || 0;
  const total = totalInternal + totalExternal;
  const maxTotal = (subject.maxInternalMarks || 30) + (subject.maxExternalMarks || 70);
  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const { grade, gradePoints } = calcGradePoints(percentage);

  const gradeDoc = await Grade.findOneAndUpdate(
    { student: studentId, subject: subjectId, semester, academicYear },
    { student: studentId, subject: subjectId, course: courseId, institution: req.user.institution,
      department: req.user.department, semester, academicYear,
      internalMarks, externalMarks: totalExternal, totalInternal, totalExternal, total, grade, gradePoints },
    { upsert: true, new: true }
  );

  await logActivity({ user: req.user, action: 'UPDATE_GRADE', resource: 'GRADE', resourceId: gradeDoc._id, req });
  res.json(new ApiResponse(200, { grade: gradeDoc }, 'Grade saved'));
});

// POST /api/grades/finalize/:studentId/:semester — finalize semester, calc SGPA/CGPA
export const finalizeSemester = asyncHandler(async (req, res) => {
  const { studentId, semester } = req.params;
  const { academicYear } = req.body;

  const grades = await Grade.find({ student: studentId, semester: parseInt(semester), academicYear })
    .populate('subject', 'credits');

  if (!grades.length) throw new ApiError(400, 'No grades found for this semester');

  await Grade.updateMany({ student: studentId, semester: parseInt(semester), academicYear }, { isFinalized: true });

  const sgpa = calcSGPA(grades);
  const cgpa = await calcCGPA(studentId);

  await AcademicRecord.findOneAndUpdate(
    { student: studentId, semester: parseInt(semester), academicYear },
    { student: studentId, institution: req.user.institution, semester: parseInt(semester), academicYear, sgpa, cgpa,
      subjects: grades.map((g) => g._id) },
    { upsert: true, new: true }
  );

  res.json(new ApiResponse(200, { sgpa, cgpa }, 'Semester finalized'));
});

// GET /api/grades/academic-record/:studentId
export const getAcademicRecord = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId === 'me' ? req.user._id : req.params.studentId;
  const records = await AcademicRecord.find({ student: studentId })
    .populate({ path: 'subjects', populate: { path: 'subject', select: 'name code credits' } })
    .sort({ semester: 1 });
  const cgpa = await calcCGPA(studentId);
  res.json(new ApiResponse(200, { records, cgpa }));
});
