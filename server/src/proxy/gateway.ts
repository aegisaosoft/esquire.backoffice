import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request } from 'express';
import { config } from '../config.js';

/**
 * Proxy middleware: /api/* → Spring Gateway
 * Injects Bearer token from session and tracing headers.
 */
export const gatewayProxy = createProxyMiddleware<Request>({
  target: config.gateway.url,
  changeOrigin: true,
  secure: false, // allow self-signed TLS certificates on gateway

  // Strip /api prefix: /api/esq-kinds → /esq-kinds
  pathRewrite: { '^/api': '' },

  on: {
    proxyReq(proxyReq, req) {
      // Inject Bearer token from session
      const session = (req as any).session;
      const accessToken = session?.tokens?.access_token;
      if (accessToken) {
        proxyReq.setHeader('Authorization', `Bearer ${accessToken}`);
      }

      // Forward tracing headers
      const requestId = req.headers['x-request-id'];
      const correlationId = req.headers['x-correlation-id'];
      if (requestId) proxyReq.setHeader('X-Request-ID', requestId as string);
      if (correlationId) proxyReq.setHeader('X-Correlation-ID', correlationId as string);
      proxyReq.setHeader('X-Capture-Metrics', 'true');
    },

    proxyRes(proxyRes, req, res) {
      // Forward backend timing headers to client
      const serviceTime = proxyRes.headers['esq-service-time'];
      const backendTime = proxyRes.headers['esq-backend-time'];
      if (serviceTime) res.setHeader('Esq-Service-Time', serviceTime);
      if (backendTime) res.setHeader('Esq-Backend-Time', backendTime);
    },

    error(err, req, res) {
      console.error(`[proxy] Error proxying ${req.method} ${req.url}:`, err.message);
      const response = res as any;
      if (!response.headersSent) {
        response.status(502).json({
          type: 'https://mir0n.pro/errors',
          title: 'Gateway Error',
          status: 502,
          detail: 'Backend service unavailable',
        });
      }
    },
  },
});
