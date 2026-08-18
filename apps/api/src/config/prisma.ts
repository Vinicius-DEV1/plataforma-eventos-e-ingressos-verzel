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

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      // O Render (e provedores gerenciados em geral) exige TLS na conexão
      // externa, e o `pg` não negocia isso sozinho: sem este `ssl`, toda
      // consulta falha com "SSL/TLS required", que o Prisma traduz de forma
      // enganosa em "acesso negado" (código 28000) — não é permissão, é
      // handshake. `rejectUnauthorized: false` porque o certificado é
      // autoassinado pelo provedor, não uma CA pública.
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
    }),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
