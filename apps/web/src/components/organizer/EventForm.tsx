import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  CatalogItem,
  EventItem,
  EventType,
  ExternalSource,
} from '@/lib/api-types';

const inputClass =
  'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3';

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time, with no timezone
// suffix — different shape than the ISO string the API sends/expects.
function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type CreateSource = {
  mode: 'create';
  catalogItem: CatalogItem;
  eventType: EventType;
  externalSource: ExternalSource;
};

type EditSource = {
  mode: 'edit';
  event: EventItem;
};

type EventFormProps = (CreateSource | EditSource) & {
  onCancel: () => void;
  onSaved: (event: EventItem) => void;
};

export function EventForm(props: EventFormProps) {
  const { token } = useAuth();
  const { onCancel, onSaved } = props;

  const initial =
    props.mode === 'create'
      ? {
          title: props.catalogItem.title,
          description: props.catalogItem.description,
          imageUrl: props.catalogItem.imageUrl,
          category: '',
          venue: '',
          startsAt: props.catalogItem.date
            ? `${props.catalogItem.date}T20:00`
            : '',
          basePrice: '',
          totalCapacity: '',
        }
      : {
          title: props.event.title,
          description: props.event.description,
          imageUrl: props.event.imageUrl,
          category: props.event.category,
          venue: props.event.venue,
          startsAt: toDatetimeLocalValue(props.event.startsAt),
          basePrice: String(props.event.basePrice),
          totalCapacity: String(props.event.totalCapacity),
        };

  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventType =
    props.mode === 'create' ? props.eventType : props.event.type;

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let saved: EventItem;
      if (props.mode === 'create') {
        saved = await apiFetch<EventItem>('/eventos', {
          method: 'POST',
          token: token!,
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            imageUrl: form.imageUrl,
            type: eventType,
            category: form.category,
            venue: form.venue,
            startsAt: new Date(form.startsAt).toISOString(),
            basePrice: Number(form.basePrice),
            externalSource: props.externalSource,
            externalId: props.catalogItem.externalId,
            ...(eventType === 'SHOW'
              ? { totalCapacity: Number(form.totalCapacity) }
              : {}),
          }),
        });
      } else {
        saved = await apiFetch<EventItem>(`/eventos/${props.event.id}`, {
          method: 'PUT',
          token: token!,
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            imageUrl: form.imageUrl,
            category: form.category,
            venue: form.venue,
            startsAt: new Date(form.startsAt).toISOString(),
            basePrice: Number(form.basePrice),
          }),
        });
      }
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível salvar o evento.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="bg-card border-border space-y-4 border p-6"
    >
      <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
        {props.mode === 'create'
          ? `Novo evento — ${eventType}`
          : 'Editar evento'}
      </p>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Título
        </label>
        <input
          id="title"
          required
          value={form.title}
          onChange={(event) => update('title', event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="description"
          required
          rows={3}
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="imageUrl" className="text-sm font-medium">
          URL da imagem
        </label>
        <input
          id="imageUrl"
          required
          value={form.imageUrl}
          onChange={(event) => update('imageUrl', event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium">
            Categoria
          </label>
          <input
            id="category"
            required
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="venue" className="text-sm font-medium">
            Local
          </label>
          <input
            id="venue"
            required
            value={form.venue}
            onChange={(event) => update('venue', event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="startsAt" className="text-sm font-medium">
            Data e hora
          </label>
          <input
            id="startsAt"
            type="datetime-local"
            required
            value={form.startsAt}
            onChange={(event) => update('startsAt', event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="basePrice" className="text-sm font-medium">
            Preço (R$)
          </label>
          <input
            id="basePrice"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.basePrice}
            onChange={(event) => update('basePrice', event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {eventType === 'SHOW' && props.mode === 'create' && (
        <div className="space-y-1.5">
          <label htmlFor="totalCapacity" className="text-sm font-medium">
            Capacidade da pista
          </label>
          <input
            id="totalCapacity"
            type="number"
            min="1"
            step="1"
            required
            value={form.totalCapacity}
            onChange={(event) => update('totalCapacity', event.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {eventType === 'CINEMA' && props.mode === 'create' && (
        <p className="text-muted-foreground text-xs">
          Eventos CINEMA usam a sala fixa de 8×12 (96 assentos), gerada
          automaticamente.
        </p>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
