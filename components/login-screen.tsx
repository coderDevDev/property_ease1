'use client';

import type React from 'react';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Building,
  Home,
  Users,
  Loader2,
  Sparkles
} from 'lucide-react';
import type { LoginCredentials } from '@/types/auth';

interface LoginScreenProps {
  onBack: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  selectedRole: 'owner' | 'tenant' | 'admin';
}

// Zod schema for login form validation
const createLoginSchema = (role: 'owner' | 'tenant' | 'admin') => {
  return z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    role: z.literal(role)
  });
};

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

export function LoginScreen({
  onBack,
  onForgotPassword,
  onRegister,
  selectedRole
}: LoginScreenProps) {
  const { authState, login, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const schema = createLoginSchema(selectedRole);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      email:
        selectedRole === 'owner'
          ? 'owner@propertyease.com'
          : 'tenant@propertyease.com',
      password: 'password123',
      role: selectedRole
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    // Show loading toast
    const loadingToast = toast.loading('Signing you in...');

    try {
      const result = await login(data as LoginCredentials);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        // Show success toast
        toast.success('Login successful!', {
          description: 'Redirecting to dashboard...',
          duration: 3000
        });

        // Use window.location to force a full page reload and redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Show error toast
        toast.error('Login failed', {
          description: result.message,
          duration: 5000
        });
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast
      toast.error('Login failed', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000
      });
    }
  };

  const roleConfig = {
    owner: {
      icon: Building,
      title: 'Property Owner',
      color: 'bg-blue-500',
      description: 'Manage your properties and tenants'
    },
    tenant: {
      icon: Home,
      title: 'Tenant',
      color: 'bg-blue-400',
      description: 'Access your rental information'
    },
    admin: {
      icon: Users,
      title: 'System Administrator',
      color: 'bg-blue-600',
      description: 'System oversight and management'
    }
  } as const;

  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  const isFormValid = isValid && isDirty;

  // Debug form state
  console.log('Login Form Debug:', {
    isValid,
    isDirty,
    isFormValid,
    errors: Object.keys(errors)
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="p-4 pt-8">
          <Card className="w-full max-w-sm mx-auto bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <Badge
                    className={`${config.color} text-white px-3 py-1 rounded-full`}>
                    <Icon className="w-4 h-4 mr-2" />
                    {config.title}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome Back
              </CardTitle>
              <p className="text-gray-600 text-sm">{config.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {authState.error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 text-sm">
                    {authState.error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Hidden role field */}
                <input
                  type="hidden"
                  {...registerField('role')}
                  value={selectedRole}
                />

                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <Input
                    {...registerField('email')}
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className={`mt-1 focus:border-blue-500 ${
                      errors.email
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                    disabled={authState.isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      {...registerField('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`pr-10 focus:border-blue-500 ${
                        errors.password
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300'
                      }`}
                      disabled={authState.isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={authState.isLoading}>
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className={`w-full ${config.color} hover:opacity-90 text-white font-medium h-12 text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
                  disabled={authState.isLoading || !isFormValid}>
                  {authState.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="space-y-3">
                <Button
                  variant="link"
                  onClick={onForgotPassword}
                  className="w-full text-gray-600 hover:text-gray-800 p-0 h-auto text-sm"
                  disabled={authState.isLoading}>
                  Forgot your password?
                </Button>

                <div className="text-center">
                  <p className="text-gray-600 text-sm">
                    Don't have an account?{' '}
                    <Button
                      variant="link"
                      onClick={onRegister}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto text-sm font-medium"
                      disabled={authState.isLoading}>
                      Sign up
                    </Button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Split-Screen Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 rounded-xl">
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                  <div className="flex-1">
                    <Badge
                      className={`${config.color} text-white px-4 py-2 rounded-full`}>
                      <Icon className="w-5 h-5 mr-2" />
                      {config.title}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Welcome Back
                </CardTitle>
                <p className="text-gray-600 text-base">{config.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {authState.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700 text-sm">
                      {authState.error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Hidden role field */}
                  <input
                    type="hidden"
                    {...registerField('role')}
                    value={selectedRole}
                  />

                  <div>
                    <Label
                      htmlFor="email"
                      className="text-gray-700 font-medium">
                      Email Address
                    </Label>
                    <Input
                      {...registerField('email')}
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className={`mt-1 focus:border-blue-500 ${
                        errors.email
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300'
                      }`}
                      disabled={authState.isLoading}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label
                      htmlFor="password"
                      className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        {...registerField('password')}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className={`pr-10 focus:border-blue-500 ${
                          errors.password
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300'
                        }`}
                        disabled={authState.isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={authState.isLoading}>
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className={`w-full ${config.color} hover:opacity-90 text-white font-medium h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
                    disabled={authState.isLoading || !isFormValid}>
                    {authState.isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="space-y-3">
                  <Button
                    variant="link"
                    onClick={onForgotPassword}
                    className="w-full text-gray-600 hover:text-gray-800 p-0 h-auto text-base"
                    disabled={authState.isLoading}>
                    Forgot your password?
                  </Button>

                  <div className="text-center">
                    <p className="text-gray-600 text-base">
                      Don't have an account?{' '}
                      <Button
                        variant="link"
                        onClick={onRegister}
                        className="text-blue-600 hover:text-blue-800 p-0 h-auto text-base font-medium"
                        disabled={authState.isLoading}>
                        Sign up
                      </Button>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Illustration & Brand Message */}
        <div className="flex-1 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-12 text-white">
            {/* Icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl">
                <Icon className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-yellow-800" />
              </div>
            </div>

            {/* Brand Message */}
            <div className="text-center max-w-md">
              <h2 className="text-4xl font-bold mb-4">
                {selectedRole === 'owner'
                  ? 'Manage Properties'
                  : 'Find Your Home'}
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                {selectedRole === 'owner'
                  ? 'Streamline your property management with our comprehensive platform designed for modern landlords.'
                  : 'Discover your perfect rental property with ease and connect directly with property owners.'}
              </p>

              {/* Features List */}
              <div className="space-y-3 text-left">
                {selectedRole === 'owner' ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-blue-100">
                        Track rental income & expenses
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-blue-100">
                        Manage tenant applications
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-blue-100">
                        Handle maintenance requests
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-blue-100">
                        Generate detailed reports
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-blue-100">
                        Browse available properties
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-blue-100">
                        Submit rental applications
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-blue-100">
                        Pay rent securely online
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      <span className="text-blue-100">
                        Communicate with landlords
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2 text-blue-200">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <div
                  className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 bg-white/30 rounded-full animate-pulse"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
