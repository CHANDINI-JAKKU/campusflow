import Department from '../models/Department.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

export const getDepartments = asyncHandler(async (req, res) => {
  const query = req.user.role === 'SUPER_ADMIN'
    ? req.query.institutionId ? { institution: req.query.institutionId } : {}
    : { institution: req.user.institution };
  const departments = await Department.find(query).populate('head', 'firstName lastName');
  res.json(new ApiResponse(200, { departments }));
});

export const getDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id).populate('head', 'firstName lastName');
  if (!dept) throw new ApiError(404, 'Department not found');
  res.json(new ApiResponse(200, { department: dept }));
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, head } = req.body;
  const institution = req.user.institution;
  const existing = await Department.findOne({ code, institution });
  if (existing) throw new ApiError(409, 'Department code already exists in this institution');
  const dept = await Department.create({ name, code, description, head, institution });
  res.status(201).json(new ApiResponse(201, { department: dept }, 'Department created'));
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findOneAndUpdate(
    { _id: req.params.id, institution: req.user.institution },
    req.body, { new: true }
  );
  if (!dept) throw new ApiError(404, 'Department not found');
  res.json(new ApiResponse(200, { department: dept }, 'Department updated'));
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  await Department.findOneAndUpdate({ _id: req.params.id, institution: req.user.institution }, { isActive: false });
  res.json(new ApiResponse(200, null, 'Department deactivated'));
});
