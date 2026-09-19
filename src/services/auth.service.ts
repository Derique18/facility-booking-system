import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateSixDigitToken } from '../helper/token.helper';
import { sendPasswordResetEmail } from '../helper/email.helper';

const prisma = new PrismaClient();

export class AuthService {
  // 1. Register User
  static async register(data: { email: string; password: string; firstName: string; lastName: string; role?: 'USER' | 'ADMIN' }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Email is already registered.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Enforce role to 'USER' on public registration
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'USER', // Always hardcode to USER
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // 2. Login User
  static async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_access_key',
      { expiresIn: '1d' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key',
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  }

  // 3. Forgot Password (Using Helpers)
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If email exists, an OTP has been sent.' };
    }

    // Generate a 6-character uppercase alphanumeric code
    const otpCode = generateSixDigitToken();
    const otpExpiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    });

    // Send email using helper
    const fullName = `${user.firstName} ${user.lastName}`;
    await sendPasswordResetEmail(user.email, fullName, otpCode);

    return { message: 'OTP sent to your email.' };
  }

  // 4. Verify OTP
  static async verifyOtp(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otpCode !== otp) {
      throw new Error('Invalid verification code.');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new Error('Verification code has expired. Please request a new one.');
    }

    return { message: 'OTP verified successfully.' };
  }

  // 5. Reset Password
  static async resetPassword(email: string, otp: string, newPassword: string) {
    // Re-verify the OTP just in case
    await this.verifyOtp(email, otp);

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedNewPassword,
        otpCode: null, // Clear the code so it can't be reused
        otpExpiresAt: null,
      },
    });

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  // 6. Change Password (For logged-in users)
  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error('Incorrect old password.');

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password updated successfully.' };
  }
  // Logout User
  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully.' };
  }
}