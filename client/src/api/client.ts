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
 * HTTP client wrapper for BFF API calls.
 * All requests go to /api/* which the BFF proxies to Spring Gateway.
 */

class ApiError extends Error {
  status: number;
  detail: string;
  instance?: string;

  constructor(status: number, title: string, detail: string, instance?: string) {
    super(title);
    this.status = status;
    this.detail = detail;
    this.instance = instance;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Signal auth expiry — App.tsx listens and handles the redirect centrally.
    // Do NOT set window.location.href here: multiple hooks fire simultaneously,
    // each triggering handleResponse → concurrent redirects → loop.
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(401, 'Not authenticated', 'Session expired');
  }

  if (!response.ok) {
    let body: any;
    try {
      body = await response.json();
    } catch {
      body = { title: response.statusText, detail: 'Unknown error' };
    }
    throw new ApiError(
      response.status,
      body.title || response.statusText,
      body.detail || body.message || 'Request failed',
      body.instance,
    );
  }

  return response.json();
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ── API Methods (matching EsqRestApi interface from Angular) ──

export const api = {
  /** GET /esq — tree nodes */
  esquire(id?: string, skip?: number, take?: number) {
    const q = buildQuery({ id, skip, take });
    return fetch(`/api/esq${q}`, { credentials: 'include' }).then(r => handleResponse<any[]>(r));
  },

  /** GET /esq-path?id={id} — node path */
  esquirePath(id: string) {
    const q = buildQuery({ id });
    return fetch(`/api/esq-path${q}`, { credentials: 'include' }).then(r => handleResponse<any>(r));
  },

  /** GET /esq-cmd — entity command */
  esquireCmd(kind: number, id: string, cmd?: string) {
    const q = buildQuery({ kind, id, cmd });
    return fetch(`/api/esq-cmd${q}`, { credentials: 'include' }).then(r => handleResponse<any>(r));
  },

  /** GET /esq-enode — entity node */
  esquireEntityNode(kind: number, id?: string, name?: string) {
    const q = buildQuery({ kind, id, name });
    return fetch(`/api/esq-enode${q}`, { credentials: 'include' }).then(r => handleResponse<any>(r));
  },

  /** GET /esq-dict?kind={kind} — entity dictionary */
  esquireDictionary(kind: number) {
    const q = buildQuery({ kind });
    return fetch(`/api/esq-dict${q}`, { credentials: 'include' }).then(r => handleResponse<any>(r));
  },

  /** GET /esq-key — access profile */
  esquireKey(id?: string) {
    const q = buildQuery({ id });
    return fetch(`/api/esq-key${q}`, { credentials: 'include' }).then(r => handleResponse<any>(r));
  },

  /** GET /esq-kinds — all entity kinds */
  esquireKinds() {
    return fetch('/api/esq-kinds', { credentials: 'include' }).then(r => handleResponse<any[]>(r));
  },

  /** POST /esq-cmd-save — save entity */
  esquireCmdSave(kind: number, id: string, body: any, cmd?: string) {
    const q = buildQuery({ kind, id, cmd });
    return fetch(`/api/esq-cmd-save${q}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => handleResponse<any>(r));
  },

  /** POST /esq-cmd-asave — save account entity */
  esquireCmdAsave(kind: number, id: string, body: any) {
    const q = buildQuery({ kind, id });
    return fetch(`/api/esq-cmd-asave${q}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => handleResponse<any>(r));
  },

  /** PUT /esq-key-save — save access profile */
  esquireKeySave(id: string, body: any) {
    return fetch(`/api/esq-key-save?id=${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => handleResponse<any>(r));
  },

  /** GET /auth/me — current user */
  async authMe() {
    const r = await fetch('/auth/me', { credentials: 'include' });
    if (!r.ok) return { authenticated: false };
    return r.json();
  },

  /** POST /auth/logout */
  async authLogout() {
    const res = await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (data.logoutUrl) window.location.href = data.logoutUrl;
  },
};
