import type { TicketStatus } from '@/lib/api-types';

type Tone = 'neutral' | 'success' | 'danger';

// Estado do ingresso num lugar só: rótulo e tom andam juntos, para nenhuma
// tela inventar a própria cor nem o próprio texto.
export const TICKET_STATUS: Record<
  TicketStatus,
  { label: string; tone: Tone }
> = {
  VALID: { label: 'Válido', tone: 'success' },
  USED: { label: 'Utilizado', tone: 'neutral' },
  CANCELLED: { label: 'Cancelado', tone: 'danger' },
};
