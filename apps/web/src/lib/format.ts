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

// Numeração de série do ingresso, no formato de um bilhete impresso. O id é
// longo demais para ler em voz alta na portaria; os últimos oito caracteres
// já distinguem os ingressos de um mesmo evento.
export function ticketSerial(id: string): string {
  const tail = id.slice(-8).toUpperCase();
  return `${tail.slice(0, 4)}-${tail.slice(4)}`;
}
