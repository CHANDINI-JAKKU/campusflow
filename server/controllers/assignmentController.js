import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Enrollment from '../models/Enrollment.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { logActivity } from '../utils/auditLog.js';

// GET /api/assignments — list assignments
export const getAssignments = asyncHandler(async (req, res) => {
  const { subject, course, status, page = 1, limit = 20 } = req.query;
  const query = { institution: req.user.institution };
  if (subject) query.subject = subject;
  if (course) query.course = course;
  if (status) query.status = status;
  if (req.user.role === 'FACULTY') query.faculty = req.user._id;
  if (req.user.role === 'STUDENT') {
    // Student sees assignments for their enrolled courses
    const enrollments = await Enrollment.find({ student: req.user._id, isActive: true });
    query.course = { $in: enrollments.map((e) => e.course) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .populate('subject', 'name code')
      .populate('course', 'name code')
      .populate('faculty', 'firstName lastName')
      .sort({ deadline: 1 })
      .skip(skip).limit(parseInt(limit)),
    Assignment.countDocuments(query),
  ]);

  // For students, add submission status
  if (req.user.role === 'STUDENT') {
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id,
    }).select('assignment status marks submittedAt');

    const subMap = {};
    submissions.forEach((s) => { subMap[s.assignment.toString()] = s; });

    const enriched = assignments.map((a) => ({
      ...a.toObject(),
      submission: subMap[a._id.toString()] || null,
    }));
    return res.json(new ApiResponse(200, { assignments: enriched, total, page: parseInt(page) }));
  }

  res.json(new ApiResponse(200, { assignments, total, page: parseInt(page) }));
});

// GET /api/assignments/:id
export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('course', 'name code semester')
    .populate('faculty', 'firstName lastName');
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  res.json(new ApiResponse(200, { assignment }));
});

// POST /api/assignments
export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subjectId, courseId, deadline, maxMarks, allowedFileTypes, allowLateSubmission, allowResubmission } = req.body;
  const assignment = await Assignment.create({
    title, description,
    subject: subjectId,
    course: courseId,
    faculty: req.user._id,
    institution: req.user.institution,
    department: req.user.department,
    deadline: new Date(deadline),
    maxMarks: maxMarks || 100,
    allowedFileTypes: allowedFileTypes || ['pdf', 'doc', 'docx'],
    allowLateSubmission: allowLateSubmission || false,
    allowResubmission: allowResubmission || false,
  });

  // Notify enrolled students
  const enrollments = await Enrollment.find({ course: courseId, isActive: true });
  const notifications = enrollments.map((e) => ({
    user: e.student,
    institution: req.user.institution,
    type: 'NEW_ASSIGNMENT',
    title: 'New Assignment',
    message: `New assignment "${title}" posted. Due: ${new Date(deadline).toLocaleDateString()}`,
    link: '/student/assignments',
  }));
  if (notifications.length) await Notification.insertMany(notifications);

  await logActivity({ user: req.user, action: 'CREATE_ASSIGNMENT', resource: 'ASSIGNMENT', resourceId: assignment._id, req });
  res.status(201).json(new ApiResponse(201, { assignment }, 'Assignment created'));
});

// PUT /api/assignments/:id
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndUpdate(
    { _id: req.params.id, faculty: req.user._id },
    req.body, { new: true }
  );
  if (!assignment) throw new ApiError(404, 'Assignment not found or not yours');
  res.json(new ApiResponse(200, { assignment }, 'Assignment updated'));
});

// DELETE /api/assignments/:id
export const deleteAssignment = asyncHandler(async (req, res) => {
  await Assignment.findOneAndUpdate({ _id: req.params.id, faculty: req.user._id }, { status: 'CLOSED' });
  res.json(new ApiResponse(200, null, 'Assignment closed'));
});

// GET /api/assignments/:id/submissions — faculty views all submissions
export const getSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, faculty: req.user._id });
  if (!assignment && req.user.role !== 'COLLEGE_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    throw new ApiError(403, 'Access denied');
  }
  const submissions = await AssignmentSubmission.find({ assignment: req.params.id })
    .populate('student', 'firstName lastName rollNumber section year')
    .sort({ submittedAt: -1 });
  res.json(new ApiResponse(200, { submissions }));
});

// POST /api/assignments/:id/submit — student submits
export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  const now = new Date();
  const isLate = now > assignment.deadline;
  if (isLate && !assignment.allowLateSubmission) throw new ApiError(400, 'Assignment deadline has passed');

  const fileUrls = req.files?.map((f) => ({
    filename: f.originalname,
    url: `/uploads/${req.user._id}/${f.filename}`,
    mimetype: f.mimetype,
  })) || [];

  let submission = await AssignmentSubmission.findOne({ assignment: req.params.id, student: req.user._id });
  if (submission) {
    if (submission.status === 'GRADED' && !assignment.allowResubmission) {
      throw new ApiError(400, 'Resubmission not allowed for graded assignments');
    }
    submission.submissionHistory.push({ files: submission.files, submittedAt: submission.submittedAt, status: submission.status });
    submission.files = fileUrls;
    submission.submittedAt = now;
    submission.status = isLate ? 'LATE' : 'SUBMITTED';
    await submission.save();
  } else {
    submission = await AssignmentSubmission.create({
      assignment: req.params.id,
      student: req.user._id,
      institution: req.user.institution,
      files: fileUrls,
      submittedAt: now,
      status: isLate ? 'LATE' : 'SUBMITTED',
    });
  }

  await logActivity({ user: req.user, action: 'SUBMIT_ASSIGNMENT', resource: 'SUBMISSION', resourceId: submission._id, req });
  res.json(new ApiResponse(200, { submission }, 'Assignment submitted'));
});

// PUT /api/assignments/submissions/:submissionId/grade — faculty grades
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;
  const submission = await AssignmentSubmission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');

  const assignment = await Assignment.findOne({ _id: submission.assignment, faculty: req.user._id });
  if (!assignment) throw new ApiError(403, 'Not your assignment');
  if (marks > assignment.maxMarks) throw new ApiError(400, `Marks cannot exceed ${assignment.maxMarks}`);

  submission.marks = marks;
  submission.feedback = feedback;
  submission.status = 'GRADED';
  submission.gradedBy = req.user._id;
  submission.gradedAt = new Date();
  await submission.save();

  // Notify student
  await Notification.create({
    user: submission.student,
    institution: req.user.institution,
    type: 'ASSIGNMENT_GRADED',
    title: 'Assignment Graded',
    message: `Your submission for "${assignment.title}" has been graded. Marks: ${marks}/${assignment.maxMarks}`,
    link: '/student/assignments',
  });

  await logActivity({ user: req.user, action: 'GRADE_SUBMISSION', resource: 'SUBMISSION', resourceId: submission._id, req });
  res.json(new ApiResponse(200, { submission }, 'Submission graded'));
});
