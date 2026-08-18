// Formatação de exibição num lugar só: antes cada tela criava o seu próprio
// Intl.NumberFormat e Intl.DateTimeFormat, com estilos que já divergiam.
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const fullDateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
  timeStyle: 'short',
});

const price = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatFullDateTime(iso: string): string {
  return fullDateTime.format(new Date(iso));
}

export function formatPrice(amount: number): string {
  return price.format(amount);
}

const TYPE_LABEL = { CINEMA: 'Cinema', SHOW: 'Show' } as const;

// "Cinema · Ação", ou só "Cinema" quando o evento não tem categoria (nunca
// teve, ou a categoria foi apagada) — repetido em cartão, detalhe e lista do
// organizador, então fica num lugar só.
export function eventTypeCategoryLabel(event: {
  type: keyof typeof TYPE_LABEL;
  category: { name: string } | null;
}): string {
  const type = TYPE_LABEL[event.type];
  return event.category ? `${type} · ${event.category.name}` : type;
}

// availableTickets só é significativo para SHOW; em CINEMA a contagem que
// importa é a de assentos livres (availableSeats), calculada pela API a
// partir das seats — ver comentário do schema (SPEC §1.2).
export function isEventSoldOut(event: {
  type: 'CINEMA' | 'SHOW';
  availableTickets: number;
  availableSeats?: number;
}): boolean {
  return event.type === 'CINEMA'
    ? (event.availableSeats ?? 0) <= 0
    : event.availableTickets <= 0;
}

// Numeração de série do ingresso, no formato de um bilhete impresso. O id é
// longo demais para ler em voz alta na portaria; os últimos oito caracteres
// já distinguem os ingressos de um mesmo evento.
export function ticketSerial(id: string): string {
  const tail = id.slice(-8).toUpperCase();
  return `${tail.slice(0, 4)}-${tail.slice(4)}`;
}
