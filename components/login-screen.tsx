'use client';

import type React from 'react';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, Building, Home, Loader2 } from 'lucide-react';
import type { LoginCredentials } from '@/types/auth';

interface LoginScreenProps {
  onBack: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  selectedRole: 'owner' | 'tenant';
}

export function LoginScreen({
  onBack,
  onForgotPassword,
  onRegister,
  selectedRole
}: LoginScreenProps) {
  const { authState, login, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email:
      selectedRole === 'owner'
        ? 'owner@propertyease.com'
        : 'tenant@propertyease.com',
    password: 'password123',
    role: selectedRole
  });

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (authState.error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(formData);

    // If login is successful, redirect to dashboard
    if (result.success) {
      // Use window.location to force a full page reload and redirect to dashboard
      window.location.href = '/dashboard';
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
      color: 'bg-purple-500',
      description: 'Access your rental information'
    }
  };

  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col p-4 lg:p-8">
      <Card className="w-full max-w-sm lg:max-w-lg mx-auto mt-8 lg:mt-12 bg-white/90 backdrop-blur-sm shadow-xl lg:shadow-2xl border-0">
        <CardHeader className="text-center pb-4 lg:pb-6">
          <div className="flex items-center gap-3 mb-4 lg:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-xl">
              <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
            </Button>
            <div className="flex-1">
              <Badge
                className={`${config.color} text-white px-3 py-1 lg:px-4 lg:py-2 rounded-full`}>
                <Icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                {config.title}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome Back
          </CardTitle>
          <p className="text-gray-600 text-sm lg:text-base">
            {config.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-6 lg:space-y-8 px-6 pb-6 lg:px-8 lg:pb-8">
          {authState.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700 text-sm">
                {authState.error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
            <div>
              <Label
                htmlFor="email"
                className="text-gray-900 font-medium text-sm lg:text-base">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                required
                className="mt-1 border-gray-300 focus:border-blue-500 h-12 lg:h-14 text-base"
                disabled={authState.isLoading}
              />
            </div>

            <div>
              <Label
                htmlFor="password"
                className="text-gray-900 font-medium text-sm lg:text-base">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="pr-12 border-gray-300 focus:border-blue-500 h-12 lg:h-14 text-base"
                  disabled={authState.isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-12 lg:h-14 px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={authState.isLoading}>
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 lg:w-6 lg:h-6 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full ${config.color} hover:opacity-90 text-white font-medium h-12 lg:h-14 text-base lg:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
              disabled={authState.isLoading}>
              {authState.isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="link"
              onClick={onForgotPassword}
              className="text-blue-600 hover:text-blue-700 p-0 h-auto text-sm lg:text-base"
              disabled={authState.isLoading}>
              Forgot your password?
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-6 lg:pt-8">
            <p className="text-center text-gray-600 text-sm lg:text-base mb-3">
              Don't have an account?
            </p>
            <Button
              variant="outline"
              onClick={onRegister}
              className="w-full border-gray-300 text-gray-900 hover:bg-gray-50 bg-transparent h-12 lg:h-14 text-base lg:text-lg rounded-xl"
              disabled={authState.isLoading}>
              Create Account
            </Button>
          </div>

          {/* Demo Credentials */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 lg:p-6">
            <p className="text-blue-900 text-sm lg:text-base font-medium mb-2 lg:mb-3">
              Demo Credentials:
            </p>
            <div className="space-y-1 text-sm lg:text-base text-blue-700">
              <p>
                <strong>Email:</strong> {selectedRole}@propertyease.com
              </p>
              <p>
                <strong>Password:</strong> password123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
