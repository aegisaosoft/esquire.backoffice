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
import React, { createContext, useContext } from 'react';
import type { AuthState } from '../api/types';

/**
 * Auth context value provided to all plugins.
 */
interface AuthContextValue {
  /** Current authentication state (user info, authenticated flag). */
  auth: AuthState;
  /** Trigger logout (redirects to Keycloak). */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provider — wraps MainShell so all plugins receive auth data.
 */
export const AuthProvider: React.FC<{
  auth: AuthState;
  logout: () => void;
  children: React.ReactNode;
}> = ({ auth, logout, children }) => (
  <AuthContext.Provider value={{ auth, logout }}>
    {children}
  </AuthContext.Provider>
);

/**
 * Hook for plugins to access auth data.
 *
 * @example
 * const { auth, logout } = useAuthContext();
 * console.log(auth.user?.name);
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
