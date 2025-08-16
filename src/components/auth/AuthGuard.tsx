'use client';

import React, { useEffect, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import SignInModal from './SignInModal';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  fallback,
  redirectTo,
}: AuthGuardProps) {
  const { isAuthenticated, isAdmin, isLoading, requireAuth: authRequireAuth, requireAdmin: authRequireAdmin } = useAuth();
  const router = useRouter();

  // If we're still loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Check authentication requirements
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Redirect to sign-in or trigger auth requirement
    useEffect(() => {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        authRequireAuth();
      }
    }, [redirectTo, authRequireAuth, router]);

    return null;
  }

  // Check admin requirements
  if (requireAdmin && (!isAuthenticated || !isAdmin)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Redirect or trigger admin requirement
    useEffect(() => {
      if (!isAuthenticated) {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          authRequireAdmin();
        }
      } else {
        // User is authenticated but not admin
        router.push('/unauthorized');
      }
    }, [isAuthenticated, redirectTo, authRequireAdmin, router]);

    return null;
  }

  // User meets all requirements
  return <>{children}</>;
}

// Convenient wrapper components for common use cases
export function RequireAuth({ children, fallback, redirectTo }: {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}) {
  return (
    <AuthGuard 
      requireAuth={true}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </AuthGuard>
  );
}

export function RequireAdmin({ children, fallback, redirectTo }: {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}) {
  return (
    <AuthGuard 
      requireAdmin={true}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </AuthGuard>
  );
}

// Component for showing different content to authenticated vs unauthenticated users
export function ConditionalAuth({ 
  authenticated, 
  unauthenticated,
  loading 
}: {
  authenticated: ReactNode;
  unauthenticated: ReactNode;
  loading?: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{loading || <div className="animate-pulse">Loading...</div>}</>;
  }

  return <>{isAuthenticated ? authenticated : unauthenticated}</>;
}