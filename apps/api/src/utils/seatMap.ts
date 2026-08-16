// Fixed room layout for CINEMA events: 8 rows (A–H) x 12 seats, 96 total
// (PRD.md §5). Shared by event creation and the seed script so the room
// shape has a single source.
export const ROOM_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const SEATS_PER_ROW = 12;
export const ROOM_CAPACITY = ROOM_ROWS.length * SEATS_PER_ROW;

export function buildSeatMap(eventId: string) {
  return ROOM_ROWS.flatMap((row) =>
    Array.from({ length: SEATS_PER_ROW }, (_, index) => ({
      eventId,
      row,
      number: index + 1,
    })),
  );
}
