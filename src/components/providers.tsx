'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import AuthProvider from '../../components/auth/AuthProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}