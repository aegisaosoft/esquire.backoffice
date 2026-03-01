import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Adds X-Request-ID and X-Correlation-ID headers to every request.
 * These are forwarded to the Spring Gateway for distributed tracing.
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const correlationId = (req.headers['x-correlation-id'] as string) || `${requestId}-CID`;

  req.headers['x-request-id'] = requestId;
  req.headers['x-correlation-id'] = correlationId;

  // Echo back in response headers
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}
