import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Kept on globalThis outside production: `tsx watch` reloads modules on every
// save, and a new client each time would exhaust the database connections.
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy apps/api/.env.example to .env.',
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
