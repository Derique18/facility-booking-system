import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema
} from '../validations/auth.validation';

const router = Router();

console.log('Auth routes file loaded successfully!');

router.post('/register', validateBody(registerSchema), AuthController.register);

router.post('/login', validateBody(loginSchema), AuthController.login);

router.patch(
  '/change-password',
  authenticateToken as any,
  validateBody(changePasswordSchema),
  AuthController.changePassword
);

router.post('/forgot-password', validateBody(forgotPasswordSchema), AuthController.forgotPassword);

router.post('/verify-otp', validateBody(verifyOtpSchema), AuthController.verifyOtp);

router.post('/reset-password', validateBody(resetPasswordSchema), AuthController.resetPassword);

router.post(
  '/logout',
  authenticateToken as any,
  AuthController.logout
);

export default router;