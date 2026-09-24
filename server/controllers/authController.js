import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';
import { TOKEN_EXPIRY, COOKIE_NAME } from '../config/constants.js';
import { logActivity } from '../utils/auditLog.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: TOKEN_EXPIRY.REFRESH_MS,
};

const issueTokens = async (user, res) => {
  const accessToken = generateAccessToken({
    userId: user._id,
    role: user.role,
    institutionId: user.institution,
    departmentId: user.department,
  });
  const refreshTokenValue = generateRefreshToken();
  await RefreshToken.create({
    token: refreshTokenValue,
    user: user._id,
    expiresAt: new Date(Date.now() + TOKEN_EXPIRY.REFRESH_MS),
  });
  res.cookie(COOKIE_NAME, refreshTokenValue, cookieOptions);
  return accessToken;
};

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, institutionCode, phone } = req.body;

  const allowedRoles = ['STUDENT', 'FACULTY', 'PLACEMENT_OFFICER', 'COLLEGE_ADMIN'];
  if (!allowedRoles.includes(role)) throw new ApiError(400, 'Invalid role for self-registration');

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  let institution;
  const Institution = (await import('../models/Institution.js')).default;
  if (institutionCode && institutionCode.trim() !== '') {
    institution = await Institution.findOne({ 
      code: { $regex: new RegExp(`^${institutionCode.trim()}$`, 'i') }, 
      isActive: true 
    });
    if (!institution) {
      throw new ApiError(400, `Institution code '${institutionCode}' is invalid. Use SUN01, APEX02 or leave blank.`);
    }
  } else {
    // Default to the primary active college so all academic modules link properly
    institution = await Institution.findOne({ isActive: true });
  }

  const Department = (await import('../models/Department.js')).default;
  const defaultDept = await Department.findOne({ institution: institution?._id });

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    firstName, 
    lastName, 
    email, 
    password: hashed, 
    role, 
    phone,
    institution: institution?._id,
    department: defaultDept?._id,
    year: role === 'STUDENT' ? 1 : undefined,
    semester: role === 'STUDENT' ? 1 : undefined,
    section: role === 'STUDENT' ? 'A' : undefined,
    rollNumber: role === 'STUDENT' ? `CS${Date.now().toString().slice(-6)}` : undefined,
    isEmailVerified: true,
  });

  if (role === 'STUDENT') {
    const Course = (await import('../models/Course.js')).default;
    const Enrollment = (await import('../models/Enrollment.js')).default;
    const course = await Course.findOne({ institution: institution?._id });
    if (course) {
      await Enrollment.create({
        student: user._id,
        course: course._id,
        institution: institution?._id,
        department: defaultDept?._id,
        academicYear: '2026-2027',
        semester: 1,
        isActive: true
      });
    }
  }

  const accessToken = await issueTokens(user, res);
  const userData = user.toObject();
  delete userData.password;

  res.status(201).json(new ApiResponse(201, { user: userData, accessToken }, 'Registration successful'));
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password')
    .populate('institution', 'name code isActive')
    .populate('department', 'name code');

  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Account deactivated. Contact administrator.');
  if (user.institution && !user.institution.isActive) throw new ApiError(403, 'Institution is inactive');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  const accessToken = await issueTokens(user, res);
  const userData = user.toObject();
  delete userData.password;

  await logActivity({ user, institution: user.institution, action: 'LOGIN', resource: 'AUTH', req });

  res.json(new ApiResponse(200, { user: userData, accessToken }, 'Login successful'));
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
  }
  res.clearCookie(COOKIE_NAME);
  if (req.user) await logActivity({ user: req.user, action: 'LOGOUT', resource: 'AUTH', req });
  res.json(new ApiResponse(200, null, 'Logged out successfully'));
});

// POST /api/auth/refresh
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new ApiError(401, 'No refresh token');

  const stored = await RefreshToken.findOne({ token, isRevoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    res.clearCookie(COOKIE_NAME);
    throw new ApiError(401, 'Refresh token expired');
  }

  const user = await User.findById(stored.user)
    .populate('institution', 'name code isActive')
    .populate('department', 'name code');
  if (!user || !user.isActive) throw new ApiError(401, 'User not found');

  const accessToken = generateAccessToken({
    userId: user._id,
    role: user.role,
    institutionId: user.institution?._id,
    departmentId: user.department?._id,
  });

  res.json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('institution', 'name code logo type')
    .populate('department', 'name code');
  res.json(new ApiResponse(200, { user }));
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Always respond success to prevent user enumeration
  if (!user) return res.json(new ApiResponse(200, null, 'If that email exists, a reset link was sent'));

  const token = crypto.randomBytes(32).toString('hex');
  await PasswordResetToken.findOneAndDelete({ user: user._id });
  await PasswordResetToken.create({
    token,
    user: user._id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  // In production, send email. For demo, return token in response
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  console.log(`[DEV] Password reset URL: ${resetUrl}`);

  res.json(new ApiResponse(200, { resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined },
    'Password reset link sent to email'));
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetDoc = await PasswordResetToken.findOne({ token, isUsed: false });
  if (!resetDoc || resetDoc.expiresAt < new Date()) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  const hashed = await bcrypt.hash(password, 12);
  await User.findByIdAndUpdate(resetDoc.user, { password: hashed });
  await PasswordResetToken.findByIdAndUpdate(resetDoc._id, { isUsed: true });
  await RefreshToken.updateMany({ user: resetDoc.user }, { isRevoked: true });

  res.json(new ApiResponse(200, null, 'Password reset successful. Please login.'));
});
