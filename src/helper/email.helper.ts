import nodemailer from 'nodemailer';
import { BookingStatus } from '@prisma/client';

// 1. Initialize the Ethereal transporter (Singleton pattern)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPasswordResetEmail = async (
  email: string,
  fullName: string,
  token: string
): Promise<void> => {
  const htmlTemplate = `
    <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #111827; margin: 0; font-size: 24px;">Password Reset Request</h2>
        </div>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          Hello <strong>${fullName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
          We received a request to reset the password for your account. Please use the verification code below to complete the process:
        </p>
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 25px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb;">
            ${token}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 30px;">
          This code is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Facility Booking System. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Facility Booking Admin" <no-reply@facilityapp.com>',
    to: email,
    subject: 'Your Password Reset Verification Code',
    html: htmlTemplate,
  });
};

export const sendBookingNotificationEmail = async (
  email: string,
  fullName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  notificationType: 'STARTED' | 'EXPIRED'
): Promise<void> => {
  let subject = '';
  let messageBody = '';
  let badgeColor = '#2563eb';

  switch (notificationType) {
    case 'STARTED':
      subject = 'Your facility booking has officially started';
      messageBody = 'Your scheduled time slot has begun. Enjoy your session!';
      badgeColor = '#16a34a';
      break;
    case 'EXPIRED':
      subject = 'Your facility booking session has elapsed';
      messageBody = 'Your allocated time slot has now ended. Thank you for using our facility service.';
      badgeColor = '#dc2626';
      break;
  }

  const htmlTemplate = `
    <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
            Booking Update
          </span>
        </div>
        <h2 style="color: #111827; text-align: center; margin-top: 0; font-size: 20px; margin-bottom: 20px;">${subject}</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 15px;">
          Hello <strong>${fullName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
          ${messageBody}
        </p>
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Facility:</strong> ${facilityName}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>End Time:</strong> ${new Date(endTime).toLocaleString()}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Facility Booking System. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Facility System" <no-reply@facilityapp.com>',
    to: email,
    subject,
    html: htmlTemplate,
  });
};

export const sendNewBookingAdminNotification = async (
  adminEmail: string,
  adminName: string,
  userName: string,
  userEmail: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  date: string
): Promise<void> => {
  const htmlTemplate = `
    <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
            New Booking Request
          </span>
        </div>
        <h2 style="color: #111827; text-align: center; margin-top: 0; font-size: 20px; margin-bottom: 20px;">Action Required: Booking Pending</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 15px;">
          Hello <strong>${adminName || 'Admin'}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
          User <strong>${userName}</strong> (${userEmail}) has submitted a reservation request for one of your managed facilities.
        </p>
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Facility:</strong> ${facilityName}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Start Time:</strong> ${new Date(startTime).toLocaleTimeString()}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>End Time:</strong> ${new Date(endTime).toLocaleTimeString()}</p>
        </div>
        <p style="color: #4b5563; font-size: 14px; text-align: center; margin-bottom: 25px;">
          Please log in to the admin portal to approve or reject this session.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Facility Booking System. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Facility System" <no-reply@facilityapp.com>',
    to: adminEmail,
    subject: `New Booking Request: ${facilityName}`,
    html: htmlTemplate,
  });
};

export const sendBookingStatusUpdateEmail = async (
  userEmail: string,
  fullName: string,
  facilityName: string,
  status: BookingStatus,
  startTime: string,
  endTime: string
): Promise<void> => {
  const isApproved = status === BookingStatus.APPROVED;
  const badgeColor = isApproved ? '#16a34a' : '#dc2626';

  const htmlTemplate = `
    <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: ${badgeColor}; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
            Booking ${status}
          </span>
        </div>
        <h2 style="color: #111827; text-align: center; margin-top: 0; font-size: 20px; margin-bottom: 20px;">Your booking has been ${status.toLowerCase()}</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 15px;">
          Hello <strong>${fullName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
          ${isApproved 
            ? 'Great news! Your booking request has been approved by the facility administrator.' 
            : 'We regret to inform you that your booking request has been rejected.'}
        </p>
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Facility:</strong> ${facilityName}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>End Time:</strong> ${new Date(endTime).toLocaleString()}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Facility Booking System. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Facility System" <no-reply@facilityapp.com>',
    to: userEmail,
    subject: `Booking Request ${status}: ${facilityName}`,
    html: htmlTemplate,
  });
};

export const sendWaitlistNotificationEmail = async (
  userEmail: string,
  fullName: string,
  facilityName: string,
  startTime: string,
  endTime: string
): Promise<void> => {
  const htmlTemplate = `
    <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
            Slot Now Available!
          </span>
        </div>
        <h2 style="color: #111827; text-align: center; margin-top: 0; font-size: 20px; margin-bottom: 20px;">Your Waitlisted Time Slot is Open</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 15px;">
          Hello <strong>${fullName}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
          Good news! The time slot you were waiting for has just opened up due to a cancellation. Head over to the platform quickly to book it before someone else does!
        </p>
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Facility:</strong> ${facilityName}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>End Time:</strong> ${new Date(endTime).toLocaleString()}</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Facility Booking System. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Facility System" <no-reply@facilityapp.com>',
    to: userEmail,
    subject: `Slot Available: ${facilityName}`,
    html: htmlTemplate,
  });
};

export const sendBookingCancelledAdminNotification = async (
  adminEmail: string,
  adminName: string,
  userName: string,
  facilityName: string,
  startTime: string,
  endTime: string
): Promise<void> => {
  const htmlTemplate = `
    <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
            Booking Cancelled
          </span>
        </div>
        <h2 style="color: #111827; text-align: center; margin-top: 0; font-size: 20px; margin-bottom: 20px;">A User Cancelled Their Reservation</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 15px;">
          Hello <strong>${adminName || 'Admin'}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
          Just a quick update: User <strong>${userName}</strong> has cancelled their upcoming reservation for one of your managed facilities.
        </p>
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Facility:</strong> ${facilityName}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>Start Time:</strong> ${new Date(startTime).toLocaleString('en-GB', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
          <p style="margin: 6px 0; color: #374151; font-size: 14px;"><strong>End Time:</strong> ${new Date(endTime).toLocaleString('en-GB', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <p style="color: #4b5563; font-size: 14px; text-align: center; margin-bottom: 25px;">
          This time slot is now open and available for other users to book.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-bottom: 20px;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Facility Booking System. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Facility System" <no-reply@facilityapp.com>',
    to: adminEmail,
    subject: `Booking Cancelled: ${facilityName}`,
    html: htmlTemplate,
  });
};