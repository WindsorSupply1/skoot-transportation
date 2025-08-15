'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  
  // Skip SessionProvider for admin route to avoid conflicts
  if (pathname === '/admin') {
    return <>{children}</>;
  }
  
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}