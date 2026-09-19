import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createBookingSchema, updateBookingStatusSchema } from '../validations/booking.validation';

const router = Router();

// Protect ALL booking routes by default
router.use(authenticateToken as any);

router.get('/facilities/:facilityId/available-slots', BookingController.getAvailableSlots as any);

// STRICT ADMIN ENFORCEMENT: Maintenance blocking
router.post('/block', authorizeRoles('ADMIN') as any, BookingController.blockSlot as any);

router.post('/waitlist', BookingController.joinWaitlist as any);

router.post('/', validateBody(createBookingSchema), BookingController.createBooking as any);

router.get('/', BookingController.getAllBookings as any);

router.get('/user/me', BookingController.getUserBookings as any);
router.get('/me', BookingController.getUserBookings as any);

router.get('/user/:userId', BookingController.getUserBookings as any);

// STRICT ADMIN ENFORCEMENT: Approving/Rejecting requests
router.patch(
  '/:id/status',
  authorizeRoles('ADMIN') as any,
  validateBody(updateBookingStatusSchema),
  BookingController.updateBookingStatus as any
);

router.delete('/:id', BookingController.cancelBooking as any);

export default router;