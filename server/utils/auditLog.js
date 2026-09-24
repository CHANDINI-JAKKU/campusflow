import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ user, institution, action, resource, resourceId, details, req }) => {
  try {
    await ActivityLog.create({
      user: user?._id || user,
      institution: institution?._id || institution,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};
