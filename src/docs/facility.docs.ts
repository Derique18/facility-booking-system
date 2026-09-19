/**
 * @swagger
 * tags:
 *   - name: Facilities
 *     description: Facility Management
 */

/**
 * @swagger
 * /api/facilities:
 *   post:
 *     summary: Create a new facility (Admin only)
 *     tags: [Facilities]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name: { type: string, example: Executive Boardroom }
 *               description: { type: string, example: Main corporate meeting facility }
 *               category: { type: string, enum: [Office, Lounge, Experience center, Shop], example: Lounge }
 *               location: { type: string, example: Main Campus }
 *               capacity: { type: integer, example: 15 }
 *               openTime: { type: string, example: "09:00" }
 *               closeTime: { type: string, example: "18:00" }
 *     responses:
 *       201:
 *         description: Facility created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Requires ADMIN role)
 */

/**
 * @swagger
 * /api/facilities:
 *   get:
 *     summary: Retrieve a list of all available facilities
 *     tags: [Facilities]
 *     responses:
 *       200:
 *         description: List of facilities returned successfully
 */

/**
 * @swagger
 * /api/facilities/{id}:
 *   get:
 *     summary: Get details of a single facility by ID
 *     tags: [Facilities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Facility ID
 *     responses:
 *       200:
 *         description: Facility details returned successfully
 *       404:
 *         description: Facility not found
 */