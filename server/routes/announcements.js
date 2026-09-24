import express from 'express';
import * as announcementController from '../controllers/announcementController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncement);
router.post('/', authorize('COLLEGE_ADMIN', 'FACULTY', 'SUPER_ADMIN'), announcementController.createAnnouncement);
router.put('/:id', authorize('COLLEGE_ADMIN', 'FACULTY', 'SUPER_ADMIN'), announcementController.updateAnnouncement);
router.delete('/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), announcementController.deleteAnnouncement);

export default router;
