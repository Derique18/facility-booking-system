-- DropForeignKey
ALTER TABLE `Booking` DROP FOREIGN KEY `Booking_facilityId_fkey`;

-- AlterTable
ALTER TABLE `Facility` ADD COLUMN `capacity` INTEGER NULL DEFAULT 0,
    ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL DEFAULT 'Main Campus',
    ADD COLUMN `price_per_hour` DOUBLE NULL DEFAULT 0,
    MODIFY `description` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Facility` ADD CONSTRAINT `Facility_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_facilityId_fkey` FOREIGN KEY (`facilityId`) REFERENCES `Facility`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
