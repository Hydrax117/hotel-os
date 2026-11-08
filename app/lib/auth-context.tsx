'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, clearTokens, storeUser, type AuthUser } from './api/client';
import { getMe } from './api/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  signOut: () => void;
};

/**
 * The backend may return user fields in snake_case (first_name / last_name) or
 * nested inside a `user` wrapper.  This normaliser ensures we always have a
 * consistent AuthUser shape regardless of the server's response format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUser(raw: any): AuthUser {
  // Unwrap a possible `{ user: {...} }` envelope
  const u = raw?.user ?? raw;
  return {
    id:        u.id        ?? u._id        ?? '',
    email:     u.email     ?? '',
    firstName: u.firstName ?? u.first_name ?? '',
    lastName:  u.lastName  ?? u.last_name  ?? '',
    role:      u.role      ?? 'HOTEL_OWNER',
  };
}

const AuthContext = createContext<AuthContextValue>({
  user: null, isLoading: true, setUser: () => {}, signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Seed from localStorage immediately so the UI renders without a flash
    const stored = getCurrentUser();
    if (!stored) {
      setIsLoading(false);
      return;
    }
    // Validate the stored token against the server
    setUser(stored);
    getMe()
      .then(serverUser => {
        // The backend may return snake_case or nested fields — normalise to
        // match the AuthUser shape so firstName/lastName are never undefined.
        const normalized: AuthUser = normalizeUser(serverUser);
        // Persist the fresh, normalized user so getCurrentUser() stays in sync
        storeUser(normalized);
        setUser(normalized);
      })
      .catch((err) => {
        // Only clear the session on a definitive auth failure (401/403).
        // Network errors, timeouts, or backend cold-start failures (503 etc.)
        // should NOT log the user out — their token is likely still valid.
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 403) {
          clearTokens();
          setUser(null);
        }
        // For any other error (network, timeout, 5xx) keep the stored user
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
