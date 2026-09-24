import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', assignmentController.getAssignments);
router.get('/:id', assignmentController.getAssignment);
router.post('/', authorize('FACULTY', 'COLLEGE_ADMIN'), assignmentController.createAssignment);
router.put('/:id', authorize('FACULTY', 'COLLEGE_ADMIN'), assignmentController.updateAssignment);
router.delete('/:id', authorize('FACULTY', 'COLLEGE_ADMIN'), assignmentController.deleteAssignment);

router.get('/:id/submissions', authorize('FACULTY', 'COLLEGE_ADMIN'), assignmentController.getSubmissions);
router.post('/:id/submit', authorize('STUDENT'), uploadMultiple, assignmentController.submitAssignment);
router.put('/submissions/:submissionId/grade', authorize('FACULTY'), assignmentController.gradeSubmission);

export default router;
