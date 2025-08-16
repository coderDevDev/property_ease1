'use client';

import '../globals.css';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/admin-sidebar';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { authState } = useAuth();

  useEffect(() => {
    // Redirect if not authenticated
    if (!authState.isLoading && !authState.user) {
      redirect('/login');
    }

    // Redirect owners to their dedicated section
    if (!authState.isLoading && authState.user?.role === 'owner') {
      redirect('/owner/dashboard');
    }
  }, [authState]);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authState.user || authState.user.role === 'owner') {
    return null; // Will redirect
  }

  // For tenant role, use a simpler layout without sidebar
  if (authState.user?.role === 'tenant') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
        <main className="w-full">{children}</main>
      </div>
    );
  }

  // Admin layout with sidebar
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
