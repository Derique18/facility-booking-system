import { Router } from 'express';
import { FacilityController } from '../controllers/facility.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createFacilitySchema } from '../validations/facility.validation';

const router = Router();

// STRICT ADMIN ENFORCEMENT: Only authenticated admins can create facilities
router.post(
  '/',
  authenticateToken as any,
  authorizeRoles('ADMIN') as any,
  validateBody(createFacilitySchema),
  FacilityController.createFacility
);

// Public or User-facing routes (viewing facilities)
router.get('/', FacilityController.getAllFacilities);
router.get('/:id', FacilityController.getFacilityById);

export default router;