'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    isAdmin?: boolean;
  } | null;
  isLoading: boolean;
  requireAuth: (redirectTo?: string) => void;
  requireAdmin: (redirectTo?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

function AuthProviderInner({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(status === 'loading');
  }, [status]);

  const requireAuth = (redirectTo?: string) => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectPath = redirectTo || currentPath;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(redirectPath)}`);
      return;
    }
  };

  const requireAdmin = (redirectTo?: string) => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      const currentPath = window.location.pathname + window.location.search;
      const redirectPath = redirectTo || currentPath;
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(redirectPath)}`);
      return;
    }
    
    if (!session.user.isAdmin) {
      router.push('/unauthorized');
      return;
    }
  };

  const value: AuthContextType = {
    isAuthenticated: !!session?.user,
    isAdmin: !!session?.user?.isAdmin,
    user: session?.user || null,
    isLoading,
    requireAuth,
    requireAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthProviderInner>
        {children}
      </AuthProviderInner>
    </SessionProvider>
  );
}