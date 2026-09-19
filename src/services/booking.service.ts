import { PrismaClient, BookingStatus } from '@prisma/client';
import { 
  sendNewBookingAdminNotification, 
  sendBookingStatusUpdateEmail, 
  sendWaitlistNotificationEmail,
  sendBookingCancelledAdminNotification
} from '../helper/email.helper';

const prisma = new PrismaClient();

export class BookingService {

  // Phase 2: Create booking with dynamic operating hours, multi-slot checking, and 5-hour daily cap
  static async createBooking(data: {
    userId: string;
    facilityId: string;
    startTime: string;
    endTime: string;
    date?: string;
    userRole?: string;
  }) {
    if (!data.userId) throw new Error('User ID is required to process the booking.');

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid start time or end time format.');
    }

    // Prevent booking dates and times in the past
    if (start < new Date()) {
      throw new Error('You cannot book a time slot that has already passed.');
    }

    if (start >= end) throw new Error('End time must be after start time.');

    // Enforce top-of-the-hour blocks
    const startMins = start.getMinutes();
    const endMins = end.getMinutes();
    if (startMins !== 0 || endMins !== 0) {
      throw new Error('Bookings must start and end exactly on the hour (e.g., 09:00, 10:00).');
    }

    // 1. Fetch Facility to check dynamic operating hours (openTime / closeTime)
    const facility = await prisma.facility.findUnique({ where: { id: data.facilityId } });
    if (!facility) throw new Error('Facility not found.');

    const [openHour] = (facility.openTime || '09:00').split(':').map(Number);
    const [closeHour] = (facility.closeTime || '18:00').split(':').map(Number);

    const startHour = start.getHours();
    const endHour = end.getHours();

    // Validate request fits within custom facility operating hours
    if (startHour < openHour! || endHour > closeHour! || (endHour === closeHour! && endMins > 0)) {
      throw new Error(
        `Facility operating hours for ${facility.name} are between ${facility.openTime} and ${facility.closeTime}.`
      );
    }

    // Calculate requested duration in hours
    const requestedHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (requestedHours < 1) {
      throw new Error('Minimum booking duration is 1 hour.');
    }

    // Ensure requested hours are whole, consecutive 1-hour slots
    if (!Number.isInteger(requestedHours)) {
      throw new Error('Booking duration must consist of whole consecutive 1-hour time slots.');
    }

    const isoParts = start.toISOString().split('T');
    const targetDateStr: string = (isoParts[0] !== undefined ? isoParts[0] : new Date().toISOString().split('T')[0]) as string;
    const bookingDate = data.date ? new Date(data.date) : new Date(targetDateStr);

    // 2. Enforce 5-Hour Daily Cap per user per facility
    const userExistingBookingsOnDate = await prisma.booking.findMany({
      where: {
        userId: data.userId,
        facilityId: data.facilityId,
        status: { not: BookingStatus.REJECTED },
      },
    });

    // Sum existing booked hours on the same date
    const existingBookedHoursOnDate = userExistingBookingsOnDate.reduce((total, b) => {
      const bDateStr = new Date(b.startTime).toISOString().split('T')[0];
      if (bDateStr === targetDateStr) {
        const duration = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
        return total + duration;
      }
      return total;
    }, 0);

    if (existingBookedHoursOnDate + requestedHours > 5) {
      throw new Error(
        `You have exceeded the maximum limit of 5 hours per day for this facility. (Already booked: ${existingBookedHoursOnDate} hrs, Requested: ${requestedHours} hrs)`
      );
    }

    // 3. Check overlaps against Existing Bookings (PENDING & APPROVED count as Reserved)
    const existingBookings = await prisma.booking.findMany({
      where: { facilityId: data.facilityId, status: { not: BookingStatus.REJECTED } },
    });
    
    const existingBlocks = await prisma.blockedSlot.findMany({
      where: { facilityId: data.facilityId }
    });

    const newStart = start.getTime();
    const newEnd = end.getTime();

    const hasOverlap = existingBookings.some((booking) => {
      const bStart = new Date(booking.startTime).getTime();
      const bEnd = new Date(booking.endTime).getTime();
      const bookingDateStr = new Date(booking.startTime).toISOString().split('T')[0];
      if (bookingDateStr !== targetDateStr) return false;
      return newStart < bEnd && newEnd > bStart;
    });

