import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './api/hooks';
import { AppShell } from './components/layout/AppShell';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: authState, isLoading, error } = useAuth();

  // Listen for 401 from any API call → re-check auth centrally.
  // This avoids the redirect-loop caused by individual handleResponse calls.
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [queryClient]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    );
  }

  // Not authenticated — redirect to login
  if (!authState?.authenticated) {
    const returnTo = encodeURIComponent(window.location.pathname);
    window.location.href = `/auth/login?returnTo=${returnTo}`;
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Redirecting to login…</Typography>
      </Box>
    );
  }

  // Auth error (network issue, server down)
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
        }}
      >
        <Typography color="error" variant="h6">
          Connection Error
        </Typography>
        <Typography color="text.secondary">
          Could not reach the server. Please check your connection.
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  // Authenticated — render the explorer
  return <AppShell />;
};
