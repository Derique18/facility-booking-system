/**
 * @swagger
 * tags:
 *   - name: Bookings
 *     description: Facility Booking and Time Slot Management
 */

/**
 * @swagger
 * /api/bookings/facilities/{facilityId}/available-slots:
 *   get:
 *     summary: Get available 1-hour time slots for a specific date (9 AM - 6 PM)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-09-05"
 *     responses:
 *       200:
 *         description: Successfully retrieved slots
 */

/**
 * @swagger
 * /api/bookings/block:
 *   post:
 *     summary: Block a time slot for maintenance (Admin Only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facilityId: { type: string }
 *               date: { type: string, format: date }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: Slot blocked successfully
 */

/**
 * @swagger
 * /api/bookings/waitlist:
 *   post:
 *     summary: Join the waitlist for a booked time slot
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facilityId: { type: string }
 *               date: { type: string, format: date }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *     responses:
 *       201:
 *         description: Successfully joined waitlist
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new facility booking with strict multi-slot enforcement
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               facilityId: { type: string }
 *               date: { type: string, format: date }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *     responses:
 *       201:
 *         description: Booking created successfully
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Retrieve all bookings in the system
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all bookings
 */

/**
 * @swagger
 * /api/bookings/user/me:
 *   get:
 *     summary: Get all bookings belonging to the current authenticated user
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user bookings
 */

/**
 * @swagger
 * /api/bookings/user/{userId}:
 *   get:
 *     summary: Get all bookings belonging to a specific user
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user bookings
 */

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update a booking's status (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [APPROVED, REJECTED] }
 *     responses:
 *       200:
 *         description: Booking status updated
 */

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Cancel/Delete a booking (User Only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */