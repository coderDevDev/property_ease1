'use client';

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { TabbedLogin } from '@/components/tabbed-login';

function LoginPageContent() {
  const router = useRouter();

  const handleRegister = (role: 'owner' | 'tenant' | 'admin') => {
    router.push(`/register?role=${role}`);
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <TabbedLogin
      onForgotPassword={handleForgotPassword}
      onRegister={handleRegister}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
      <LoginPageContent />
    </Suspense>
  );
}
