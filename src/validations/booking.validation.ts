import Joi from 'joi';

export const createBookingSchema = Joi.object({
  userId: Joi.string().uuid().optional().messages({
    'string.uuid': 'userId must be a valid UUID.',
  }),
  facilityId: Joi.string().uuid().required().messages({
    'string.uuid': 'facilityId must be a valid UUID.',
    'any.required': 'facilityId is required.',
  }),
  startTime: Joi.string().isoDate().required().messages({
    'string.isoDate': 'startTime must be a valid ISO date string.',
    'any.required': 'startTime is required.',
  }),
  endTime: Joi.string().isoDate().required().messages({
    'string.isoDate': 'endTime must be a valid ISO date string.',
    'any.required': 'endTime is required.',
  }),
  date: Joi.string().isoDate().optional(),
});

export const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid('APPROVED', 'REJECTED').required().messages({
    'any.only': 'Status must be APPROVED or REJECTED.',
    'any.required': 'Status is required.',
  }),
});