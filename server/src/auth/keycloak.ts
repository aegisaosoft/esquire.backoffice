import * as client from 'openid-client';
import { config } from '../config.js';

let oidcConfig: client.Configuration | null = null;

/**
 * Initialize OIDC discovery against Keycloak with retry logic.
 * Retries up to `maxRetries` times with exponential backoff.
 */
export async function initKeycloak(maxRetries = 10, baseDelay = 3000): Promise<void> {
  const issuerUrl = new URL(config.keycloak.issuer);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      oidcConfig = await client.discovery(
        issuerUrl,
        config.keycloak.clientId,
        undefined, // no client secret (public client)
        undefined, // no auth method
        {
          // Allow self-signed / untrusted TLS certificates (dev mode)
          execute: [client.allowInsecureRequests],
        },
      );
      console.log(`[keycloak] OIDC discovery complete: ${config.keycloak.issuer}`);
      return;
    } catch (err: any) {
      const code = err?.cause?.code || err?.code || '';
      const isRetryable = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'DEPTH_ZERO_SELF_SIGNED_CERT'].includes(code)
        || err.message?.includes('fetch failed');

      if (!isRetryable || attempt === maxRetries) {
        console.error(`[keycloak] OIDC discovery failed after ${attempt} attempt(s):`, err.message);
        throw err;
      }

      const delay = baseDelay * Math.min(attempt, 5); // cap at 15s
      console.warn(`[keycloak] Discovery attempt ${attempt}/${maxRetries} failed (${code || err.message}). Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export function getOidcConfig(): client.Configuration {
  if (!oidcConfig) {
    throw new Error('Keycloak OIDC not initialized. Call initKeycloak() first.');
  }
  return oidcConfig;
}
