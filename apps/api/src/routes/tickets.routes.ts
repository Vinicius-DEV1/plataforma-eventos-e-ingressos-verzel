import { Router } from 'express';
import {
  getSharedTicket,
  getTicket,
  listMyTickets,
} from '../controllers/tickets.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '../generated/prisma/enums';

export const ticketsRouter = Router();

/**
 * @openapi
 * /ingressos/meus:
 *   get:
 *     summary: Lista os ingressos do cliente logado
 *     description: >
 *       Um ingresso por entrada (SPEC.md §1.5) — uma reserva de N entradas
 *       aparece aqui como N ingressos independentes, mais recentes primeiro.
 *     tags: [Ingressos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ingressos do cliente logado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Papel diferente de CUSTOMER
 */
ticketsRouter.get(
  '/ingressos/meus',
  authenticate,
  requireRole(Role.CUSTOMER),
  listMyTickets,
);

/**
 * @openapi
 * /ingressos/compartilhar/{shareToken}:
 *   get:
 *     summary: Visualiza um ingresso via link de compartilhamento (público)
 *     description: >
 *       Não exige login e não transfere titularidade (PRD.md §3.7) — o
 *       ingresso continua vinculado a quem comprou, o link só permite
 *       repassar a entrada, equivalente a mandar o QR por mensagem.
 *     tags: [Ingressos]
 *     parameters:
 *       - in: path
 *         name: shareToken
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ingresso encontrado, com QR renderizado (`qrImage`)
 *       404:
 *         description: Ingresso não encontrado
 */
ticketsRouter.get('/ingressos/compartilhar/:shareToken', getSharedTicket);

/**
 * @openapi
 * /ingressos/{id}:
 *   get:
 *     summary: Detalhe de um ingresso do cliente logado
 *     description: Inclui o QR renderizado (`qrImage`, data URL em base64).
 *     tags: [Ingressos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ingresso encontrado
 *       403:
 *         description: O ingresso não pertence ao cliente autenticado
 *       404:
 *         description: Ingresso não encontrado
 */
ticketsRouter.get(
  '/ingressos/:id',
  authenticate,
  requireRole(Role.CUSTOMER),
  getTicket,
);
