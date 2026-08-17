import { useState, type ReactNode } from 'react';
import { Check, Share2, QrCode } from 'lucide-react';
import { TICKET_STATUS } from '@/components/tickets/ticket-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataItem, DataList } from '@/components/ui/data-list';
import type { TicketDetail } from '@/lib/api-types';
import { formatFullDateTime, formatPrice, ticketSerial } from '@/lib/format';

export function TicketDetailView({
  ticket,
  canShare,
  children,
}: {
  ticket: TicketDetail;
  canShare: boolean;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const status = TICKET_STATUS[ticket.status];

  async function handleShare() {
    const url = `${window.location.origin}/ingressos/compartilhar/${ticket.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Card className="overflow-hidden">
        {/* Cabeçalho Técnico de Emissão */}
        <div className="bg-foreground text-background px-6 py-3.5 flex items-center justify-between gap-4 font-mono text-xs">
          <span className="font-bold tracking-widest uppercase">
            [ INGRESSO DIGITAL ]
          </span>
          <span data-numeric className="font-bold tracking-wider opacity-90">
            Nº {ticketSerial(ticket.id)}
          </span>
        </div>

        <div className="space-y-6 p-6 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance">
            {ticket.event.title}
          </h1>

          <DataList>
            <DataItem label="Local">{ticket.event.venue}</DataItem>
            <DataItem label="Data & Horário">
              {formatFullDateTime(ticket.event.startsAt)}
            </DataItem>
            <DataItem label="Valor Total">
              <span
                data-numeric
                className="font-bold font-mono text-foreground"
              >
                {formatPrice(ticket.reservation.totalAmount)}
              </span>
            </DataItem>
            <DataItem label="Status">
              <Badge tone={status.tone}>{status.label}</Badge>
            </DataItem>
          </DataList>

          {ticket.status === 'USED' && ticket.validatedAt && (
            <div className="rounded border border-border bg-secondary p-3 font-mono text-xs text-muted-foreground">
              Validado na portaria em {formatFullDateTime(ticket.validatedAt)}.
            </div>
          )}
        </div>

        <div className="ticket-perforation" />

        <div className="bg-secondary/40 flex flex-col items-center gap-4 p-7">
          <div className="rounded-lg bg-white p-3 shadow-xs border border-border">
            <img
              src={ticket.qrImage}
              alt="QR Code do ingresso"
              className={`size-48 sm:size-52 ${
                ticket.status === 'VALID' ? '' : 'opacity-30 grayscale'
              }`}
            />
          </div>
          {ticket.status === 'VALID' ? (
            <div className="flex items-center gap-1.5 font-mono text-xs text-foreground font-bold">
              <QrCode className="size-3.5 text-primary" />
              <span>Apresente este código na entrada para leitura.</span>
            </div>
          ) : (
            <p className="font-mono text-muted-foreground text-center text-xs">
              Este código não é mais válido.
            </p>
          )}
        </div>
      </Card>

      {(canShare || children) && (
        <div className="flex flex-wrap gap-3">
          {canShare && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => void handleShare()}
              className="gap-2"
            >
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Share2 className="size-4" aria-hidden />
              )}
              {copied ? 'Link copiado' : 'Compartilhar ingresso'}
            </Button>
          )}
          {children}
        </div>
      )}
    </>
  );
}
