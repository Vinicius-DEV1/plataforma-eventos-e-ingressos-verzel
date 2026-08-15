import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';

/*
 * A definição OpenAPI é montada a partir de anotações JSDoc nos próprios
 * arquivos de rota. A alternativa seria um objeto único com todos os
 * endpoints, mas com cerca de vinte rotas previstas ele viraria um arquivo
 * longo e desconectado do código que descreve — e documentação distante do
 * código é documentação que dessincroniza.
 */
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

  /*
   * Os dois padrões cobrem os dois modos de execução: `.ts` quando roda via
   * tsx em desenvolvimento, `.js` quando roda o compilado em dist/. O
   * tsconfig não usa `removeComments`, então as anotações sobrevivem à
   * compilação.
   */
  apis: [
    path.join(__dirname, '..', 'routes', '*.ts'),
    path.join(__dirname, '..', 'routes', '*.js'),
  ],
});
