/**
 * Esquire Backoffice
 * Copyright (C) 2026 AegisAOSoft
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
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
