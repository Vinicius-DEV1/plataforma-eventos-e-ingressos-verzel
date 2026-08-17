import { useState, type FormEvent } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type {
  CatalogItem,
  EventItem,
  EventType,
  ExternalSource,
} from '@/lib/api-types';

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
    <Card asChild>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="space-y-5 p-6"
      >
        <p className="label-print">
          {props.mode === 'create'
            ? `Novo evento · ${eventType === 'CINEMA' ? 'Cinema' : 'Show'}`
            : 'Editar evento'}
        </p>

        <Field label="Título" htmlFor="title">
          <Input
            id="title"
            required
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
          />
        </Field>

        <Field label="Descrição" htmlFor="description">
          <Textarea
            id="description"
            required
            rows={3}
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
          />
        </Field>

        <Field label="URL da imagem" htmlFor="imageUrl">
          <Input
            id="imageUrl"
            required
            value={form.imageUrl}
            onChange={(event) => update('imageUrl', event.target.value)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Categoria" htmlFor="category">
            <Input
              id="category"
              required
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
            />
          </Field>
          <Field label="Local" htmlFor="venue">
            <Input
              id="venue"
              required
              value={form.venue}
              onChange={(event) => update('venue', event.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Data e hora" htmlFor="startsAt">
            <Input
              id="startsAt"
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(event) => update('startsAt', event.target.value)}
            />
          </Field>
          <Field label="Preço (R$)" htmlFor="basePrice">
            <Input
              id="basePrice"
              type="number"
              min="0.01"
              step="0.01"
              required
              data-numeric
              value={form.basePrice}
              onChange={(event) => update('basePrice', event.target.value)}
            />
          </Field>
        </div>

        {eventType === 'SHOW' && props.mode === 'create' && (
          <Field label="Capacidade da pista" htmlFor="totalCapacity">
            <Input
              id="totalCapacity"
              type="number"
              min="1"
              step="1"
              required
              data-numeric
              value={form.totalCapacity}
              onChange={(event) => update('totalCapacity', event.target.value)}
            />
          </Field>
        )}

        {eventType === 'CINEMA' && props.mode === 'create' && (
          <p className="text-muted-foreground border-border border border-dashed p-3 text-xs">
            Sessão de cinema usa a sala fixa de 8×12 (96 assentos), gerada
            automaticamente com o evento.
          </p>
        )}

        {error && <Alert>{error}</Alert>}

        <div className="border-border flex gap-3 border-t border-dashed pt-5">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Salvar evento'}
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={onCancel}>
            Descartar
          </Button>
        </div>
      </form>
    </Card>
  );
}
