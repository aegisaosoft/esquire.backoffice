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
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  sessionSecret: process.env.SESSION_SECRET || 'esquire-bff-secret-change-me',

  // Keycloak OIDC
  keycloak: {
    issuer: process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/esquire',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'esq-angular',
    callbackUrl: process.env.KEYCLOAK_CALLBACK_URL || 'http://localhost:3000/auth/callback',
    postLogoutRedirect: process.env.POST_LOGOUT_REDIRECT || 'http://localhost:5173',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  // Spring Gateway backend
  gateway: {
    url: process.env.GATEWAY_URL || 'http://localhost:7070',
  },

  // CORS (for dev mode when Vite runs on different port)
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  isProd: process.env.NODE_ENV === 'production',
};
