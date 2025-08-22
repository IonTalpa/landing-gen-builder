import crypto from 'crypto';
import { config } from './config';

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createCSRFHash(token: string): string {
  return crypto
    .createHmac('sha256', config.session.csrfSecret)
    .update(token)
    .digest('hex');
}

export function verifyCSRFToken(token: string, hash: string): boolean {
  const expectedHash = createCSRFHash(token);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
}

export function getCSRFTokenFromHeaders(request: Request): string | null {
  return request.headers.get('x-csrf-token');
}

export function validateCSRF(request: Request, storedHash: string): boolean {
  const token = getCSRFTokenFromHeaders(request);
  if (!token) return false;
  
  return verifyCSRFToken(token, storedHash);
}