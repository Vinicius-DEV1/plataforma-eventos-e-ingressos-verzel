import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EventCard } from '@/components/events/EventCard';
import { FeaturedEventCard } from '@/components/events/FeaturedEventCard';
import { EventCardSkeleton } from '@/components/events/EventCardSkeleton';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { DateField } from '@/components/ui/date-field';
import { Field, Input } from '@/components/ui/field';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { apiFetch, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { EventFilterOptions, EventItem } from '@/lib/api-types';

type Filters = {
  date: string;
  category: string;
  venue: string;
  minPrice: string;
  maxPrice: string;
};

const EMPTY_FILTERS: Filters = {
  date: '',
  category: '',
  venue: '',
  minPrice: '',
  maxPrice: '',
};

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.date) params.set('date', filters.date);
  if (filters.category) params.set('category', filters.category);
  if (filters.venue) params.set('venue', filters.venue);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  // Distingue "abrindo a tela" de "refiltrando": só a primeira carga troca o
  // conteúdo por esqueleto. Refiltrar mantém o resultado anterior no lugar,
  // porque trocar a grade por seis esqueletos a cada tecla fazia a página
  // inteira pular de altura.
  const [firstLoad, setFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const debouncedFilters = useDebouncedValue(filters, 400);
  const [options, setOptions] = useState<EventFilterOptions>({
    categories: [],
    venues: [],
  });

  // Carregado uma vez, fora do efeito de listagem: a lista de opções não pode
  // encolher conforme o cliente filtra. Se falhar, os campos seguem
  // funcionando como busca por texto.
  useEffect(() => {
    let cancelled = false;
    apiFetch<EventFilterOptions>('/eventos/filtros')
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {
        // sem lista de sugestão, o filtro por texto continua de pé
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ items: EventItem[] }>(
          `/eventos${buildQuery(debouncedFilters)}`,
        );
        if (!cancelled) setEvents(data.items);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar os eventos.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFirstLoad(false);
        }
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [debouncedFilters]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <AppShell width="wide">
      <PageHeader
        label="Catálogo"
        title="Em cartaz"
        meta={
          // Some só enquanto não há número nenhum para mostrar: se sumisse a
          // cada refiltragem, o cabeçalho encolheria e empurraria a página.
          firstLoad || error
            ? undefined
            : `${events.length} ${events.length === 1 ? 'evento publicado' : 'eventos publicados'}`
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <SlidersHorizontal className="size-3.5" aria-hidden />
            Filtros
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              <X aria-hidden />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Data" htmlFor="filter-date">
            <DateField
              id="filter-date"
              value={filters.date}
              onChange={(value) => updateFilter('date', value)}
            />
          </Field>
          <Field label="Categoria" htmlFor="filter-category">
            <Combobox
              id="filter-category"
              options={options.categories}
              placeholder="Todas"
              value={filters.category}
              onChange={(value) => updateFilter('category', value)}
            />
          </Field>
          <Field label="Local" htmlFor="filter-venue">
            <Combobox
              id="filter-venue"
              options={options.venues}
              placeholder="Todos"
              value={filters.venue}
              onChange={(value) => updateFilter('venue', value)}
            />
          </Field>
          <Field label="Preço mín." htmlFor="filter-min">
            <Input
              id="filter-min"
              type="number"
              min="0"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
            />
          </Field>
          <Field label="Preço máx." htmlFor="filter-max">
            <Input
              id="filter-max"
              type="number"
              min="0"
              placeholder="500"
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {error && <Alert>{error}</Alert>}

      {loading && firstLoad && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <EventCardSkeleton key={index} />
          ))}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-lg border border-border bg-card text-muted-foreground flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <p className="text-sm font-medium">
            {hasActiveFilters
              ? 'Nenhum evento encontrado com esses filtros.'
              : 'Nenhum evento publicado ainda.'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {!firstLoad && events.length > 0 && (
        <div
          aria-busy={loading}
          className={cn(
            'grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3',
            loading && 'opacity-50',
          )}
        >
          <FeaturedEventCard event={events[0]} />
          {events.slice(1).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
