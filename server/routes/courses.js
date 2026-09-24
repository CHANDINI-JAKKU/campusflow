import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourse);
router.post('/', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), courseController.createCourse);
router.put('/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), courseController.updateCourse);
router.delete('/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), courseController.deleteCourse);

export default router;
