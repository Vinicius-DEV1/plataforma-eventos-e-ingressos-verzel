import { useEffect, useState } from 'react';
import { QrScanner } from '@/components/gatekeeper/QrScanner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EventItem, GateValidationResult } from '@/lib/api-types';

const inputClass =
  'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3';

// Precisa ser legível num relance, com fila esperando — não lido com
// atenção (issue do Bloco 7).
const resultConfig: Record<
  GateValidationResult,
  { label: string; className: string }
> = {
  valid: {
    label: 'Ingresso válido',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600',
  },
  already_used: {
    label: 'Ingresso já utilizado',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
  wrong_event: {
    label: 'Ingresso de outro evento',
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
  invalid: {
    label: 'Ingresso inválido',
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
};

export default function GatekeeperPage() {
  const { token } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const [scanning, setScanning] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<GateValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoadingEvents(true);
      setLoadError(null);
      try {
        const data = await apiFetch<{ items: EventItem[] }>('/eventos');
        setEvents(data.items);
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível carregar os eventos.',
        );
      } finally {
        setLoadingEvents(false);
      }
    }
    void load();
  }, []);

  async function handleValidate(code: string) {
    const trimmed = code.trim();
    if (!trimmed || !selectedEvent || validating) return;

    setScanning(false);
    setValidating(true);
    setError(null);
    try {
      const data = await apiFetch<{ result: GateValidationResult }>(
        '/portaria/validar',
        {
          method: 'POST',
          token: token!,
          body: JSON.stringify({ code: trimmed, eventId: selectedEvent.id }),
        },
      );
      setResult(data.result);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível validar o ingresso.',
      );
      setScanning(true);
    } finally {
      setValidating(false);
    }
  }

  function handleNext() {
    setResult(null);
    setError(null);
    setManualCode('');
    setScanning(true);
  }

  if (!selectedEvent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
            Portaria
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Qual evento você vai fiscalizar?
          </h1>
        </div>

        {loadingEvents && (
          <p className="text-muted-foreground text-sm">Carregando…</p>
        )}
        {loadError && <p className="text-destructive text-sm">{loadError}</p>}
        {!loadingEvents && !loadError && events.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nenhum evento publicado.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEvent(event)}
              className="border-border bg-card hover:border-ring border p-4 text-left transition-colors"
            >
              <p className="font-medium">{event.title}</p>
              <p className="text-muted-foreground text-sm">{event.venue}</p>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Fiscalizando
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {selectedEvent.title}
        </h1>
        <button
          type="button"
          className="text-muted-foreground text-xs underline"
          onClick={() => setSelectedEvent(null)}
        >
          Trocar evento
        </button>
      </div>

      {!result && (
        <>
          <QrScanner
            active={scanning}
            onScan={(code) => void handleValidate(code)}
          />

          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="Ou digite o código manualmente"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button
              disabled={validating || !manualCode.trim()}
              onClick={() => void handleValidate(manualCode)}
            >
              Validar
            </Button>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </>
      )}

      {result && (
        <div
          className={`space-y-4 border p-8 text-center ${resultConfig[result].className}`}
        >
          <p className="text-xl font-bold">{resultConfig[result].label}</p>
          <Button variant="outline" onClick={handleNext}>
            Escanear próximo
          </Button>
        </div>
      )}
    </main>
  );
}
