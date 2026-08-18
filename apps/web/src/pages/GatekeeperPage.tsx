import { useEffect, useState } from 'react';
import { ArrowLeft, Camera, Keyboard } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { QrScanner } from '@/components/gatekeeper/QrScanner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { EventItem, GateValidationResult } from '@/lib/api-types';
import { eventTypeCategoryLabel, formatDateTime } from '@/lib/format';

// Precisa ser legível num relance, com fila esperando — não lido com
// atenção (issue do Bloco 7). Daí o veredito em corpo grande, a instrução
// em uma linha e a cor vindo dos tokens de estado, não de um verde solto.
const RESULT: Record<
  GateValidationResult,
  { verdict: string; instruction: string; className: string }
> = {
  valid: {
    verdict: 'Pode entrar',
    instruction: 'Ingresso válido, agora marcado como utilizado.',
    className: 'border-success/50 bg-success/10 text-success',
  },
  already_used: {
    verdict: 'Já utilizado',
    instruction: 'Este ingresso já passou pela portaria antes.',
    className: 'border-warning/50 bg-warning/10 text-warning',
  },
  wrong_event: {
    verdict: 'Outro evento',
    instruction: 'O ingresso é válido, mas não para esta sessão.',
    className: 'border-destructive/50 bg-destructive/10 text-destructive',
  },
  invalid: {
    verdict: 'Não vale',
    instruction: 'Código inválido, adulterado ou cancelado.',
    className: 'border-destructive/50 bg-destructive/10 text-destructive',
  },
};

// A leitura tem 3 estados: escolher como ler ("choice"), câmera aberta
// ("camera") ou campo de digitação aberto ("manual") — só um pedido de
// permissão de câmera acontece, e só depois do clique em "Escanear QR
// Code" (DECISIONS.md/AI_USAGE.md registram por quê).
type ReadMode = 'choice' | 'camera' | 'manual';

export default function GatekeeperPage() {
  const { token } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const [readMode, setReadMode] = useState<ReadMode>('choice');
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
    } finally {
      setValidating(false);
    }
  }

  function handleNext() {
    setResult(null);
    setError(null);
    setManualCode('');
    setReadMode('choice');
  }

  if (!selectedEvent) {
    return (
      <AppShell>
        <PageHeader
          label="Portaria"
          title="Qual sessão você vai fiscalizar?"
          meta="A escolha define contra qual evento cada QR Code é conferido."
        />

        {loadError && <Alert>{loadError}</Alert>}

        {loadingEvents && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        )}

        {!loadingEvents && !loadError && events.length === 0 && (
          <div className="border-border text-muted-foreground border border-dashed px-6 py-16 text-center text-sm">
            Nenhum evento publicado no momento.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEvent(event)}
              className="border-border bg-card hover:border-primary focus-visible:ring-ring/40 ease-sharp space-y-1 border p-4 text-left transition-[transform,border-color] duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-3"
            >
              <p className="label-print">{eventTypeCategoryLabel(event)}</p>
              <p className="display-print text-lg">{event.title}</p>
              <p className="text-muted-foreground text-sm">
                {event.venue} · {formatDateTime(event.startsAt)}
              </p>
            </button>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell width="narrow">
      <button
        type="button"
        onClick={() => setSelectedEvent(null)}
        className="label-print hover:text-foreground focus-visible:ring-ring/40 -mx-1 inline-flex w-fit items-center gap-1.5 rounded-sm px-1 py-0.5 transition-colors outline-none focus-visible:ring-3"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Trocar sessão
      </button>

      <PageHeader size="md" label="Fiscalizando" title={selectedEvent.title} />

      {error && <Alert>{error}</Alert>}

      {!result && readMode === 'choice' && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => setReadMode('camera')}
          >
            <Camera className="size-5" aria-hidden />
            Escanear
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-2 py-6"
            onClick={() => setReadMode('manual')}
          >
            <Keyboard className="size-5" aria-hidden />
            Digitar
          </Button>
        </div>
      )}

      {!result && readMode === 'camera' && !validating && (
        <Card className="space-y-4 p-4">
          <QrScanner onScan={(code) => void handleValidate(code)} />
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setReadMode('choice')}
          >
            Cancelar leitura
          </Button>
        </Card>
      )}

      {!result && readMode === 'manual' && (
        <Card asChild>
          <form
            className="space-y-4 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleValidate(manualCode);
            }}
          >
            <Field label="Código do ingresso" htmlFor="manual-code">
              <Input
                id="manual-code"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="lg"
                disabled={validating || !manualCode.trim()}
              >
                {validating ? 'Conferindo…' : 'Validar'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => setReadMode('choice')}
              >
                Voltar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {result && (
        <div
          className={`animate-fade-in space-y-2 border p-8 text-center ${RESULT[result].className}`}
        >
          <p className="display-print text-3xl sm:text-4xl">
            {RESULT[result].verdict}
          </p>
          <p className="text-foreground/80 text-sm">
            {RESULT[result].instruction}
          </p>
        </div>
      )}

      {result && (
        <Button size="lg" className="w-full" onClick={handleNext}>
          Próxima leitura
        </Button>
      )}
    </AppShell>
  );
}
