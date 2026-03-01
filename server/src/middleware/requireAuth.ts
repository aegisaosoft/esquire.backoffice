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
import type { Request, Response, NextFunction } from 'express';
import * as oidcClient from 'openid-client';
import { getOidcConfig } from '../auth/keycloak.js';

/**
 * Try to refresh the access token using the stored refresh token.
 * Updates the session in-place on success.
 * Returns true if refresh succeeded, false otherwise.
 */
async function tryRefreshToken(req: Request): Promise<boolean> {
  const refreshToken = req.session?.tokens?.refresh_token;
  if (!refreshToken) return false;

  try {
    const oidc = getOidcConfig();
    const tokenSet = await oidcClient.refreshTokenGrant(oidc, refreshToken);

    req.session.tokens = {
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token || refreshToken,
      id_token: tokenSet.id_token || req.session.tokens?.id_token,
      expires_at: tokenSet.expires_at as number | undefined,
    };
    return true;
  } catch (err: any) {
    console.warn('[requireAuth] Token refresh failed:', err.message);
    return false;
  }
}

/**
 * Middleware that ensures user is authenticated.
 * If the access token is expired, attempts a silent refresh before rejecting.
 * Returns 401 if no valid session tokens exist or refresh fails.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session?.tokens?.access_token) {
    res.status(401).json({ error: 'Not authenticated', loginUrl: '/auth/login' });
    return;
  }

  // Check if token is expired → try refresh first
  const expiresAt = req.session.tokens.expires_at;
  if (expiresAt && Date.now() > expiresAt * 1000) {
    const refreshed = await tryRefreshToken(req);
    if (!refreshed) {
      res.status(401).json({ error: 'Token expired', loginUrl: '/auth/login' });
      return;
    }
  }

  next();
}
