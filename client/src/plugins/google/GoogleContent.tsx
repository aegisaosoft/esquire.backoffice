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
import React, { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { useAuthContext } from '../../contexts/AuthContext';

/** URL of the esquire.reports app (Vite dev server). */
const REPORTS_URL = 'http://localhost:5174';

/**
 * Reports plugin content.
 *
 * Renders esquire.reports inside an iframe and forwards auth data
 * from the backoffice AuthContext via postMessage.
 */
export const ReportsContent: React.FC = () => {
  const { auth, logout } = useAuthContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /** Send auth state to the iframe. */
  const sendAuth = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'esquire:auth', payload: auth },
        REPORTS_URL,
      );
    }
  }, [auth]);

  // Send auth whenever it changes
  useEffect(() => {
    sendAuth();
  }, [sendAuth]);

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== REPORTS_URL) return;

      if (event.data?.type === 'esquire:auth-request') {
        // Iframe is asking for auth data
        sendAuth();
      }
      if (event.data?.type === 'esquire:logout-request') {
        // Iframe is requesting logout
        logout();
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sendAuth, logout]);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <iframe
        ref={iframeRef}
        src={REPORTS_URL}
        onLoad={sendAuth}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="Esquire Reports"
      />
    </Box>
  );
};
