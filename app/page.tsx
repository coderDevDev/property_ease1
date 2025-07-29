'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/components/splash-screen';
import { PropertyOwnerDashboard } from '@/components/property-owner-dashboard';
import { TenantDashboard } from '@/components/tenant-dashboard';

function AppContent() {
  const { authState } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated and splash is done
    if (!authState.isAuthenticated && !showSplash) {
      router.push('/login');
    }
  }, [authState.isAuthenticated, showSplash, router]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // If authenticated, redirect to dashboard
  if (authState.isAuthenticated && authState.user) {
    router.push('/dashboard');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <AppContent />;
}
