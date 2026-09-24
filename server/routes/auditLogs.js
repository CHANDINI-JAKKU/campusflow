import express from 'express';
import * as auditController from '../controllers/auditController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), auditController.getAuditLogs);

export default router;
