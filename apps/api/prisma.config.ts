import { defineConfig } from 'prisma/config';

// `prisma init` generates this file using dotenv; replaced by the native
// loader to avoid the dependency. The catch covers production, where the
// variables come from the environment and no .env file exists.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: variables come from the environment.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
