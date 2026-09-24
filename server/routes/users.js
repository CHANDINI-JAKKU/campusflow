import express from 'express';
import * as userController from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';
import { verifyInstitutionAccess, authorize } from '../middleware/roles.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyInstitutionAccess);

router.get('/', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FACULTY', 'PLACEMENT_OFFICER'), userController.getUsers);
router.post('/', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), userController.createUser);
router.get('/me/profile', userController.getStudentProfile);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', authorize('SUPER_ADMIN', 'COLLEGE_ADMIN'), userController.deleteUser);
router.get('/:id/profile', userController.getStudentProfile);
router.put('/:id/password', userController.changePassword);

export default router;
