import express from 'express';
import * as academicController from '../controllers/academicController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();
router.use(verifyToken, verifyInstitutionAccess);

router.get('/timetable/today', academicController.getTodayTimetable);
router.get('/timetable', academicController.getTimetable);
router.post('/timetable', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.createTimetableEntry);
router.put('/timetable/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.updateTimetableEntry);
router.get('/calendar', academicController.getCalendar);
router.post('/calendar', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.createCalendarEvent);
router.put('/calendar/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.updateCalendarEvent);
router.delete('/calendar/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), academicController.deleteCalendarEvent);

export default router;
