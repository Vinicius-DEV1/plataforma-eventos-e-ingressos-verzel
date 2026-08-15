import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Plataforma de Eventos e Ingressos',
      version: '1.0.0',
      description:
        'API da plataforma de bilheteria: organizadores publicam eventos, ' +
        'clientes reservam e pagam, e a portaria valida ingressos na entrada.',
    },
    servers: [
      { url: 'http://localhost:3333', description: 'Desenvolvimento local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Token obtido em POST /auth/login. Envie como: Bearer <token>.',
        },
      },
    },
  },

  // Both extensions: `.ts` when running from source via tsx, `.js` when
  // running the compiled output.
  apis: [
    path.join(__dirname, '..', 'routes', '*.ts'),
    path.join(__dirname, '..', 'routes', '*.js'),
  ],
});
