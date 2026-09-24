import express from 'express';
import * as requestController from '../controllers/requestController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/', requestController.getRequests);
router.get('/:id', requestController.getRequest);
router.post('/', authorize('STUDENT'), requestController.createRequest);
router.patch('/:id/review', authorize('FACULTY', 'COLLEGE_ADMIN', 'SUPER_ADMIN'), requestController.reviewRequest);

export default router;
