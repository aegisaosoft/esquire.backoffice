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
import session from 'express-session';
import MemoryStore from 'memorystore';
import { config } from '../config.js';

const MemStore = MemoryStore(session);

export const sessionMiddleware = session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: new MemStore({ checkPeriod: 86400000 }), // prune expired entries every 24h
  cookie: {
    httpOnly: true,
    secure: config.isProd,       // HTTPS only in production
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000,     // 30 minutes
  },
});

// Extend express-session types for our token storage
declare module 'express-session' {
  interface SessionData {
    tokens?: {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
      expires_at?: number;
    };
    userInfo?: {
      sub: string;
      preferred_username: string;
      name: string;
      email: string;
      esq_uid: string;
      esq_rootpath: string;
      realm_access?: { roles: string[] };
    };
    codeVerifier?: string;
    returnTo?: string;
  }
}
