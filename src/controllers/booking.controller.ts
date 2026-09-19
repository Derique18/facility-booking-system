import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { AuthenticatedRequest } from '../interfaces/auth.interface';

export class BookingController {
  static async createBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.body.userId || req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized: User ID could not be identified.',
        });
      }

      const bookingData = {
        ...req.body,
        userId: String(userId),
        userRole: req.user?.role,
      };

      const booking = await BookingService.createBooking(bookingData);
      return res.status(201).json({ status: 'success', data: booking });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async getAvailableSlots(req: Request, res: Response) {
    try {
      const { facilityId } = req.params;
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ status: 'error', message: 'A valid date query parameter (YYYY-MM-DD) is required.' });
      }

      const slots = await BookingService.getAvailableSlots(String(facilityId), date);
      return res.status(200).json({ status: 'success', data: slots });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async blockSlot(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.userId;
      if (!adminId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

      const blockData = {
        ...req.body,
        adminId: String(adminId)
      };

      const blockedSlot = await BookingService.blockSlot(blockData);
      return res.status(201).json({ status: 'success', data: blockedSlot });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async joinWaitlist(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

      const waitlistData = {
        ...req.body,
        userId: String(userId),
      };

      const entry = await BookingService.joinWaitlist(waitlistData);
      return res.status(201).json({ status: 'success', message: 'Successfully joined the waitlist.', data: entry });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async cancelBooking(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      if (!id) return res.status(400).json({ status: 'error', message: 'Booking ID is required.' });

      await BookingService.cancelBooking(String(id), String(userId));
      return res.status(200).json({ status: 'success', message: 'Booking cancelled successfully.' });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async getAllBookings(req: Request, res: Response) {
    try {
      const bookings = await BookingService.getAllBookings();
      return res.status(200).json({ status: 'success', data: bookings });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  }

  static async getUserBookings(req: AuthenticatedRequest, res: Response) {
    try {
      let targetUserId = req.params.userId;

      if (!targetUserId || targetUserId === 'me') {
        targetUserId = req.user?.userId || '';
      }

      if (!targetUserId) {
        return res.status(400).json({ status: 'error', message: 'User ID is required.' });
      }

      const bookings = await BookingService.getUserBookings(String(targetUserId));
      return res.status(200).json({ status: 'success', data: bookings });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async updateBookingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status. Must be APPROVED or REJECTED.',
        });
      }

      const updatedBooking = await BookingService.updateBookingStatus(String(id), status);
      return res.status(200).json({ status: 'success', data: updatedBooking });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }
}