import { Router } from 'express';
import { checkHealth } from '../controllers/health.controller';

export const healthRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verifica a saúde da aplicação e a conexão com o banco
 *     description: >
 *       Executa uma consulta trivial no banco para confirmar que a API não
 *       apenas está no ar, mas realmente alcança o PostgreSQL. Responder 200
 *       sem tocar no banco esconderia a falha mais comum: a aplicação sobe,
 *       mas a conexão está mal configurada.
 *     tags: [Saúde]
 *     responses:
 *       200:
 *         description: Aplicação no ar e banco conectado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 database:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: >
 *           Aplicação no ar, mas sem alcançar o banco. É 503 e não 500 porque
 *           o serviço está indisponível, não quebrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unavailable
 *                 database:
 *                   type: string
 *                   example: disconnected
 *                 detail:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
healthRouter.get('/health', checkHealth);
