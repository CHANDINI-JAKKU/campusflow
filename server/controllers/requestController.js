import StudentRequest from '../models/StudentRequest.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { logActivity } from '../utils/auditLog.js';

// GET /api/requests
export const getRequests = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const query = { institution: req.user.institution };
  if (req.user.role === 'STUDENT') query.student = req.user._id;
  if (req.user.role === 'FACULTY') query.department = req.user.department;
  if (status) query.status = status;
  if (type) query.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [requests, total] = await Promise.all([
    StudentRequest.find(query)
      .populate('student', 'firstName lastName rollNumber email')
      .populate('department', 'name')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    StudentRequest.countDocuments(query),
  ]);
  res.json(new ApiResponse(200, { requests, total }));
});

// GET /api/requests/:id
export const getRequest = asyncHandler(async (req, res) => {
  const request = await StudentRequest.findById(req.params.id)
    .populate('student', 'firstName lastName rollNumber email department')
    .populate('resolvedBy', 'firstName lastName')
    .populate('workflow.performedBy', 'firstName lastName role');
  if (!request) throw new ApiError(404, 'Request not found');
  res.json(new ApiResponse(200, { request }));
});

// POST /api/requests
export const createRequest = asyncHandler(async (req, res) => {
  const { type, subject, description } = req.body;
  const request = await StudentRequest.create({
    student: req.user._id,
    institution: req.user.institution,
    department: req.user.department,
    type, subject, description,
    workflow: [{ action: 'SUBMITTED', performedBy: req.user._id, comment: 'Request submitted', timestamp: new Date() }],
  });
  res.status(201).json(new ApiResponse(201, { request }, 'Request submitted'));
});

// PATCH /api/requests/:id/review
export const reviewRequest = asyncHandler(async (req, res) => {
  const { action, comment } = req.body; // action: APPROVE | REJECT | REVIEW
  const request = await StudentRequest.findOne({ _id: req.params.id, institution: req.user.institution });
  if (!request) throw new ApiError(404, 'Request not found');

  const statusMap = { APPROVE: 'APPROVED', REJECT: 'REJECTED', REVIEW: 'UNDER_REVIEW' };
  request.status = statusMap[action] || 'UNDER_REVIEW';
  request.workflow.push({ action, performedBy: req.user._id, comment, timestamp: new Date() });
  if (action === 'APPROVE' || action === 'REJECT') {
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
  }
  await request.save();

  // Notify student
  await Notification.create({
    user: request.student,
    institution: req.user.institution,
    type: 'REQUEST_UPDATE',
    title: 'Request Update',
    message: `Your ${request.type} request has been ${request.status.toLowerCase()}. ${comment || ''}`,
    link: '/student/requests',
  });

  await logActivity({ user: req.user, action: `REQUEST_${action}`, resource: 'REQUEST', resourceId: request._id, req });
  res.json(new ApiResponse(200, { request }, 'Request updated'));
});
