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
