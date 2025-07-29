'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PropertyOwnerDashboard } from '@/components/property-owner-dashboard';
import { TenantDashboard } from '@/components/tenant-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Home,
  Users,
  Wrench,
  Bell,
  Settings,
  User,
  AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const { authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated, redirect to login
    // if (!authState.isAuthenticated) {
    //   router.push('/login');
    // }
  }, [authState.isAuthenticated, router]);

  // Show loading while checking authentication
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Desktop decorations */}
        <div className="hidden lg:block absolute top-20 right-20 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="hidden lg:block absolute bottom-20 left-20 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-md">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 lg:p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 lg:h-20 lg:w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6 lg:mb-8"></div>
                <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
                  Loading Dashboard
                </h2>
                <p className="text-gray-600 text-base lg:text-lg">
                  Please wait while we prepare your dashboard...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading (will redirect)
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Desktop decorations */}
        <div className="hidden lg:block absolute top-20 right-20 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="hidden lg:block absolute bottom-20 left-20 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-md">
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 lg:p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 lg:h-20 lg:w-20 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6 lg:mb-8"></div>
                <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
                  Redirecting
                </h2>
                <p className="text-gray-600 text-base lg:text-lg">
                  Taking you to the login page...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show appropriate dashboard based on user role
  if (authState.user?.role === 'owner') {
    return <PropertyOwnerDashboard />;
  } else if (authState.user?.role === 'tenant') {
    return <TenantDashboard />;
  }

  // Fallback - Enhanced for desktop
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Desktop decorations */}
      <div className="hidden lg:block absolute top-20 right-20 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
      <div className="hidden lg:block absolute bottom-20 left-20 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-2xl">
          {/* Enhanced Error Card */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center">
                {/* Icon */}
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 lg:mb-8 shadow-lg">
                  <AlertTriangle className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                </div>

                {/* Title */}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 lg:mb-4">
                  Invalid User Role
                </h1>

                {/* Description */}
                <p className="text-gray-600 text-base lg:text-lg mb-6 lg:mb-8 max-w-md mx-auto">
                  We couldn't determine your account type. Please contact our
                  support team for assistance.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center">
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg h-12 lg:h-14 text-base lg:text-lg px-6 lg:px-8">
                    <User className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
                    Back to Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 lg:h-14 text-base lg:text-lg px-6 lg:px-8">
                    <Home className="w-5 h-5 lg:w-6 lg:h-6 mr-2" />
                    Go Home
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-gray-200">
                  <p className="text-sm lg:text-base text-gray-500 mb-4">
                    Need help? Contact our support team:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 lg:gap-4 justify-center text-sm lg:text-base">
                    <span className="text-blue-600 font-medium">
                      support@propertyease.com
                    </span>
                    <span className="text-gray-400 hidden sm:inline">•</span>
                    <span className="text-blue-600 font-medium">
                      +1 (555) 123-4567
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
