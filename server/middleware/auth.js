import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Verify JWT access token
export const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access token required');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive');
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Invalid or expired access token');
  }
});

// Verify refresh token from HTTP-only cookie
export const verifyRefreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.campusflow_refresh;
  if (!token) throw new ApiError(401, 'Refresh token not found');

  const stored = await RefreshToken.findOne({ token, isRevoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token expired or revoked');
  }

  const user = await User.findById(stored.user).select('-password');
  if (!user || !user.isActive) throw new ApiError(401, 'User not found or inactive');

  req.user = user;
  req.refreshTokenDoc = stored;
  next();
});
