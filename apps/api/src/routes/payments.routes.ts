import { Router } from 'express';
import {
  asaasWebhook,
  getPayment,
  processPayment,
  simulateCallback,
} from '../controllers/payments.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireRole } from '../middlewares/requireRole';
import { Role } from '../generated/prisma/enums';

export const paymentsRouter = Router();

/**
 * @openapi
 * /pagamentos/{reservationId}/processar:
 *   post:
 *     summary: Dispara a cobrança simulada (Asaas) para uma reserva
 *     description: >
 *       Cria a cobrança no sandbox do Asaas. Com method=PIX, retorna o
 *       Payment (status PENDING) mais o QR Code/copia-e-cola reais — a
 *       confirmação chega depois, por polling em GET /pagamentos/:id, pelo
 *       webhook (produção) ou por POST /pagamentos/:id/simular-callback
 *       (dev/testes). Com method=CREDIT_CARD, o Asaas resolve a cobrança
 *       na hora (aprovação/recusa determinística pelo número do cartão de
 *       teste usado) e o Payment já volta CONFIRMED ou DECLINED — SPEC.md §5.5.
 *     tags: [Pagamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [method]
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [PIX, CREDIT_CARD]
 *               card:
 *                 type: object
 *                 description: Obrigatório quando method=CREDIT_CARD
 *                 properties:
 *                   holderName:
 *                     type: string
 *                   number:
 *                     type: string
 *                   expiryMonth:
 *                     type: string
 *                   expiryYear:
 *                     type: string
 *                   ccv:
 *                     type: string
 *     responses:
 *       201:
 *         description: >
 *           Pagamento criado. PIX vem com `pix.encodedImage`/`pix.payload`;
 *           cartão já vem resolvido (CONFIRMED ou DECLINED)
 *       400:
 *         description: method ausente/inválido, ou dados do cartão incompletos
 *       403:
 *         description: A reserva não pertence ao cliente autenticado
 *       404:
 *         description: Reserva não encontrada
 *       409:
 *         description: Reserva não está PENDING, já tem pagamento, ou expirou
 */
paymentsRouter.post(
  '/pagamentos/:reservationId/processar',
  authenticate,
  requireRole(Role.CUSTOMER),
  processPayment,
);

/**
 * @openapi
 * /pagamentos/{id}:
 *   get:
 *     summary: Consulta o status de um pagamento
 *     description: >
 *       Consumido em polling pelo front enquanto o pagamento estiver PENDING
 *       (SPEC.md §5.5). Quando o status é CONFIRMED, a resposta inclui
 *       `invoiceUrl` — o comprovante da cobrança no Asaas.
 *     tags: [Pagamentos]
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
 *         description: Pagamento encontrado
 *       403:
 *         description: O pagamento não pertence ao cliente autenticado
 *       404:
 *         description: Pagamento não encontrado
 */
paymentsRouter.get(
  '/pagamentos/:id',
  authenticate,
  requireRole(Role.CUSTOMER),
  getPayment,
);

/**
 * @openapi
 * /webhooks/asaas:
 *   post:
 *     summary: Callback do Asaas com o desfecho do pagamento
 *     description: >
 *       Rota pública, ativa em produção — o Asaas não alcança um servidor
 *       em localhost, então em desenvolvimento o mesmo efeito é obtido via
 *       POST /pagamentos/:id/simular-callback (SPEC.md §5.5).
 *     tags: [Pagamentos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: PAYMENT_CONFIRMED
 *               payment:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *     responses:
 *       200:
 *         description: Evento processado (ou ignorado, se não mapeado)
 *       400:
 *         description: payment.id ausente no corpo
 *       404:
 *         description: Pagamento não encontrado
 *       409:
 *         description: Pagamento já havia sido resolvido
 */
paymentsRouter.post('/webhooks/asaas', asaasWebhook);

/**
 * @openapi
 * /pagamentos/{id}/simular-callback:
 *   post:
 *     summary: Força o desfecho de um pagamento (desenvolvimento e testes)
 *     description: >
 *       Aplica manualmente o mesmo efeito que o webhook do Asaas aplicaria,
 *       sem depender de uma URL pública alcançável pelo Asaas (SPEC.md §5.5).
 *     tags: [Pagamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [outcome]
 *             properties:
 *               outcome:
 *                 type: string
 *                 enum: [CONFIRMED, DECLINED]
 *     responses:
 *       200:
 *         description: Pagamento resolvido
 *       400:
 *         description: outcome ausente ou inválido
 *       403:
 *         description: O pagamento não pertence ao cliente autenticado
 *       404:
 *         description: Pagamento não encontrado
 *       409:
 *         description: Pagamento já havia sido resolvido
 */
paymentsRouter.post(
  '/pagamentos/:id/simular-callback',
  authenticate,
  requireRole(Role.CUSTOMER),
  simulateCallback,
);
