import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread } = req.query;
  const query = { user: req.user._id };
  if (unread === 'true') query.isRead = false;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  res.json(new ApiResponse(200, { notifications, total, unreadCount }));
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true });
  res.json(new ApiResponse(200, null, 'Marked as read'));
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json(new ApiResponse(200, null, 'All notifications marked as read'));
});

// DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json(new ApiResponse(200, null, 'Notification deleted'));
});
