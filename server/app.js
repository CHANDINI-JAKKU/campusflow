import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import institutionRoutes from './routes/institutions.js';
import departmentRoutes from './routes/departments.js';
import courseRoutes from './routes/courses.js';
import subjectRoutes from './routes/subjects.js';
import attendanceRoutes from './routes/attendance.js';
import assignmentRoutes from './routes/assignments.js';
import gradeRoutes from './routes/grades.js';
import eventRoutes from './routes/events.js';
import announcementRoutes from './routes/announcements.js';
import requestRoutes from './routes/requests.js';
import placementRoutes from './routes/placements.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import auditRoutes from './routes/auditLogs.js';
import academicRoutes from './routes/academic.js';

import ApiError from './utils/ApiError.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 10000,
});
app.use('/api', limiter);

app.get('/api/health', (req, res) => res.status(200).json({ success: true, message: 'CampusFlow API is running' }));

// Mount all modular routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/academic', academicRoutes);

// 404 Handler
app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
