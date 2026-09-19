import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const user = await AuthService.register(req.body);
      return res.status(201).json({ status: 'success', data: user });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      return res.status(401).json({ status: 'error', message: error.message });
    }
  }

  // Triggered when user submits their email
  static async forgotPassword(req: Request, res: Response) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // Triggered when user types in the 6-digit OTP
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyOtp(email, otp);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // Triggered when user submits their brand new password
  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await AuthService.resetPassword(email, otp, newPassword);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // Triggered from settings page when user is already logged in
  static async changePassword(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const { oldPassword, newPassword } = req.body;

      const result = await AuthService.changePassword(userId, oldPassword, newPassword);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }
  static async logout(req: any, res: Response) {
    try {
      const userId = req.user.userId; // Extracted from the access token
      const result = await AuthService.logout(userId);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }
}