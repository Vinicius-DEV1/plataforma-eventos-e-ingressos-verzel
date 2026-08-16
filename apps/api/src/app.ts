import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './config/swagger';
import { authRouter } from './routes/auth.routes';
import { catalogRouter } from './routes/catalog.routes';
import { eventsRouter } from './routes/events.routes';
import { healthRouter } from './routes/health.routes';

// Building the app is kept apart from starting it so integration tests can
// instantiate it without binding a port.
export function createApp(): Express {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Plataforma de Eventos e Ingressos — API',
    }),
  );

  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(healthRouter);
  app.use(authRouter);
  app.use(catalogRouter);
  app.use(eventsRouter);

  return app;
}
