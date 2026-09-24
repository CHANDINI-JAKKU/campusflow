import Timetable from '../models/Timetable.js';
import AcademicCalendarEvent from '../models/AcademicCalendarEvent.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const populateTimetable = (query) => query
  .populate('subject', 'name code credits')
  .populate('course', 'name code')
  .populate('faculty', 'firstName lastName employeeId')
  .sort({ dayOfWeek: 1, startTime: 1 });

export const getTimetable = asyncHandler(async (req, res) => {
  const { dayOfWeek, faculty, semester, section, department } = req.query;
  const query = { institution: req.user.institution, isActive: true };
  if (dayOfWeek !== undefined) query.dayOfWeek = Number(dayOfWeek);
  if (faculty) query.faculty = faculty;
  if (semester) query.semester = Number(semester);
  if (section) query.section = section;
  if (department) query.department = department;

  if (req.user.role === 'STUDENT') {
    query.department = req.user.department;
    query.semester = req.user.semester;
    query.section = req.user.section;
  }
  if (req.user.role === 'FACULTY') query.faculty = req.user._id;

  const timetable = await populateTimetable(Timetable.find(query));
  res.json(new ApiResponse(200, { timetable }));
});

export const getTodayTimetable = asyncHandler(async (req, res) => {
  const today = new Date().getDay();
  const query = { dayOfWeek: today };
  if (req.user.role === 'STUDENT') {
    query.department = req.user.department;
    query.semester = req.user.semester;
    query.section = req.user.section;
  } else if (req.user.role === 'FACULTY') {
    query.faculty = req.user._id;
  }
  const timetable = await populateTimetable(Timetable.find({ ...query, institution: req.user.institution, isActive: true }));
  res.json(new ApiResponse(200, { timetable, dayOfWeek: today }));
});

export const createTimetableEntry = asyncHandler(async (req, res) => {
  const timetable = await Timetable.create({ ...req.body, institution: req.user.institution });
  res.status(201).json(new ApiResponse(201, { timetable }, 'Timetable entry created'));
});

export const updateTimetableEntry = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    req.body,
    { new: true, runValidators: true },
  );
  if (!timetable) throw new ApiError(404, 'Timetable entry not found');
  res.json(new ApiResponse(200, { timetable }, 'Timetable entry updated'));
});

export const getCalendar = asyncHandler(async (req, res) => {
  const { from, to, semester, department } = req.query;
  const query = { institution: req.user.institution, isPublished: true };
  if (from || to) query.startDate = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (semester) query.semester = Number(semester);
  if (department) query.department = department;
  if (req.user.role === 'STUDENT') {
    query.$or = [{ department: req.user.department }, { department: null }];
    query.semester = req.user.semester;
  }
  const events = await AcademicCalendarEvent.find(query)
    .populate('department', 'name code')
    .populate('course', 'name code')
    .sort({ startDate: 1 });
  res.json(new ApiResponse(200, { events }));
});

export const createCalendarEvent = asyncHandler(async (req, res) => {
  const event = await AcademicCalendarEvent.create({ ...req.body, institution: req.user.institution });
  res.status(201).json(new ApiResponse(201, { event }, 'Academic calendar event created'));
});

export const updateCalendarEvent = asyncHandler(async (req, res) => {
  const event = await AcademicCalendarEvent.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    req.body,
    { new: true, runValidators: true },
  );
  if (!event) throw new ApiError(404, 'Academic calendar event not found');
  res.json(new ApiResponse(200, { event }, 'Academic calendar event updated'));
});

export const deleteCalendarEvent = asyncHandler(async (req, res) => {
  const event = await AcademicCalendarEvent.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
  if (!event) throw new ApiError(404, 'Academic calendar event not found');
  res.json(new ApiResponse(200, null, 'Academic calendar event deleted'));
});
