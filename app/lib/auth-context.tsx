'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, clearTokens, type AuthUser } from './api/client';

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
    setUser(getCurrentUser());
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{user, isLoading, setUser, signOut}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
