import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';

/**
 * Verifica se a aplicação está no ar e se ela realmente alcança o banco.
 *
 * A consulta trivial (`SELECT 1`) existe porque responder 200 sem tocar no
 * banco esconderia justamente a falha mais comum: a API sobe, mas a conexão
 * está errada. Falha aqui retorna 503, não 500 — o serviço está indisponível,
 * não quebrado.
 */
export async function verificarSaude(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      banco: 'conectado',
      horario: new Date().toISOString(),
    });
  } catch (erro) {
    res.status(503).json({
      status: 'indisponivel',
      banco: 'desconectado',
      detalhe: erro instanceof Error ? erro.message : 'erro desconhecido',
      horario: new Date().toISOString(),
    });
  }
}
