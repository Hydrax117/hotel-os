'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, clearTokens, type AuthUser } from './api/client';
import { getMe } from './api/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  signOut: () => void;
};

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
        // Update with fresh server data in case role/name changed
        setUser(serverUser);
      })
      .catch(() => {
        // Token is invalid or expired — clear session
        clearTokens();
        setUser(null);
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
