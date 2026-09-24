import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/overview', analyticsController.getPlatformOverview);
router.get('/department/:id', analyticsController.getDepartmentAnalytics);

export default router;
