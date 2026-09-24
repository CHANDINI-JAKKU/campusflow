import Institution from '../models/Institution.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { logActivity } from '../utils/auditLog.js';

// GET /api/institutions
export const getInstitutions = asyncHandler(async (req, res) => {
  const query = req.user.role === 'SUPER_ADMIN' ? {} : { _id: req.user.institution };
  const institutions = await Institution.find(query).populate('adminUser', 'firstName lastName email');
  res.json(new ApiResponse(200, { institutions }));
});

// GET /api/institutions/:id
export const getInstitution = asyncHandler(async (req, res) => {
  const inst = await Institution.findById(req.params.id).populate('adminUser', 'firstName lastName email');
  if (!inst) throw new ApiError(404, 'Institution not found');
  res.json(new ApiResponse(200, { institution: inst }));
});

// POST /api/institutions
export const createInstitution = asyncHandler(async (req, res) => {
  const { name, code, address, phone, email, website, type, establishedYear } = req.body;
  const existing = await Institution.findOne({ code });
  if (existing) throw new ApiError(409, `Institution code '${code}' already exists`);
  const institution = await Institution.create({ name, code, address, phone, email, website, type, establishedYear });
  await logActivity({ user: req.user, action: 'CREATE_INSTITUTION', resource: 'INSTITUTION', resourceId: institution._id, req });
  res.status(201).json(new ApiResponse(201, { institution }, 'Institution created'));
});

// PUT /api/institutions/:id
export const updateInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!institution) throw new ApiError(404, 'Institution not found');
  res.json(new ApiResponse(200, { institution }, 'Institution updated'));
});

// PATCH /api/institutions/:id/toggle-active
export const toggleInstitutionActive = asyncHandler(async (req, res) => {
  const inst = await Institution.findById(req.params.id);
  if (!inst) throw new ApiError(404, 'Institution not found');
  inst.isActive = !inst.isActive;
  await inst.save();
  res.json(new ApiResponse(200, { institution: inst }, `Institution ${inst.isActive ? 'activated' : 'deactivated'}`));
});

// GET /api/institutions/:id/stats
export const getInstitutionStats = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const [students, faculty, departments] = await Promise.all([
    User.countDocuments({ institution: id, role: 'STUDENT', isActive: true }),
    User.countDocuments({ institution: id, role: 'FACULTY', isActive: true }),
    (await import('../models/Department.js')).default.countDocuments({ institution: id }),
  ]);
  res.json(new ApiResponse(200, { students, faculty, departments }));
});
