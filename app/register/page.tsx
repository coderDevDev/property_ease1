'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { TabbedRegister } from '@/components/tabbed-register';
import { RoleSelection } from '@/components/role-selection';

function RegisterPageContent() {
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
    router.push(`/register?role=${role}`);
  };

  const handleBack = () => {
    router.push('/login');
  };

  const handleLogin = () => {
    if (selectedRole) {
      router.push(`/login?role=${selectedRole}`);
    } else {
      router.push('/login');
    }
  };

  // If no role is selected, show role selection

  // Show register screen with selected role
  return (
    !!selectedRole && (
      <TabbedRegister
        selectedRole={selectedRole}
        onBack={handleBack}
        onLogin={handleLogin}
      />
    )
  );
}

export default function RegisterPage() {
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
      <RegisterPageContent />
    </Suspense>
  );
}
