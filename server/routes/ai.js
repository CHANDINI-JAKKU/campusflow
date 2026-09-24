import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { verifyToken } from '../middleware/auth.js';
import { verifyInstitutionAccess, authorize } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.post('/academic-summary', authorize('FACULTY', 'COLLEGE_ADMIN', 'STUDENT'), aiController.generateAcademicSummary);
router.post('/study-plan', authorize('STUDENT'), aiController.generateStudyPlan);
router.post('/chat', authorize('STUDENT'), aiController.chatWithAssistant);
router.get('/chat/history', authorize('STUDENT'), aiController.getChatHistory);
router.delete('/chat/history', authorize('STUDENT'), aiController.clearChatHistory);
router.post('/career-match', authorize('STUDENT', 'PLACEMENT_OFFICER'), aiController.evaluateCareerMatch);

export default router;
