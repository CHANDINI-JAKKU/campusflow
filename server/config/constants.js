export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COLLEGE_ADMIN: 'COLLEGE_ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
  PLACEMENT_OFFICER: 'PLACEMENT_OFFICER',
};

export const ATTENDANCE_THRESHOLD = 75;

export const COOKIE_NAME = 'campusflow_refresh';

export const TOKEN_EXPIRY = {
  ACCESS: process.env.JWT_ACCESS_EXPIRY || '15m',
  REFRESH: process.env.JWT_REFRESH_EXPIRY || '7d',
  REFRESH_MS: 7 * 24 * 60 * 60 * 1000,
  PASSWORD_RESET: '1h',
  EMAIL_VERIFY: '24h',
};

export const FILE_LIMITS = {
  MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'text/plain',
    'application/zip',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};
