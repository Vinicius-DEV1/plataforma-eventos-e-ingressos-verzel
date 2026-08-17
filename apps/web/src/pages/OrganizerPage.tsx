import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { CatalogSearch } from '@/components/organizer/CatalogSearch';
import { EventForm } from '@/components/organizer/EventForm';
import { OrganizerEventsList } from '@/components/organizer/OrganizerEventsList';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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

const TABS = [
  { id: 'buscar', label: 'Buscar no catálogo' },
  { id: 'meus-eventos', label: 'Meus eventos' },
] as const;

type Tab = (typeof TABS)[number]['id'];

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
  const [cancelTarget, setCancelTarget] = useState<EventItem | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  async function handleCancelEvent() {
    if (!cancelTarget) return;
    setCancelingId(cancelTarget.id);
    setCancelError(null);
    try {
      await apiFetch(`/eventos/${cancelTarget.id}`, {
        method: 'DELETE',
        token: token!,
      });
      setCancelTarget(null);
      loadEvents();
    } catch (err) {
      setCancelError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível cancelar o evento.',
      );
      setCancelTarget(null);
    } finally {
      setCancelingId(null);
    }
  }

  const showingForm = pendingCreate !== null || editingEvent !== null;

  return (
    <AppShell>
      <PageHeader
        label="Painel do organizador"
        title={`Olá, ${user?.name ?? ''}`}
        meta="Publique sessões de cinema e shows a partir dos catálogos externos, e acompanhe o que já está no ar."
      />

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
          <div className="border-border flex gap-1 border-b">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={tab === item.id}
                className={`label-print hover:text-foreground -mb-px border-b-2 px-3 py-2.5 transition-colors ${
                  tab === item.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {cancelError && <Alert>{cancelError}</Alert>}

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
              onCancelEvent={setCancelTarget}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancelar este evento?"
        description={`"${cancelTarget?.title ?? ''}" sai do catálogo, e todas as reservas e ingressos dele são cancelados com reembolso. Não dá para desfazer.`}
        confirmLabel="Cancelar evento"
        pending={cancelingId !== null}
        onConfirm={() => void handleCancelEvent()}
      />
    </AppShell>
  );
}
