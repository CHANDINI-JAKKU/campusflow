import express from 'express';
import * as subjectController from '../controllers/subjectController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/', subjectController.getSubjects);
router.get('/:id', subjectController.getSubject);
router.post('/', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), subjectController.createSubject);
router.put('/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN', 'FACULTY'), subjectController.updateSubject);
router.delete('/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), subjectController.deleteSubject);

export default router;