    const isBlocked = existingBlocks.some((block) => {
      const bStart = new Date(block.startTime).getTime();
      const bEnd = new Date(block.endTime).getTime();
      const blockDateStr = new Date(block.startTime).toISOString().split('T')[0];
      if (blockDateStr !== targetDateStr) return false;
      return newStart < bEnd && newEnd > bStart;
    });

    if (hasOverlap) throw new Error('Facility is already reserved or booked for the selected time slot on this day.');
    if (isBlocked) throw new Error('This time slot is blocked for maintenance.');

    // 4. Auto-Approval Logic: Admin only gets auto-approved if they own this specific facility
    const isFacilityOwner = facility.createdById === data.userId;
    const initialStatus = (data.userRole === 'ADMIN' && isFacilityOwner) ? BookingStatus.APPROVED : BookingStatus.PENDING;

    const newBooking = await prisma.booking.create({
      data: {
        userId: data.userId,
        facilityId: data.facilityId,
        date: bookingDate,
        startTime: data.startTime,
        endTime: data.endTime,
        status: initialStatus,
      },
      include: {
        facility: { include: { createdBy: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    try {
      const admin = newBooking.facility.createdBy;
      if (admin?.email && initialStatus === BookingStatus.PENDING) {
        await sendNewBookingAdminNotification(
          admin.email, admin.firstName || 'Admin', newBooking.user.firstName || 'User',
          newBooking.user.email, newBooking.facility.name, newBooking.startTime,
          newBooking.endTime, newBooking.date.toISOString()
        );
      }
    } catch (mailError) {
      console.error('Failed to send admin notification email:', mailError);
    }

    return newBooking;
  }

  // Phase 2: Compute available 1-hour slots matching facility's openTime and closeTime
  static async getAvailableSlots(facilityId: string, dateStr: string) {
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!facility) throw new Error('Facility not found.');

    const [openHour] = (facility.openTime || '09:00').split(':').map(Number);
    const [closeHour] = (facility.closeTime || '18:00').split(':').map(Number);

    const existingBookings = await prisma.booking.findMany({
      where: { facilityId, status: { not: BookingStatus.REJECTED } }
    });
    const existingBlocks = await prisma.blockedSlot.findMany({ where: { facilityId } });

    // Generate hours dynamically from openHour up to closeHour - 1
    const operatingHours: number[] = [];
    for (let h = openHour!; h < closeHour!; h++) {
      operatingHours.push(h);
    }

    const dateParts = dateStr.split('-').map(Number);
    const year = dateParts[0] ?? new Date().getFullYear();
    const month = dateParts[1] ?? (new Date().getMonth() + 1);
    const day = dateParts[2] ?? new Date().getDate();

    return operatingHours.map(hour => {
      const slotStart = new Date(year, month - 1, day, hour, 0, 0).getTime();
      const slotEnd = new Date(year, month - 1, day, hour + 1, 0, 0).getTime();

      const isBooked = existingBookings.some(b => new Date(b.startTime).getTime() < slotEnd && new Date(b.endTime).getTime() > slotStart);
      const isBlocked = existingBlocks.some(b => new Date(b.startTime).getTime() < slotEnd && new Date(b.endTime).getTime() > slotStart);

      const startStr = `${hour.toString().padStart(2, '0')}:00`;
      const endStr = `${(hour + 1).toString().padStart(2, '0')}:00`;

      let status = 'AVAILABLE';
      if (isBlocked) status = 'MAINTENANCE';
      else if (isBooked) status = 'BOOKED';

      return {
        timeSlot: `${startStr} - ${endStr}`,
        status
      };
    });
  }
// User deletes their own booking AND triggers waitlist & admin notifications
  static async cancelBooking(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { facility: { include: { createdBy: true } }, user: true }
    });
    
    if (!booking) throw new Error('Booking not found.');

    if (booking.userId !== userId) {
      throw new Error('Unauthorized: You can only cancel your own bookings.');
    }

    // 1. Find waitlist entries BEFORE deleting
    const waitlistEntries = await prisma.waitlist.findMany({
      where: {
        facilityId: booking.facilityId,
        startTime: { lt: booking.endTime },
        endTime: { gt: booking.startTime },
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    // 2. Delete the booking
    await prisma.booking.delete({ where: { id: bookingId } });

    // 3. Clear the waitlist entries
    if (waitlistEntries.length > 0) {
      const waitlistIds = waitlistEntries.map(entry => entry.id);
      await prisma.waitlist.deleteMany({
        where: { id: { in: waitlistIds } }
      });
    }

    // ==========================================
    // EMAIL DISPATCH (STRICT BACKGROUND QUEUE)
    // ==========================================
    // This runs in the background so the frontend returns instantly.
    // It strictly forces Nodemailer to wait 5 seconds between emails.
    
    (async () => {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // 1. Send Admin Email First
      try {
        const admin = booking.facility.createdBy;
        if (admin && admin.email) {
          await sendBookingCancelledAdminNotification(
            admin.email, 
            admin.firstName || 'Admin', 
            booking.user.firstName || 'User',
            booking.facility.name, 
            booking.startTime, 
            booking.endTime
          );
          console.log('✅ Admin cancellation email sent.');
        }
      } catch (error) {
        console.error('Failed to send admin email:', error);
      }

      // 2. Loop through waitlist and force a 5-second pause before EACH email
      if (waitlistEntries.length > 0) {
        console.log(`Found ${waitlistEntries.length} waitlist entry(s). Starting strict background queue...`);
        
        for (const entry of waitlistEntries) {
          // Hard pause for 5 seconds to guarantee Mailtrap resets
          await wait(5000); 
          
          try {
            const fullName = `${entry.user?.firstName || 'Valued'} ${entry.user?.lastName || 'User'}`;
            console.log(`Attempting to send waitlist email to: ${entry.user?.email}`);
            
            await sendWaitlistNotificationEmail(
              entry.user?.email,
              fullName,
              booking.facility.name,
              entry.startTime, 
              entry.endTime
            );
            console.log(`✅ Waitlist email sent perfectly to: ${entry.user?.email}`);
          } catch (mailError) {
            console.error(`❌ FAILED to send waitlist email to ${entry.user?.email}:`, mailError);
          }
        }
      }
    })();

    // 5. Return to the frontend instantly (doesn't wait for the emails!)
    return true;
  }

  // Join waitlist for a booked slot
  static async joinWaitlist(data: {
    userId: string;
    facilityId: string;
    date: string;
    startTime: string;
    endTime: string;
  }) {
    if (!data.userId) throw new Error('User ID is required.');

    const facility = await prisma.facility.findUnique({ where: { id: data.facilityId } });
    if (!facility) throw new Error('Facility not found.');

    const waitlistDate = new Date(data.date);

    const existingEntry = await prisma.waitlist.findFirst({
      where: {
        userId: data.userId,
        facilityId: data.facilityId,
        startTime: data.startTime,
        endTime: data.endTime,
      }
    });

    if (existingEntry) {
      throw new Error('You are already on the waitlist for this time slot.');
    }

    const waitlistEntry = await prisma.waitlist.create({
      data: {
        userId: data.userId,
        facilityId: data.facilityId,
        date: waitlistDate,
        startTime: data.startTime,
        endTime: data.endTime,
      }
    });

    return waitlistEntry;
  }

  // Admin blocks a slot for maintenance
  static async blockSlot(data: { adminId: string; facilityId: string; date: string; startTime: string; endTime: string; reason?: string }) {
    const facility = await prisma.facility.findUnique({ where: { id: data.facilityId } });
    if (!facility) throw new Error('Facility not found.');
    if (facility.createdById !== data.adminId) throw new Error('Only the facility owner can block time slots.');

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (start.getMinutes() !== 0 || end.getMinutes() !== 0) throw new Error('Blocks must be exactly on the hour.');

    const newBlock = await prisma.blockedSlot.create({
      data: {
        adminId: data.adminId,
        facilityId: data.facilityId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason ?? null
      }
    });
    return newBlock;
  }

  static async getAllBookings() {
    return await prisma.booking.findMany({
      include: {
        facility: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getUserBookings(userId: string) {
    return await prisma.booking.findMany({
      where: { userId },
      include: { facility: true },
    });
  }

  static async updateBookingStatus(bookingId: string, status: BookingStatus) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found.');

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        facility: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    try {
      const userEmail = updatedBooking.user.email;
      const fullName = updatedBooking.user.firstName || 'Valued User';
      await sendBookingStatusUpdateEmail(userEmail, fullName, updatedBooking.facility.name, status, updatedBooking.startTime, updatedBooking.endTime);
    } catch (mailError) {
      console.error('Failed to send user status update email:', mailError);
    }
    return updatedBooking;
  }
}