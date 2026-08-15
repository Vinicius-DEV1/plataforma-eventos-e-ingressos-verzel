import type { CorsOptions } from 'cors';

const DEFAULT_DEV_ORIGIN = 'http://localhost:5173';

function resolveAllowedOrigins(): string[] {
  const configured = process.env.CORS_ORIGIN;
  if (!configured) {
    return [DEFAULT_DEV_ORIGIN];
  }
  return configured.split(',').map((origin) => origin.trim());
}

export const corsOptions: CorsOptions = {
  origin: resolveAllowedOrigins(),
};
