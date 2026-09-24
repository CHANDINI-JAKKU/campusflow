import Course from '../models/Course.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const instScope = (req) => req.user.role === 'SUPER_ADMIN' ? {} : { institution: req.user.institution };

export const getCourses = asyncHandler(async (req, res) => {
  const { department, semester, year, search } = req.query;
  const query = { ...instScope(req), isActive: true };
  if (department) query.department = department;
  if (semester) query.semester = parseInt(semester);
  if (year) query.year = parseInt(year);
  if (search) query.name = { $regex: search, $options: 'i' };
  const courses = await Course.find(query).populate('department', 'name code');
  res.json(new ApiResponse(200, { courses }));
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('department', 'name code');
  if (!course) throw new ApiError(404, 'Course not found');
  res.json(new ApiResponse(200, { course }));
});

export const createCourse = asyncHandler(async (req, res) => {
  const { name, code, department, semester, year, credits, description } = req.body;
  const course = await Course.create({ name, code, department, semester, year, credits, description, institution: req.user.institution });
  res.status(201).json(new ApiResponse(201, { course }, 'Course created'));
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findOneAndUpdate({ _id: req.params.id, ...instScope(req) }, req.body, { new: true });
  if (!course) throw new ApiError(404, 'Course not found');
  res.json(new ApiResponse(200, { course }, 'Course updated'));
});

export const deleteCourse = asyncHandler(async (req, res) => {
  await Course.findOneAndUpdate({ _id: req.params.id, ...instScope(req) }, { isActive: false });
  res.json(new ApiResponse(200, null, 'Course deactivated'));
});
