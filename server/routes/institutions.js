import express from 'express';
import * as institutionController from '../controllers/institutionController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', institutionController.getInstitutions);
router.get('/:id', institutionController.getInstitution);
router.post('/', authorize('SUPER_ADMIN'), institutionController.createInstitution);
router.put('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), institutionController.updateInstitution);
router.patch('/:id/toggle-active', authorize('SUPER_ADMIN'), institutionController.toggleInstitutionActive);
router.get('/:id/stats', institutionController.getInstitutionStats);

export default router;
