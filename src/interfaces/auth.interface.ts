import { Request } from 'express';

// Define the JWT Payload shape
export interface JwtPayload {
  userId: string;
  role: string;
  email?: string;
}

// Extend the Express Request to include our custom user object
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}