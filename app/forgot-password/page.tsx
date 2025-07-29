'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ForgotPasswordScreen } from '@/components/forgot-password-screen';
import { RoleSelection } from '@/components/role-selection';

export default function ForgotPasswordPage() {
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
    router.push(`/forgot-password?role=${role}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  // If no role is selected, show role selection
  if (!selectedRole) {
    return (
      <RoleSelection onRoleSelect={handleRoleSelect} onBack={handleBack} />
    );
  }

  // Show forgot password screen with selected role
  return (
    <ForgotPasswordScreen
      selectedRole={selectedRole}
      onBack={() => router.push(`/login?role=${selectedRole}`)}
    />
  );
}
