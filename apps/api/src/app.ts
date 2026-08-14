import express, { type Express } from 'express';

/**
 * Monta a aplicação Express sem colocá-la no ar.
 * Separar isso de `server.ts` permite instanciar a app nos testes de
 * integração sem ocupar uma porta.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  return app;
}
