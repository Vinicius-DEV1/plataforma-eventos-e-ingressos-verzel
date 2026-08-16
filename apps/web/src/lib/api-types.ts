// Mirrors the shapes returned by apps/api (catalog.types.ts and the events
// controller). Kept minimal: only the fields the UI actually renders or
// sends.
export type CatalogItem = {
  externalId: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string | null;
};

export type EventType = 'CINEMA' | 'SHOW';
export type EventStatus = 'PUBLISHED' | 'CANCELLED';
export type ExternalSource = 'TMDB' | 'TICKETMASTER';

export type EventItem = {
  id: string;
  title: string;
  description: string;
  type: EventType;
  category: string;
  venue: string;
  startsAt: string;
  basePrice: number;
  totalCapacity: number;
  availableTickets: number;
  imageUrl: string;
  externalSource: ExternalSource;
  externalId: string;
  organizerId: string;
  status: EventStatus;
  createdAt: string;
};

export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export type Seat = {
  id: string;
  eventId: string;
  row: string;
  number: number;
  status: SeatStatus;
};

export type EventDetail = EventItem & { seats?: Seat[] };

export type ReservationStatus =
  'PENDING' | 'PAID' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';

export type ReservationItem = {
  id: string;
  eventId: string;
  customerId: string;
  seatId: string | null;
  quantity: number | null;
  status: ReservationStatus;
  totalAmount: number;
  expiresAt: string;
  createdAt: string;
};

export type PaymentMethod = 'PIX' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

export type PixInfo = {
  encodedImage: string;
  payload: string;
  expirationDate: string;
};

export type CreditCard = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

export type PaymentItem = {
  id: string;
  reservationId: string;
  asaasPaymentId: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
  invoiceUrl?: string | null;
  pix?: PixInfo;
};

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';

export type TicketEventSummary = {
  id: string;
  title: string;
  venue: string;
  startsAt: string;
  imageUrl: string;
};

export type TicketItem = {
  id: string;
  status: TicketStatus;
  validatedAt: string | null;
  createdAt: string;
  shareToken: string;
  reservation: { id: string; totalAmount: number };
  event: TicketEventSummary;
};

export type TicketDetail = TicketItem & { qrImage: string };

export type GateValidationResult =
  'valid' | 'invalid' | 'already_used' | 'wrong_event';
