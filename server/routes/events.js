import express from 'express';
import * as eventController from '../controllers/eventController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);
router.post('/', authorize('COLLEGE_ADMIN', 'FACULTY', 'SUPER_ADMIN'), eventController.createEvent);
router.put('/:id', authorize('COLLEGE_ADMIN', 'FACULTY', 'SUPER_ADMIN'), eventController.updateEvent);
router.delete('/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), eventController.deleteEvent);
router.post('/:id/register', eventController.registerForEvent);
router.delete('/:id/register', eventController.cancelRegistration);

export default router;
