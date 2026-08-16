// Thrown by any catalog client when the upstream API answers 429, so the
// controller can turn it into a clear response instead of a generic 500.
export class UpstreamRateLimitError extends Error {}
