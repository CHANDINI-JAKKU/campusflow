import ActivityLog from '../models/ActivityLog.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

// GET /api/audit-logs
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, action, resource } = req.query;
  const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
  const filter = isSuperAdmin ? {} : { institution: req.user.institution };

  if (action) filter.action = action;
  if (resource) filter.resource = resource;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('user', 'firstName lastName email role')
      .populate('institution', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ActivityLog.countDocuments(filter)
  ]);

  res.json(new ApiResponse(200, {
    logs,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  }));
});
