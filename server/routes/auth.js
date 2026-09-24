import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken, verifyRefreshToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/refresh', verifyRefreshToken, authController.refreshAccessToken);
router.get('/me', verifyToken, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

export default router;
