import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', authorize('FACULTY'), attendanceController.markAttendance);
router.put('/:sessionId', authorize('FACULTY'), attendanceController.updateAttendance);
router.get('/sessions/:subjectId', attendanceController.getSessionsBySubject);
router.get('/session/:sessionId/records', attendanceController.getSessionRecords);
router.get('/student/:studentId', attendanceController.getStudentAttendance);
router.get('/students/:subjectId', authorize('FACULTY'), attendanceController.getEnrolledStudentsForSubject);

export default router;
