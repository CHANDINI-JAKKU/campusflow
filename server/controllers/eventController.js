import Event from '../models/Event.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// GET /api/events
export const getEvents = asyncHandler(async (req, res) => {
  const { type, upcoming, department, page = 1, limit = 20 } = req.query;
  const query = { institution: req.user.institution, isActive: true };
  if (type) query.eventType = type;
  if (department) query.$or = [{ department }, { audience: 'ALL' }];
  if (upcoming === 'true') query.date = { $gte: new Date() };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [events, total] = await Promise.all([
    Event.find(query).populate('organizer', 'firstName lastName').populate('department', 'name')
      .sort({ date: 1 }).skip(skip).limit(parseInt(limit)),
    Event.countDocuments(query),
  ]);

  // For students add isRegistered flag
  if (req.user.role === 'STUDENT') {
    const enriched = events.map((e) => ({
      ...e.toObject(),
      isRegistered: e.registrations.some((r) => r.user.toString() === req.user._id.toString()),
      registrationCount: e.registrations.length,
    }));
    return res.json(new ApiResponse(200, { events: enriched, total }));
  }

  res.json(new ApiResponse(200, { events, total }));
});

// GET /api/events/:id
export const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'firstName lastName')
    .populate('registrations.user', 'firstName lastName rollNumber email');
  if (!event) throw new ApiError(404, 'Event not found');
  res.json(new ApiResponse(200, { event }));
});

// POST /api/events
export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, organizer: req.user._id, institution: req.user.institution });
  res.status(201).json(new ApiResponse(201, { event }, 'Event created'));
});

// PUT /api/events/:id
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    req.body, { new: true }
  );
  if (!event) throw new ApiError(404, 'Event not found');
  res.json(new ApiResponse(200, { event }, 'Event updated'));
});

// DELETE /api/events/:id
export const deleteEvent = asyncHandler(async (req, res) => {
  await Event.findOneAndUpdate({ _id: req.params.id, institution: req.user.institution }, { isActive: false });
  res.json(new ApiResponse(200, null, 'Event cancelled'));
});

// POST /api/events/:id/register
export const registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    throw new ApiError(400, 'Registration deadline has passed');
  }
  if (event.capacity && event.registrations.length >= event.capacity) {
    throw new ApiError(400, 'Event is at full capacity');
  }
  const alreadyRegistered = event.registrations.some((r) => r.user.toString() === req.user._id.toString());
  if (alreadyRegistered) throw new ApiError(409, 'Already registered');

  event.registrations.push({ user: req.user._id, registeredAt: new Date() });
  await event.save();
  res.json(new ApiResponse(200, null, 'Registered for event'));
});

// DELETE /api/events/:id/register
export const cancelRegistration = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  event.registrations = event.registrations.filter((r) => r.user.toString() !== req.user._id.toString());
  await event.save();
  res.json(new ApiResponse(200, null, 'Registration cancelled'));
});
