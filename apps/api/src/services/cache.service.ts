type CacheEntry<T> = { value: T; expiresAt: number };

// Small in-memory TTL cache, generic enough for anything that just needs
// "don't re-fetch this for N minutes" — used by the catalog clients to stay
// under TMDb/Ticketmaster's rate limits (SPEC.md §5.8).
export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
