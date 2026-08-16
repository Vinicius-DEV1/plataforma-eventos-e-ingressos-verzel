import { Router } from 'express';
import { validateTicket } from '../controllers/gatekeeper.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '../generated/prisma/enums';

export const gatekeeperRouter = Router();

/**
 * @openapi
 * /portaria/validar:
 *   post:
 *     summary: Valida um ingresso na entrada de um evento
 *     description: >
 *       Verifica a assinatura do JWT lido do QR (ou digitado manualmente).
 *       Se a assinatura for inválida, retorna `invalid` sem consultar o
 *       banco. Se válida, confere se o `eventId` do token bate com o
 *       evento informado no corpo — caso contrário, `wrong_event`. A
 *       marcação como usado é feita por update condicional dentro de uma
 *       transação, para que duas leituras simultâneas do mesmo QR nunca
 *       sejam ambas aceitas (SPEC.md §3.2).
 *     tags: [Portaria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, eventId]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Texto lido do QR (o JWT do ingresso)
 *               eventId:
 *                 type: string
 *                 description: Evento selecionado pela portaria no início da sessão
 *     responses:
 *       200:
 *         description: >
 *           Resultado da validação em `result`: `valid`, `invalid`,
 *           `already_used` ou `wrong_event`
 *       400:
 *         description: code ou eventId ausentes
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de GATEKEEPER
 */
gatekeeperRouter.post(
  '/portaria/validar',
  authenticate,
  requireRole(Role.GATEKEEPER),
  validateTicket,
);
