import { TtlCache } from '../services/cache.service';
import { UpstreamRateLimitError } from './errors';
import type { CatalogItem } from './catalog.types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const CACHE_TTL_MS = 5 * 60_000;

const cache = new TtlCache<CatalogItem[]>(CACHE_TTL_MS);

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error(
      'TMDB_API_KEY is not set. Copy apps/api/.env.example to .env.',
    );
  }
  return key;
}

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
};

type TmdbSearchResponse = { results: TmdbMovie[] };

function normalize(movie: TmdbMovie): CatalogItem {
  return {
    externalId: String(movie.id),
    title: movie.title,
    description: movie.overview,
    imageUrl: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '',
    date: movie.release_date || null,
  };
}

// No `query`: lists movies currently in theaters (PRD §3.1 — "filmes em
// cartaz"). With `query`: searches by title instead.
export async function searchMovies(query?: string): Promise<CatalogItem[]> {
  const cacheKey = query ?? '__now_playing__';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    api_key: getApiKey(),
    language: 'pt-BR',
  });
  if (query) {
    params.set('query', query);
  } else {
    params.set('region', 'BR');
  }

  const endpoint = query ? '/search/movie' : '/movie/now_playing';
  const response = await fetch(
    `${TMDB_BASE_URL}${endpoint}?${params.toString()}`,
  );

  if (response.status === 429) {
    throw new UpstreamRateLimitError('TMDb rate limit excedido.');
  }
  if (!response.ok) {
    throw new Error(`TMDb respondeu ${response.status}.`);
  }

  const data = (await response.json()) as TmdbSearchResponse;
  const items = data.results.map(normalize);
  cache.set(cacheKey, items);
  return items;
}
