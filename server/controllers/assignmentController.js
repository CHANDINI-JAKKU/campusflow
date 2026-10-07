import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Enrollment from '../models/Enrollment.js';
import Subject from '../models/Subject.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { logActivity } from '../utils/auditLog.js';

// GET /api/assignments — list assignments
export const getAssignments = asyncHandler(async (req, res) => {
  const { subject, course, section, status, page = 1, limit = 50 } = req.query;
  const query = { institution: req.user.institution };

  if (subject) query.subject = subject;
  if (course) query.course = course;
  if (section) query.section = section;
  if (status) query.status = status;

  if (req.user.role === 'FACULTY') {
    query.faculty = req.user._id;
  } else if (req.user.role === 'STUDENT') {
    // Student sees assignments ONLY for subjects & sections they are actively enrolled in
    const activeEnrollments = await Enrollment.find({
      student: req.user._id,
      status: 'ACTIVE',
      isActive: true
    });

    const enrolledSubjects = activeEnrollments.map((e) => e.subject).filter(Boolean);
    const enrolledSections = [...new Set(activeEnrollments.map((e) => e.section).filter(Boolean))];
    if (req.user.section) enrolledSections.push(req.user.section);

    query.$and = [
      { subject: { $in: enrolledSubjects } },
      { $or: [{ section: { $in: enrolledSections } }, { section: null }, { section: '' }] }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [assignments, total] = await Promise.all([
    Assignment.find(query)
      .populate('subject', 'name code credits')
      .populate('course', 'name code')
      .populate('department', 'name code')
      .populate('faculty', 'firstName lastName employeeId email')
      .sort({ deadline: 1 })
      .skip(skip).limit(parseInt(limit)),
    Assignment.countDocuments(query),
  ]);

  // For students, enrich with their individual submission status
  if (req.user.role === 'STUDENT') {
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id,
    }).select('assignment status marks submittedAt feedback');

    const subMap = {};
    submissions.forEach((s) => { subMap[s.assignment.toString()] = s; });

    const enriched = assignments.map((a) => ({
      ...a.toObject(),
      submission: subMap[a._id.toString()] || null,
    }));
    return res.json(new ApiResponse(200, { assignments: enriched, total, page: parseInt(page) }));
  }

  // For faculty, count submissions and enrolled count
  const enrichedForFaculty = await Promise.all(
    assignments.map(async (a) => {
      const enrolledCount = await Enrollment.countDocuments({
        institution: a.institution,
        subject: a.subject?._id || a.subject,
        section: a.section,
        status: 'ACTIVE'
      });
      const submittedCount = await AssignmentSubmission.countDocuments({
        assignment: a._id
      });
      const gradedCount = await AssignmentSubmission.countDocuments({
        assignment: a._id,
        status: 'GRADED'
      });

      return {
        ...a.toObject(),
        enrolledCount,
        submittedCount,
        gradedCount
      };
    })
  );

  res.json(new ApiResponse(200, { assignments: enrichedForFaculty, total, page: parseInt(page) }));
});

// GET /api/assignments/:id
export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('subject', 'name code credits')
    .populate('course', 'name code semester')
    .populate('department', 'name code')
    .populate('faculty', 'firstName lastName employeeId email');
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  if (req.user.role === 'STUDENT') {
    const submission = await AssignmentSubmission.findOne({
      assignment: assignment._id,
      student: req.user._id
    });
    return res.json(new ApiResponse(200, { assignment, submission }));
  }

  res.json(new ApiResponse(200, { assignment }));
});

// POST /api/assignments — Faculty creates assignment
export const createAssignment = asyncHandler(async (req, res) => {
  const { 
    title, description, instructions, subjectId, courseId, 
    departmentId, year, semester, section, deadline, maxMarks, 
    allowedFileTypes, allowLateSubmission, allowResubmission 
  } = req.body;

  const subjectDoc = await Subject.findById(subjectId);
  if (!subjectDoc) throw new ApiError(404, 'Subject not found');

  const assignment = await Assignment.create({
    title, 
    description,
    instructions,
    subject: subjectId,
    course: courseId || subjectDoc.course,
    department: departmentId || subjectDoc.department || req.user.department,
    faculty: req.user._id,
    institution: req.user.institution,
    year: year || 2,
    semester: semester || 1,
    section: section || 'A',
    deadline: new Date(deadline),
    maxMarks: Number(maxMarks) || 20,
    allowedFileTypes: allowedFileTypes || ['pdf', 'doc', 'docx', 'zip', 'sql', 'cpp'],
    allowLateSubmission: Boolean(allowLateSubmission),
    allowResubmission: Boolean(allowResubmission),
    status: 'ACTIVE'
  });

  // Notify ONLY the actively enrolled students for this exact subject + section
  const enrolledStudents = await Enrollment.find({
    institution: req.user.institution,
    subject: subjectId,
    section: section || 'A',
    status: 'ACTIVE',
    isActive: true
  });

  const notifications = enrolledStudents.map((e) => ({
    user: e.student,
    institution: req.user.institution,
    type: 'NEW_ASSIGNMENT',
    title: `New Assignment: ${subjectDoc.name}`,
    message: `Assignment "${title}" posted for ${subjectDoc.name} (Section ${section || 'A'}). Due: ${new Date(deadline).toLocaleDateString()}`,
    link: '/student/assignments',
  }));

  if (notifications.length) {
    await Notification.insertMany(notifications);
  }

  await logActivity({ user: req.user, action: 'CREATE_ASSIGNMENT', resource: 'ASSIGNMENT', resourceId: assignment._id, req });
  res.status(201).json(new ApiResponse(201, { assignment }, 'Assignment published successfully'));
});

