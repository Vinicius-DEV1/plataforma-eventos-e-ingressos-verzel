import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { CatalogItem, EventType } from '@/lib/api-types';

const CATALOG_PATH: Record<EventType, string> = {
  CINEMA: '/catalogo/filmes',
  SHOW: '/catalogo/shows',
};

const TYPE_LABEL: Record<EventType, string> = {
  CINEMA: 'Filmes (TMDb)',
  SHOW: 'Shows (Ticketmaster)',
};

type CatalogSearchProps = {
  onSelect: (item: CatalogItem, type: EventType) => void;
};

export function CatalogSearch({ onSelect }: CatalogSearchProps) {
  const { token } = useAuth();
  const [type, setType] = useState<EventType>('CINEMA');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function search() {
      setLoading(true);
      setError(null);
      const params = debouncedQuery
        ? `?query=${encodeURIComponent(debouncedQuery)}`
        : '';
      try {
        const data = await apiFetch<{ items: CatalogItem[] }>(
          `${CATALOG_PATH[type]}${params}`,
          { token: token! },
        );
        if (!cancelled) setResults(data.items);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível buscar o catálogo.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void search();

    return () => {
      cancelled = true;
    };
  }, [type, debouncedQuery, token]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(Object.keys(TYPE_LABEL) as EventType[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              type === option
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-input bg-background hover:bg-muted'
            }`}
          >
            {TYPE_LABEL[option]}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder={
          type === 'CINEMA'
            ? 'Buscar filme (vazio = em cartaz)'
            : 'Buscar show/evento'
        }
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3"
      />

      {error && <p className="text-destructive text-sm">{error}</p>}
      {loading && <p className="text-muted-foreground text-sm">Buscando…</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {results.map((item) => (
          <button
            key={item.externalId}
            type="button"
            onClick={() => onSelect(item, type)}
            className="border-border bg-card hover:border-ring flex flex-col overflow-hidden border text-left transition-colors"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt=""
                className="aspect-[2/3] w-full object-cover"
              />
            )}
            <div className="space-y-1 p-2">
              <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
              {item.date && (
                <p className="text-muted-foreground text-xs">{item.date}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {!loading && !error && results.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhum resultado.</p>
      )}
    </div>
  );
}
