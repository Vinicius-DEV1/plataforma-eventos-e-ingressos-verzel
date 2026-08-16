import { useCallback, useEffect, useState } from 'react';
import { CatalogSearch } from '@/components/organizer/CatalogSearch';
import { EventForm } from '@/components/organizer/EventForm';
import { OrganizerEventsList } from '@/components/organizer/OrganizerEventsList';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  CatalogItem,
  EventItem,
  EventType,
  ExternalSource,
} from '@/lib/api-types';

const SOURCE_BY_TYPE: Record<EventType, ExternalSource> = {
  CINEMA: 'TMDB',
  SHOW: 'TICKETMASTER',
};

type Tab = 'buscar' | 'meus-eventos';

type PendingCreate = { catalogItem: CatalogItem; eventType: EventType };

export default function OrganizerPage() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<Tab>('buscar');
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(
    null,
  );
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const loadEvents = useCallback(() => {
    async function run() {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const data = await apiFetch<{ items: EventItem[] }>('/eventos/meus', {
          token: token!,
        });
        setEvents(data.items);
      } catch (err) {
        setEventsError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar seus eventos.',
        );
      } finally {
        setEventsLoading(false);
      }
    }
    void run();
  }, [token]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function closeForm() {
    setPendingCreate(null);
    setEditingEvent(null);
  }

  function handleSaved() {
    closeForm();
    setTab('meus-eventos');
    loadEvents();
  }

  async function handleCancelEvent(event: EventItem) {
    if (
      !confirm(
        `Cancelar o evento "${event.title}"? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    setCancelingId(event.id);
    try {
      await apiFetch(`/eventos/${event.id}`, {
        method: 'DELETE',
        token: token!,
      });
      loadEvents();
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível cancelar o evento.',
      );
    } finally {
      setCancelingId(null);
    }
  }

  const showingForm = pendingCreate !== null || editingEvent !== null;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Painel do organizador
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name}</h1>
      </div>

      {showingForm ? (
        pendingCreate ? (
          <EventForm
            mode="create"
            catalogItem={pendingCreate.catalogItem}
            eventType={pendingCreate.eventType}
            externalSource={SOURCE_BY_TYPE[pendingCreate.eventType]}
            onCancel={closeForm}
            onSaved={handleSaved}
          />
        ) : (
          <EventForm
            mode="edit"
            event={editingEvent!}
            onCancel={closeForm}
            onSaved={handleSaved}
          />
        )
      ) : (
        <>
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setTab('buscar')}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                tab === 'buscar'
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground border-transparent'
              }`}
            >
              Buscar no catálogo
            </button>
            <button
              type="button"
              onClick={() => setTab('meus-eventos')}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                tab === 'meus-eventos'
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground border-transparent'
              }`}
            >
              Meus eventos
            </button>
          </div>

          {tab === 'buscar' ? (
            <CatalogSearch
              onSelect={(item, eventType) =>
                setPendingCreate({ catalogItem: item, eventType })
              }
            />
          ) : (
            <OrganizerEventsList
              events={events}
              loading={eventsLoading}
              error={eventsError}
              cancelingId={cancelingId}
              onEdit={setEditingEvent}
              onCancelEvent={(event) => {
                void handleCancelEvent(event);
              }}
            />
          )}
        </>
      )}
    </main>
  );
}
