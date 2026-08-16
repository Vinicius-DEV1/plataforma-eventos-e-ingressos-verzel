import type { Request, Response } from 'express';
import { searchMovies } from '../integrations/tmdb.client';
import { searchEvents } from '../integrations/ticketmaster.client';
import { UpstreamRateLimitError } from '../integrations/errors';

function getQueryParam(req: Request): string | undefined {
  const { query } = req.query;
  return typeof query === 'string' ? query : undefined;
}

export async function getMovies(req: Request, res: Response) {
  try {
    const items = await searchMovies(getQueryParam(req));
    res.json({ items });
  } catch (error) {
    if (error instanceof UpstreamRateLimitError) {
      res.status(429).json({
        message:
          'Muitas buscas no catálogo de filmes agora. Tente novamente em instantes.',
      });
      return;
    }
    throw error;
  }
}

export async function getShows(req: Request, res: Response) {
  try {
    const items = await searchEvents(getQueryParam(req));
    res.json({ items });
  } catch (error) {
    if (error instanceof UpstreamRateLimitError) {
      res.status(429).json({
        message:
          'Muitas buscas no catálogo de shows agora. Tente novamente em instantes.',
      });
      return;
    }
    throw error;
  }
}
