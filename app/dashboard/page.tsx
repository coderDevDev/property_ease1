'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminDashboard } from '@/components/admin-dashboard';

export default function DashboardPage() {
  const { authState } = useAuth();
  const router = useRouter();

  // Optionally, handle redirect if not authenticated
  // useEffect(() => {
  //   if (!authState.isAuthenticated) {
  //     router.push('/login');
  //   }
  // }, [authState.isAuthenticated, router]);

  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            Loading Dashboard
          </h2>
          <p className="text-gray-600 text-base text-center">
            Please wait while we prepare your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
            Redirecting
          </h2>
          <p className="text-gray-600 text-base text-center">
            Taking you to the login page...
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Redirect owners to their dedicated section
    if (!authState.isLoading && authState.user?.role === 'owner') {
      router.push('/owner/dashboard');
    }
    // Redirect tenants to their dedicated section
    if (!authState.isLoading && authState.user?.role === 'tenant') {
      router.push('/tenant/dashboard');
    }
  }, [authState, router]);

  if (authState.user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Fallback for unknown role
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="w-full max-w-2xl">
        <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          {/* Icon for error */}
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">
          Invalid User Role
        </h1>
        <p className="text-gray-600 text-base mb-6 max-w-md mx-auto text-center">
          We couldn't determine your account type. Please contact our support
          team for assistance.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg h-12 text-base px-6 rounded-lg">
            Back to Login
          </button>
          <button
            onClick={() => router.push('/')}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-base px-6 rounded-lg">
            Go Home
          </button>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Need help? Contact our support team:
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
            <span className="text-blue-600 font-medium">
              support@propertyease.com
            </span>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="text-blue-600 font-medium">+1 (555) 123-4567</span>
          </div>
        </div>
      </div>
    </div>
  );
}
