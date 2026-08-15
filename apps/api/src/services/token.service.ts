import jwt from 'jsonwebtoken';
import type { Role } from '../generated/prisma/enums';

// No expiry duration is specified anywhere in the docs; 7 days is a
// reasonable session default for a demo app, not a load-bearing decision.
const TOKEN_TTL = '7d';

export type AuthTokenPayload = {
  userId: string;
  role: Role;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Copy apps/api/.env.example to .env.',
    );
  }
  return secret;
}

export function generateToken(userId: string, role: Role): string {
  const payload: AuthTokenPayload = { userId, role };
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret()) as AuthTokenPayload;
}
