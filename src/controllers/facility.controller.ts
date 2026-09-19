import { Request, Response } from 'express';
import { FacilityService } from '../services/facility.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class FacilityController {
  static async createFacility(req: AuthenticatedRequest, res: Response) {
    try {
      // Strictly restrict facility creation to authenticated users/admins
      const adminUserId = req.user?.userId || req.body.createdById;

      if (!adminUserId) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized: You must be logged in as an admin to create a facility.',
        });
      }

      // Strip out legacy pricing fields if passed in request body
      const { price_per_hour, pricePerHour, ...facilityPayload } = req.body;

      const facility = await FacilityService.createFacility(facilityPayload, adminUserId);
      return res.status(201).json({ status: 'success', data: facility });
    } catch (error: any) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
  }

  static async getAllFacilities(req: Request, res: Response) {
    try {
      const facilities = await FacilityService.getAllFacilities();
      return res.status(200).json({ status: 'success', data: facilities });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  }

  static async getFacilityById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const facility = await FacilityService.getFacilityById(id as string);
      return res.status(200).json({ status: 'success', data: facility });
    } catch (error: any) {
      return res.status(404).json({ status: 'error', message: error.message });
    }
  }
}