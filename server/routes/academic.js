import express from 'express';
import * as academicController from '../controllers/academicController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();
router.use(verifyToken, verifyInstitutionAccess);

// Daily Classes & Timetable
router.get('/timetable/today', academicController.getTodayTimetable);
router.get('/daily-classes', academicController.getTodayTimetable);
router.get('/timetable', academicController.getTimetable);
router.post('/timetable', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.createTimetableEntry);
router.put('/timetable/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.updateTimetableEntry);

// Class Session & Real Attendance (Enrollment-Scoped)
router.get('/session/:sessionId/roster', authorize('FACULTY', 'COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.getClassSessionRoster);
router.post('/session/:sessionId/attendance', authorize('FACULTY', 'COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.submitSessionAttendance);
router.post('/session/:sessionId/marks', authorize('FACULTY', 'COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.submitClassMarks);

// Admin Student Enrollment Management
router.get('/enrollment-matrix', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.getEnrollmentMatrix);
router.post('/enrollments/batch', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.batchEnrollStudents);

// Faculty Dashboard Summary
router.get('/faculty/dashboard-stats', authorize('FACULTY', 'COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.getFacultyDashboardStats);

// Academic Calendar
router.get('/calendar', academicController.getCalendar);
router.post('/calendar', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.createCalendarEvent);
router.put('/calendar/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.updateCalendarEvent);
router.delete('/calendar/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.deleteCalendarEvent);

export default router;
