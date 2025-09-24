'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TenantSidebar } from './components/tenant-sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';

export default function TenantLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect non-tenants to their appropriate dashboard
    if (
      !authState.isLoading &&
      authState.isAuthenticated &&
      authState.user?.role !== 'tenant'
    ) {
      if (authState.user?.role === 'owner') {
        router.push('/owner/dashboard');
      } else if (authState.user?.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [authState, router]);

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Tenant Dashboard
          </h2>
          <p className="text-gray-600 text-base">
            Please wait while we prepare your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated || authState.user?.role !== 'tenant') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Redirecting
          </h2>
          <p className="text-gray-600 text-base">
            Taking you to the appropriate dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <TenantSidebar />
        <div className="flex-1 lg:ml-64">
          <TopNavbar role="tenant" />
          <main className="pt-0 p-6">{children}</main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <TenantSidebar />
        <TopNavbar role="tenant" />
        <main className="pt-0">{children}</main>
      </div>
    </div>
  );
}
