import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { logActivity } from '../utils/auditLog.js';
import { calcCGPA } from '../utils/calcCGPA.js';
import { calcOverallAttendance } from '../utils/calcAttendance.js';

// GET /api/users — list users (admin, super admin)
export const getUsers = asyncHandler(async (req, res) => {
  const { role, department, search, page = 1, limit = 20 } = req.query;
  const query = {};

  if (req.user.role !== 'SUPER_ADMIN') query.institution = req.user.institution;
  if (role) query.role = role;
  if (department) query.department = department;
  if (search) query.$or = [
    { firstName: { $regex: search, $options: 'i' } },
    { lastName: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { rollNumber: { $regex: search, $options: 'i' } },
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password')
      .populate('institution', 'name code')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.json(new ApiResponse(200, { users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }));
});

// GET /api/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password')
    .populate('institution', 'name code logo')
    .populate('department', 'name code');
  if (!user) throw new ApiError(404, 'User not found');
  if (req.user.role !== 'SUPER_ADMIN' && user.institution?.toString() !== req.user.institution?.toString()) {
    throw new ApiError(403, 'Access denied');
  }
  res.json(new ApiResponse(200, { user }));
});

// GET /api/users/:id/profile — extended profile with CGPA, attendance
export const getStudentProfile = asyncHandler(async (req, res) => {
  const studentId = req.params.id === 'me' ? req.user._id : req.params.id;
  if (req.user.role === 'STUDENT' && studentId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  const student = await User.findById(studentId).select('-password')
    .populate('institution', 'name code')
    .populate('department', 'name code');
  if (!student) throw new ApiError(404, 'Student not found');
  if (student.role !== 'STUDENT') throw new ApiError(400, 'User is not a student');

  const [cgpa, attendanceStats] = await Promise.all([
    calcCGPA(student._id),
    calcOverallAttendance(student._id),
  ]);

  res.json(new ApiResponse(200, { user: student, cgpa, attendanceStats }));
});

// POST /api/users — create user (admin)
export const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, department, rollNumber, employeeId, phone, year, semester, section } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already in use');

  const institution = req.user.role === 'SUPER_ADMIN'
    ? req.body.institution
    : req.user.institution;

  const hashed = await bcrypt.hash(password || 'CampusFlow@123', 12);
  const user = await User.create({
    firstName, lastName, email, password: hashed, role, institution, department,
    rollNumber, employeeId, phone, year, semester, section,
    isEmailVerified: true,
  });

  await logActivity({ user: req.user, institution, action: 'CREATE_USER', resource: 'USER', resourceId: user._id, req });

  const userData = user.toObject();
  delete userData.password;
  res.status(201).json(new ApiResponse(201, { user: userData }, 'User created successfully'));
});

// PUT /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'year', 'semester', 'section', 'skills', 'github', 'linkedin', 'department'];
  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'COLLEGE_ADMIN') {
    allowedFields.push('role', 'isActive', 'employeeId', 'rollNumber');
  }

  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
  if (!user) throw new ApiError(404, 'User not found');

  res.json(new ApiResponse(200, { user }, 'User updated'));
});

// DELETE /api/users/:id (soft delete — deactivate)
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) throw new ApiError(400, 'Cannot deactivate yourself');
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  await logActivity({ user: req.user, action: 'DEACTIVATE_USER', resource: 'USER', resourceId: req.params.id, req });
  res.json(new ApiResponse(200, null, 'User deactivated'));
});

// PUT /api/users/:id/password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new ApiError(400, 'Current password is incorrect');
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json(new ApiResponse(200, null, 'Password changed successfully'));
});
