import express from 'express';
import * as gradeController from '../controllers/gradeController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/student/:studentId', gradeController.getStudentGrades);
router.get('/subject/:subjectId', authorize('FACULTY', 'COLLEGE_ADMIN', 'SUPER_ADMIN'), gradeController.getSubjectGrades);
router.post('/', authorize('FACULTY', 'COLLEGE_ADMIN'), gradeController.upsertGrade);
router.post('/finalize/:studentId/:semester', authorize('COLLEGE_ADMIN', 'FACULTY'), gradeController.finalizeSemester);
router.get('/academic-record/:studentId', gradeController.getAcademicRecord);

export default router;
