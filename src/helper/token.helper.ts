import crypto from 'crypto';

/**
 * Generates a random 6-character uppercase alphanumeric token.
 */
export const generateSixDigitToken = (): string => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};