'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Mail,
  Lock,
  Building,
  Users,
  Shield,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { LoginCredentials } from '@/types/auth';

// Zod schema for login form validation
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

interface TabbedLoginProps {
  onForgotPassword: () => void;
  onRegister: (role: 'owner' | 'tenant' | 'admin') => void;
}

const roles = [
  {
    id: 'owner' as const,
    label: 'Property Owner',
    icon: Building,
    description: 'Manage your properties and tenants'
  },
  {
    id: 'tenant' as const,
    label: 'Tenant',
    icon: Users,
    description: 'Find and manage your rental'
  },
  {
    id: 'admin' as const,
    label: 'Administrator',
    icon: Shield,
    description: 'System administration'
  }
];

export function TabbedLogin({
  onForgotPassword,
  onRegister
}: TabbedLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    'owner' | 'tenant' | 'admin'
  >('owner');
  const router = useRouter();
  const { login, authState } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    // Show loading toast
    const loadingToast = toast.loading('Signing you in...');

    try {
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password,
        role: selectedRole
      };

      console.log('Login attempt:', credentials);

      const result = await login(credentials);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        // Show success toast
        toast.success('Login successful!', {
          description: `Welcome back! Redirecting to ${
            roles.find(r => r.id === selectedRole)?.label
          } dashboard...`,
          duration: 3000,
          style: {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534'
          }
        });

        // Redirect to appropriate dashboard
        if (selectedRole === 'owner') {
          router.push('/owner/dashboard');
        } else if (selectedRole === 'tenant') {
          router.push('/tenant/dashboard');
        } else if (selectedRole === 'admin') {
          router.push('/dashboard');
        }
      } else {
        // Show error toast with modern red styling
        toast.error('Login failed', {
          description: result.message,
          duration: 5000,
          style: {
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626'
          }
        });
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast with modern red styling
      toast.error('Login failed', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000,
        style: {
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626'
        }
      });
    }
  };

  const currentRole = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-lg">
        <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                  PropertEase
                </h1>
              </div>
            </div>
            <p className="text-blue-600/80 text-sm sm:text-base font-medium">
              Sign in to your account
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Role Selection Cards */}
            <div className="space-y-4">
              <Label className="text-blue-700 font-semibold text-sm sm:text-base">
                Select your role
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {roles.map(role => {
                  const Icon = role.icon;
                  const isActive = selectedRole === role.id;
                  return (
                    <Card
                      key={role.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border-blue-600'
                          : 'bg-white/70 border-blue-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedRole(role.id)}>
                      <CardContent className="p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? 'bg-white/20' : 'bg-blue-100'
                            }`}>
                            <Icon
                              className={`w-5 h-5 ${
                                isActive ? 'text-white' : 'text-blue-600'
                              }`}
                            />
                          </div>
                          <div>
                            <h3
                              className={`font-semibold text-sm ${
                                isActive ? 'text-white' : 'text-blue-700'
                              }`}>
                              {role.label}
                            </h3>
                            {/* <p
                              className={`text-xs ${
                                isActive ? 'text-white/80' : 'text-blue-600/70'
                              }`}>
                              {role.description}
                            </p> */}
                          </div>
                          {isActive && (
                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-blue-600" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 sm:pl-12 h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                    {...form.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <Button
                  type="button"
                  variant="link"
                  onClick={onForgotPassword}
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium">
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                disabled={authState.isLoading}
                className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 text-white text-sm sm:text-base font-semibold rounded-lg">
                {authState.isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  `Sign in as ${currentRole?.label}`
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  onClick={() => onRegister(selectedRole)}
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto">
                  Sign up
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
