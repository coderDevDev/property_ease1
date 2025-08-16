'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { LoginScreen } from '@/components/login-screen';
import { RoleSelection } from '@/components/role-selection';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<
    'owner' | 'tenant' | 'admin' | null
  >(null);

  const role = searchParams.get('role') as 'owner' | 'tenant' | 'admin' | null;

  useEffect(() => {
    if (role && (role === 'owner' || role === 'tenant' || role === 'admin')) {
      setSelectedRole(role);
    }
  }, [role]);

  const handleRoleSelect = (role: 'owner' | 'tenant' | 'admin') => {
    router.push(`/login?role=${role}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleRegister = () => {
    if (selectedRole) {
      router.push(`/register?role=${selectedRole}`);
    }
  };

  const handleForgotPassword = () => {
    if (selectedRole) {
      router.push(`/forgot-password?role=${selectedRole}`);
    }
  };

  // If no role is selected, show role selection
  if (!selectedRole) {
    return (
      <RoleSelection onRoleSelect={handleRoleSelect} onBack={handleBack} />
    );
  }

  // Show login screen with selected role
  return (
    <LoginScreen
      selectedRole={selectedRole}
      onBack={() => router.push('/')}
      onRegister={handleRegister}
      onForgotPassword={handleForgotPassword}
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
