'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RegisterScreen } from '@/components/register-screen';
import { RoleSelection } from '@/components/role-selection';

export default function RegisterPage() {
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
    router.push(`/register?role=${role}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  const handleLogin = () => {
    if (selectedRole) {
      router.push(`/login?role=${selectedRole}`);
    }
  };

  // If no role is selected, show role selection
  if (!selectedRole) {
    return (
      <RoleSelection onRoleSelect={handleRoleSelect} onBack={handleBack} />
    );
  }

  // Show register screen with selected role
  return (
    <RegisterScreen
      selectedRole={selectedRole}
      onBack={() => router.push(`/login?role=${selectedRole}`)}
      onLogin={handleLogin}
    />
  );
}
