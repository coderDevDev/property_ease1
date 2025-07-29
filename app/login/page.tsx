'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoginScreen } from '@/components/login-screen';
import { RoleSelection } from '@/components/role-selection';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'owner' | 'tenant' | null>(
    null
  );

  const role = searchParams.get('role') as 'owner' | 'tenant' | null;

  useEffect(() => {
    if (role && (role === 'owner' || role === 'tenant')) {
      setSelectedRole(role);
    }
  }, [role]);

  const handleRoleSelect = (role: 'owner' | 'tenant') => {
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
