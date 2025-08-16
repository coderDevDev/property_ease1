'use client';

import { PropertyOwnerSidebar } from './components/property-owner-sidebar';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function OwnerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { authState } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated or not an owner
    if (
      !authState.isLoading &&
      (!authState.user || authState.user.role !== 'owner')
    ) {
      redirect('/login');
    }
  }, [authState]);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authState.user || authState.user.role !== 'owner') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      <PropertyOwnerSidebar />
      <main className="lg:ml-72">{children}</main>
    </div>
  );
}
