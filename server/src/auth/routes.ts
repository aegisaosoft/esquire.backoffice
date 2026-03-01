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
import { Router } from 'express';
import * as client from 'openid-client';
import { getOidcConfig } from './keycloak.js';
import { config } from '../config.js';

const router = Router();

/**
 * GET /auth/login
 * Redirect user to Keycloak authorization endpoint (PKCE flow).
 */
router.get('/login', async (req, res) => {
  const oidc = getOidcConfig();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

  // Store code verifier in session for callback
  req.session.codeVerifier = codeVerifier;
  req.session.returnTo = (req.query.returnTo as string) || '/';

  // Build authorization URL
  const redirectTo = client.buildAuthorizationUrl(oidc, {
    redirect_uri: config.keycloak.callbackUrl,
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(redirectTo.href);
});

/**
 * GET /auth/callback
 * Exchange authorization code for tokens and store in session.
 */
router.get('/callback', async (req, res) => {
  try {
    const oidc = getOidcConfig();
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier) {
      res.status(400).json({ error: 'Missing code verifier in session' });
      return;
    }

    // Exchange code for tokens
    const currentUrl = new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`);
    const tokenSet = await client.authorizationCodeGrant(oidc, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState: undefined, // state not used in this flow
    });

    // Store tokens in session (never sent to browser)
    req.session.tokens = {
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token,
      id_token: tokenSet.id_token,
      expires_at: tokenSet.expires_at as number | undefined,
    };

    // Decode access token claims for user info
    const claims = tokenSet.claims();
    if (claims) {
      req.session.userInfo = {
        sub: claims.sub as string,
        preferred_username: (claims as any).preferred_username || '',
        name: (claims as any).name || '',
        email: (claims as any).email || '',
        esq_uid: (claims as any).esq_uid || '',
        esq_rootpath: (claims as any).esq_rootpath || '',
        realm_access: (claims as any).realm_access,
      };
    }

    // Cleanup
    delete req.session.codeVerifier;
    const returnTo = req.session.returnTo || '/';
    delete req.session.returnTo;

    // Redirect to frontend
    const frontendUrl = config.keycloak.frontendUrl;
    res.redirect(`${frontendUrl}${returnTo}`);
  } catch (err: any) {
    console.error('[auth/callback] Token exchange failed:', err.message);
    res.status(500).json({ error: 'Authentication failed', detail: err.message });
  }
});

/**
 * GET /auth/me
 * Return current user info from session. No tokens exposed.
 * Checks token expiry and attempts refresh — consistent with requireAuth.
 */
router.get('/me', async (req, res) => {
  if (!req.session?.tokens?.access_token) {
    res.json({ authenticated: false });
    return;
  }

  // Check if token is expired → attempt refresh
  const expiresAt = req.session.tokens.expires_at;
  if (expiresAt && Date.now() > expiresAt * 1000) {
    const refreshToken = req.session.tokens.refresh_token;
    if (refreshToken) {
      try {
        const oidc = getOidcConfig();
        const tokenSet = await client.refreshTokenGrant(oidc, refreshToken);
        req.session.tokens = {
          access_token: tokenSet.access_token,
          refresh_token: tokenSet.refresh_token || refreshToken,
          id_token: tokenSet.id_token || req.session.tokens?.id_token,
          expires_at: tokenSet.expires_at as number | undefined,
        };
      } catch {
        // Refresh failed — session is no longer valid
        res.json({ authenticated: false });
        return;
      }
    } else {
      res.json({ authenticated: false });
      return;
    }
  }

  res.json({
    authenticated: true,
    user: req.session.userInfo,
  });
});

/**
 * POST /auth/logout
 * Revoke tokens and destroy session.
 */
router.post('/logout', async (req, res) => {
  try {
    const oidc = getOidcConfig();
    const idToken = req.session?.tokens?.id_token;

    // Destroy session first
    req.session.destroy(() => {});

    if (idToken) {
      // Build Keycloak end-session URL.
      // Do NOT include post_logout_redirect_uri — it must be registered in Keycloak
      // client settings. In dev mode (localhost:5173) it's usually not, causing a 400.
      // Keycloak will show its own "Logged out" page instead.
      const endSessionUrl = client.buildEndSessionUrl(oidc, {
        id_token_hint: idToken,
      });
      res.json({ logoutUrl: endSessionUrl.href });
    } else {
      res.json({ logoutUrl: config.keycloak.postLogoutRedirect });
    }
  } catch (err: any) {
    console.error('[auth/logout] Error:', err.message);
    res.json({ logoutUrl: config.keycloak.postLogoutRedirect });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using stored refresh token.
 */
router.post('/refresh', async (req, res) => {
  try {
    const oidc = getOidcConfig();
    const refreshToken = req.session?.tokens?.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const tokenSet = await client.refreshTokenGrant(oidc, refreshToken);

    req.session.tokens = {
      access_token: tokenSet.access_token,
      refresh_token: tokenSet.refresh_token || refreshToken,
      id_token: tokenSet.id_token || req.session.tokens?.id_token,
      expires_at: tokenSet.expires_at as number | undefined,
    };

    res.json({ success: true });
  } catch (err: any) {
    console.error('[auth/refresh] Token refresh failed:', err.message);
    res.status(401).json({ error: 'Refresh failed', loginUrl: '/auth/login' });
  }
});

export { router as authRoutes };
