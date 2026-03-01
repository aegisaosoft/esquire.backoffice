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
