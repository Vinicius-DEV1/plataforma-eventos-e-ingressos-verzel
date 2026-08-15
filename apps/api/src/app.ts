import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { healthRouter } from './routes/health.routes';

// Building the app is kept apart from starting it so integration tests can
// instantiate it without binding a port.
export function createApp(): Express {
  const app = express();

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

  return app;
}
