import Subject from '../models/Subject.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const instScope = (req) => req.user.role === 'SUPER_ADMIN' ? {} : { institution: req.user.institution };

export const getSubjects = asyncHandler(async (req, res) => {
  const { course, faculty, department } = req.query;
  const query = { ...instScope(req) };
  if (course) query.course = course;
  if (faculty) query.faculty = faculty;
  if (department) query.department = department;
  // Faculty sees their own subjects
  if (req.user.role === 'FACULTY') query.faculty = req.user._id;
  const subjects = await Subject.find(query)
    .populate('course', 'name code semester')
    .populate('faculty', 'firstName lastName')
    .populate('department', 'name code');
  res.json(new ApiResponse(200, { subjects }));
});

export const getSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('course faculty department');
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json(new ApiResponse(200, { subject }));
});

export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, course, department, faculty, credits, maxInternalMarks, maxExternalMarks } = req.body;
  const subject = await Subject.create({
    name, code, course, department, faculty, credits, maxInternalMarks, maxExternalMarks,
    institution: req.user.institution,
  });
  res.status(201).json(new ApiResponse(201, { subject }, 'Subject created'));
});

export const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndUpdate({ _id: req.params.id, ...instScope(req) }, req.body, { new: true });
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json(new ApiResponse(200, { subject }, 'Subject updated'));
});

export const deleteSubject = asyncHandler(async (req, res) => {
  await Subject.findOneAndDelete({ _id: req.params.id, ...instScope(req) });
  res.json(new ApiResponse(200, null, 'Subject deleted'));
});
