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
