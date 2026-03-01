import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { sessionMiddleware } from './middleware/session.js';
import { tracingMiddleware } from './middleware/tracing.js';
import { requireAuth } from './middleware/requireAuth.js';
import { initKeycloak } from './auth/keycloak.js';
import { authRoutes } from './auth/routes.js';
import { gatewayProxy } from './proxy/gateway.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Initialize Keycloak OIDC discovery
  await initKeycloak();

  const app = express();

  // Trust proxy (for secure cookies behind reverse proxy)
  app.set('trust proxy', 1);

  // CORS for dev mode (Vite on :5173)
  if (!config.isProd) {
    app.use(cors({
      origin: config.cors.origin,
      credentials: true,
    }));
  }

  // Session + tracing
  app.use(sessionMiddleware);
  app.use(tracingMiddleware);

  // Auth routes (need JSON body parsing)
  app.use('/auth', express.json(), authRoutes);

  // API proxy — requires authentication
  // IMPORTANT: no express.json() here — body parsing consumes the raw
  // request stream, which prevents http-proxy-middleware from forwarding
  // POST/PUT bodies to the gateway.
  app.use('/api', requireAuth, gatewayProxy);

  // In production, serve React static build
  if (config.isProd) {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDist));

    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.listen(config.port, () => {
    console.log(`[server] Esquire BFF running on http://localhost:${config.port}`);
    console.log(`[server] Keycloak: ${config.keycloak.issuer}`);
    console.log(`[server] Gateway:  ${config.gateway.url}`);
    console.log(`[server] Mode:     ${config.isProd ? 'production' : 'development'}`);
  });
}

main().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
