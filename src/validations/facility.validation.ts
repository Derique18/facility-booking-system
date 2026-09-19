import Joi from 'joi';

// Expanded categories based on Phase 1 requirements
export const ALLOWED_CATEGORIES = [
  'Office',
  'Lounge',
  'Experience center',
  'Shop',
  'Conference Room',
  'Auditorium',
  'Boardroom',
  'Event Space',
  'Studio'
] as const;

export const createFacilitySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'any.required': 'Facility name is required.',
  }),
  description: Joi.string().trim().optional().allow(''),
  category: Joi.string()
    .valid(...ALLOWED_CATEGORIES)
    .required()
    .messages({
      'any.required': 'Category is required.',
      'any.only': `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`,
    }),
  location: Joi.string().trim().optional().allow(''),
  capacity: Joi.number().integer().min(0).optional(),
  
  // Custom operating hours validation (24-hour HH:MM format, e.g., "09:00", "18:00")
  openTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .default('09:00')
    .messages({
      'string.pattern.base': 'openTime must be a valid 24-hour time format (HH:MM), e.g., "09:00".',
    }),
  closeTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .default('18:00')
    .messages({
      'string.pattern.base': 'closeTime must be a valid 24-hour time format (HH:MM), e.g., "18:00".',
    }),
  
  createdById: Joi.string().uuid().optional(),
});