import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/contexts/auth-context';
import { Alert } from '@/components/ui/alert';
import { Field, Input } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
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
    <div className="space-y-5">
      {/* Fonte do catálogo como escolha explícita: o organizador precisa
          saber de qual acervo veio o que está publicando. */}
      <div className="border-input flex w-fit border">
        {(Object.keys(TYPE_LABEL) as EventType[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            aria-pressed={type === option}
            className={`label-print px-3 py-2 transition-colors ${
              type === option
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {TYPE_LABEL[option]}
          </button>
        ))}
      </div>

      <Field
        label="Buscar"
        htmlFor="catalog-query"
        hint={
          type === 'CINEMA'
            ? 'Campo vazio lista o que está em cartaz.'
            : 'Campo vazio lista os próximos eventos.'
        }
      >
        <div className="relative">
          <Search
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            id="catalog-query"
            className="pl-9"
            placeholder={type === 'CINEMA' ? 'Título do filme' : 'Nome do show'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </Field>

      {error && <Alert>{error}</Alert>}

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="aspect-[2/3] w-full" />
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhum resultado para esta busca.
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((item) => (
            <button
              key={item.externalId}
              type="button"
              onClick={() => onSelect(item, type)}
              className="border-border bg-card hover:border-primary focus-visible:ring-ring/40 ease-sharp flex flex-col overflow-hidden border text-left transition-[transform,border-color] duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-3"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="bg-muted flex aspect-[2/3] w-full items-center justify-center">
                  <span className="label-print">Sem imagem</span>
                </div>
              )}
              <div className="space-y-1 p-2.5">
                <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                {item.date && (
                  <p data-numeric className="text-muted-foreground text-xs">
                    {item.date}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
