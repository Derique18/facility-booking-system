/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and User Management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email: { type: string, example: test@example.com }
 *               password: { type: string, example: password123 }
 *               firstName: { type: string, example: John }
 *               lastName: { type: string, example: Doe }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already taken
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to an account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, example: test@example.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Login successful, returns access and refresh tokens
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Change password for currently logged-in user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword: { type: string, example: password123 }
 *               newPassword: { type: string, example: newsecurepassword123 }
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation failed or incorrect old password
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a 6-digit OTP code for password recovery
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email: { type: string, example: test@example.com }
 *     responses:
 *       200:
 *         description: OTP email sent successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify the 6-digit OTP code sent to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email: { type: string, example: test@example.com }
 *               otp: { type: string, example: A8F3Z9 }
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired code
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using the verified OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email: { type: string, example: test@example.com }
 *               otp: { type: string, example: A8F3Z9 }
 *               newPassword: { type: string, example: brandnewpassword123 }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid code or validation error
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out current user and clear refresh token
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */