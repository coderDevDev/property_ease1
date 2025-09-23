'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
