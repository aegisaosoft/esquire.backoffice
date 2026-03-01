/**
 * Client-side tracing utilities.
 * Generates correlation IDs for tracking requests through the system.
 */

/** Generate a UUID v4 */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Get or create a correlation ID for the current page session.
 * Persists in sessionStorage so all requests within the same tab share it.
 */
export function getCorrelationId(): string {
  const KEY = 'esq-correlation-id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}
