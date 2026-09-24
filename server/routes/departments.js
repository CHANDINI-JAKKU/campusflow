import express from 'express';
import * as departmentController from '../controllers/departmentController.js';
import { verifyToken } from '../middleware/auth.js';
import { authorize, verifyInstitutionAccess } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartment);
router.post('/', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), departmentController.createDepartment);
router.put('/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), departmentController.updateDepartment);
router.delete('/:id', authorize('COLLEGE_ADMIN', 'SUPER_ADMIN'), departmentController.deleteDepartment);

export default router;
