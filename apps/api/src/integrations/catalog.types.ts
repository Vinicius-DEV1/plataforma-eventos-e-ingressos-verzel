// Normalized shape both external catalogs get mapped to, so the controller
// and (eventually) the event-creation flow don't need to know whether an
// item came from TMDb or Ticketmaster.
export type CatalogItem = {
  externalId: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string | null;
};
