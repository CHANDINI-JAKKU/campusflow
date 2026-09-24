import Announcement from '../models/Announcement.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// GET /api/announcements
export const getAnnouncements = asyncHandler(async (req, res) => {
  const { priority, page = 1, limit = 20 } = req.query;
  const now = new Date();
  const query = {
    institution: req.user.institution,
    isActive: true,
    $or: [{ expiresAt: { $gte: now } }, { expiresAt: null }],
  };

  // Audience filter
  const audienceQuery = [{ audience: 'ALL' }];
  if (req.user.role === 'STUDENT') audienceQuery.push({ audience: 'STUDENTS' });
  if (req.user.role === 'FACULTY') audienceQuery.push({ audience: 'FACULTY' });
  if (req.user.department) {
    audienceQuery.push({ audience: 'SPECIFIC_DEPT', department: req.user.department });
  }
  query.$or = audienceQuery;

  if (priority) query.priority = priority;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [announcements, total] = await Promise.all([
    Announcement.find(query).populate('createdBy', 'firstName lastName role')
      .populate('department', 'name').sort({ priority: -1, createdAt: -1 })
      .skip(skip).limit(parseInt(limit)),
    Announcement.countDocuments(query),
  ]);
  res.json(new ApiResponse(200, { announcements, total }));
});

// GET /api/announcements/:id
export const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'firstName lastName');
  if (!announcement) throw new ApiError(404, 'Announcement not found');
  res.json(new ApiResponse(200, { announcement }));
});

// POST /api/announcements
export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.create({
    ...req.body,
    createdBy: req.user._id,
    institution: req.user.institution,
  });
  res.status(201).json(new ApiResponse(201, { announcement }, 'Announcement created'));
});

// PUT /api/announcements/:id
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    req.body, { new: true }
  );
  if (!announcement) throw new ApiError(404, 'Announcement not found or not yours');
  res.json(new ApiResponse(200, { announcement }, 'Announcement updated'));
});

// DELETE /api/announcements/:id
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  await Announcement.findOneAndUpdate({ _id: req.params.id, institution: req.user.institution }, { isActive: false });
  res.json(new ApiResponse(200, null, 'Announcement removed'));
});
