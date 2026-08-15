import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export async function checkHealth(_req: Request, res: Response) {
  try {
    // Hitting the database on purpose: answering 200 without it would hide
    // the most common failure, which is the app running with a bad connection.
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unavailable',
      database: 'disconnected',
      detail: error instanceof Error ? error.message : 'unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