// PUT /api/assignments/:id
export const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOneAndUpdate(
    { _id: req.params.id, faculty: req.user._id },
    req.body, 
    { new: true }
  );
  if (!assignment) throw new ApiError(404, 'Assignment not found or unauthorized');
  res.json(new ApiResponse(200, { assignment }, 'Assignment updated'));
});

// DELETE /api/assignments/:id
export const deleteAssignment = asyncHandler(async (req, res) => {
  await Assignment.findOneAndUpdate({ _id: req.params.id, faculty: req.user._id }, { status: 'CLOSED' });
  res.json(new ApiResponse(200, null, 'Assignment closed'));
});

// GET /api/assignments/:id/submissions — faculty views all registered students & submissions
export const getSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('subject', 'name code')
    .populate('faculty', 'firstName lastName');

  if (!assignment) throw new ApiError(404, 'Assignment not found');

  if (req.user.role === 'FACULTY' && assignment.faculty._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied: You are not the instructor for this assignment');
  }

  // Get enrolled students for this subject & section
  const enrollments = await Enrollment.find({
    institution: assignment.institution,
    subject: assignment.subject._id || assignment.subject,
    section: assignment.section,
    status: 'ACTIVE',
    isActive: true
  }).populate('student', 'firstName lastName rollNumber email section year semester');

  const submissions = await AssignmentSubmission.find({ assignment: req.params.id })
    .populate('student', 'firstName lastName rollNumber section year')
    .sort({ submittedAt: -1 });

  const subMap = new Map();
  submissions.forEach((s) => {
    subMap.set(s.student._id.toString(), s);
  });

  const studentRoster = enrollments.map((e) => {
    const st = e.student;
    const sub = subMap.get(st._id.toString());
    return {
      student: st,
      submission: sub || null,
      status: sub ? sub.status : 'PENDING',
      marks: sub ? sub.marks : null,
      submittedAt: sub ? sub.submittedAt : null,
      feedback: sub ? sub.feedback : null
    };
  });

  res.json(new ApiResponse(200, {
    assignment,
    roster: studentRoster,
    totalEnrolled: enrollments.length,
    submittedCount: submissions.length,
    gradedCount: submissions.filter((s) => s.status === 'GRADED').length
  }));
});

// POST /api/assignments/:id/submit — student submits
export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  // Verify student is enrolled in this subject
  const isEnrolled = await Enrollment.findOne({
    student: req.user._id,
    subject: assignment.subject,
    status: 'ACTIVE',
    isActive: true
  });
  if (!isEnrolled) {
    throw new ApiError(403, 'You are not actively enrolled in this subject');
  }

  const now = new Date();
  const isLate = now > assignment.deadline;
  if (isLate && !assignment.allowLateSubmission) {
    throw new ApiError(400, 'Assignment deadline has passed and late submissions are disabled');
  }

  const { submissionNotes, fileUrl, fileName } = req.body;
  const fileUrls = [];

  if (fileUrl) {
    fileUrls.push({
      filename: fileName || 'Submission_Document.pdf',
      url: fileUrl,
      mimetype: 'application/pdf'
    });
  }

  if (req.files && req.files.length) {
    req.files.forEach((f) => {
      fileUrls.push({
        filename: f.originalname,
        url: `/uploads/${req.user._id}/${f.filename}`,
        mimetype: f.mimetype,
      });
    });
  }

  let submission = await AssignmentSubmission.findOne({ assignment: req.params.id, student: req.user._id });
  if (submission) {
    if (submission.status === 'GRADED' && !assignment.allowResubmission) {
      throw new ApiError(400, 'Resubmission is not allowed for graded assignments');
    }
    submission.submissionHistory.push({
      files: submission.files,
      submittedAt: submission.submittedAt,
      status: submission.status
    });
    if (fileUrls.length) submission.files = fileUrls;
    submission.submittedAt = now;
    submission.status = isLate ? 'LATE' : 'SUBMITTED';
    if (submissionNotes) submission.feedback = submissionNotes;
    await submission.save();
  } else {
    submission = await AssignmentSubmission.create({
      assignment: req.params.id,
      student: req.user._id,
      institution: req.user.institution,
      files: fileUrls.length ? fileUrls : [{ filename: 'Online_Submission.pdf', url: '/uploads/demo/sub.pdf', mimetype: 'application/pdf' }],
      submittedAt: now,
      status: isLate ? 'LATE' : 'SUBMITTED',
      feedback: submissionNotes || ''
    });
  }

  await logActivity({ user: req.user, action: 'SUBMIT_ASSIGNMENT', resource: 'SUBMISSION', resourceId: submission._id, req });
  res.json(new ApiResponse(200, { submission }, 'Assignment submitted successfully'));
});

// PUT /api/assignments/submissions/:submissionId/grade — faculty grades
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;
  const submission = await AssignmentSubmission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, 'Submission not found');

  const assignment = await Assignment.findOne({ _id: submission.assignment, faculty: req.user._id });
  if (!assignment) throw new ApiError(403, 'Access denied: Not your assignment');
  if (Number(marks) > assignment.maxMarks) {
    throw new ApiError(400, `Marks cannot exceed maximum of ${assignment.maxMarks}`);
  }

  submission.marks = Number(marks);
  submission.feedback = feedback || '';
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
    message: `Your submission for "${assignment.title}" has been graded: ${marks}/${assignment.maxMarks} marks.`,
    link: '/student/assignments',
  });

  await logActivity({ user: req.user, action: 'GRADE_SUBMISSION', resource: 'SUBMISSION', resourceId: submission._id, req });
  res.json(new ApiResponse(200, { submission }, 'Submission evaluated successfully'));
});
