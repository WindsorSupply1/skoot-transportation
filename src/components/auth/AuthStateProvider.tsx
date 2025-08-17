'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
}

const AuthStateContext = createContext<AuthState>({
  isAuthenticated: false,
  user: null,
  isLoading: true
});

export function AuthStateProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true
  });

  useEffect(() => {
    // Only run on client side
    try {
      const { isAuthenticated, user, isLoading } = useAuth();
      setAuthState({ isAuthenticated, user, isLoading });
    } catch (error) {
      // If useAuth fails (SSR), set default state
      setAuthState({ isAuthenticated: false, user: null, isLoading: false });
    }
  }, []);

  return (
    <AuthStateContext.Provider value={authState}>
      {children}
    </AuthStateContext.Provider>
  );
}

export const useAuthState = () => useContext(AuthStateContext);