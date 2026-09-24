import express from 'express';
import * as placementController from '../controllers/placementController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);

// Companies
router.get('/companies', placementController.getCompanies);
router.post('/companies', authorize('PLACEMENT_OFFICER', 'COLLEGE_ADMIN'), placementController.createCompany);
router.put('/companies/:id', authorize('PLACEMENT_OFFICER', 'COLLEGE_ADMIN'), placementController.updateCompany);

// Drives
router.get('/drives', placementController.getJobDrives);
router.get('/drives/:id', placementController.getJobDrive);
router.post('/drives', authorize('PLACEMENT_OFFICER'), placementController.createJobDrive);
router.put('/drives/:id', authorize('PLACEMENT_OFFICER'), placementController.updateJobDrive);
router.get('/drives/:id/eligibility/:studentId', placementController.getEligibility);

// Applications
router.get('/applications', placementController.getApplications);
router.post('/drives/:driveId/apply', authorize('STUDENT'), placementController.applyForDrive);
router.put('/applications/:id/status', authorize('PLACEMENT_OFFICER'), placementController.updateApplicationStatus);

// Outcomes
router.get('/outcomes', placementController.getPlacementOutcomes);
router.post('/outcomes', authorize('PLACEMENT_OFFICER'), placementController.recordPlacementOutcome);

export default router;
