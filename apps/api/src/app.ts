import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './config/swagger';
import { authRouter } from './routes/auth.routes';
import { catalogRouter } from './routes/catalog.routes';
import { categoriesRouter } from './routes/categories.routes';
import { eventsRouter } from './routes/events.routes';
import { gatekeeperRouter } from './routes/gatekeeper.routes';
import { healthRouter } from './routes/health.routes';
import { paymentsRouter } from './routes/payments.routes';
import { reservationsRouter } from './routes/reservations.routes';
import { ticketsRouter } from './routes/tickets.routes';

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
  app.use(categoriesRouter);
  app.use(eventsRouter);
  app.use(reservationsRouter);
  app.use(paymentsRouter);
  app.use(ticketsRouter);
  app.use(gatekeeperRouter);

  return app;
}
