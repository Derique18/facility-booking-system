-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `endReminderSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `expiredSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `startReminderSent` BOOLEAN NOT NULL DEFAULT false;
