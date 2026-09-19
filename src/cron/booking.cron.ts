import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendBookingNotificationEmail } from '../helper/email.helper';

const prisma = new PrismaClient();

export const initBookingCron = () => {
  // Run every minute: '* * * * *'
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Fetch all approved bookings that haven't fully completed their lifecycle
      const bookings = await prisma.booking.findMany({
        where: {
          status: 'APPROVED',
          expiredSent: false,
        },
        include: {
          user: true,
          facility: true,
        },
      });

      for (const booking of bookings) {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const diffMinutesStart = (start.getTime() - now.getTime()) / (1000 * 60);
        const diffMinutesEnd = (end.getTime() - now.getTime()) / (1000 * 60);

        const fullName = `${booking.user.firstName} ${booking.user.lastName}`;

        // 1. Session Started: Exactly when start time is reached (within the current minute window)
        if (!booking.startReminderSent && diffMinutesStart <= 0 && diffMinutesStart > -1) {
          await sendBookingNotificationEmail(booking.user.email, fullName, booking.facility.name, booking.startTime, booking.endTime, 'STARTED');
          await prisma.booking.update({ where: { id: booking.id }, data: { startReminderSent: true } });
        }

        // 2. Session Ended / Elapsed: When end time has passed
        if (diffMinutesEnd <= 0) {
          await sendBookingNotificationEmail(booking.user.email, fullName, booking.facility.name, booking.startTime, booking.endTime, 'EXPIRED');
          await prisma.booking.update({ where: { id: booking.id }, data: { expiredSent: true } });
        }
      }
    } catch (error) {
      console.error('Error running booking cron job:', error);
    }
  });

  console.log('📅 Booking notification cron worker initialized (Essential notifications only).');
};