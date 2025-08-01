'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { RegisterScreen } from '@/components/register-screen';
import { RoleSelection } from '@/components/role-selection';

function RegisterPageContent() {
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-property-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }>
      <RegisterPageContent />
    </Suspense>
  );
}
