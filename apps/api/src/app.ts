import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { healthRouter } from './routes/health.routes';

/**
 * Monta a aplicação Express sem colocá-la no ar.
 * Separar isso de `server.ts` permite instanciar a app nos testes de
 * integração sem ocupar uma porta.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  // Documentação interativa servida pela própria aplicação.
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Plataforma de Eventos e Ingressos — API',
    }),
  );

  // A definição crua, útil para importar em outras ferramentas.
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(healthRouter);

  return app;
}
