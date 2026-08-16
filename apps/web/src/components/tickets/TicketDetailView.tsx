import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TicketDetail } from '@/lib/api-types';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
  timeStyle: 'short',
});

const statusLabel: Record<TicketDetail['status'], string> = {
  VALID: 'Válido',
  USED: 'Utilizado',
  CANCELLED: 'Cancelado',
};

export function TicketDetailView({
  ticket,
  canShare,
}: {
  ticket: TicketDetail;
  canShare: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/ingressos/compartilhar/${ticket.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
          Ingresso
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {ticket.event.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {ticket.event.venue} ·{' '}
          {dateFormatter.format(new Date(ticket.event.startsAt))}
        </p>
      </div>

      <div className="border-border bg-card flex flex-col items-center gap-4 border p-6">
        <img
          src={ticket.qrImage}
          alt="QR Code do ingresso"
          className="size-56"
        />
        <span className="text-muted-foreground text-xs font-medium tracking-[0.15em] uppercase">
          {statusLabel[ticket.status]}
        </span>
      </div>

      {ticket.status === 'USED' && ticket.validatedAt && (
        <p className="text-muted-foreground text-sm">
          Validado em {dateFormatter.format(new Date(ticket.validatedAt))}
        </p>
      )}

      {canShare && (
        <Button variant="outline" onClick={() => void handleShare()}>
          {copied ? 'Link copiado!' : 'Compartilhar link'}
        </Button>
      )}
    </main>
  );
}
