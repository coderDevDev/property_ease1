'use client';

import type React from 'react';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Building,
  Home,
  Loader2,
  Phone,
  Mail
} from 'lucide-react';
import type { RegisterData } from '@/types/auth';

interface RegisterScreenProps {
  onBack: () => void;
  onLogin: () => void;
  selectedRole: 'owner' | 'tenant';
}

// Zod schema for form validation
const createRegisterSchema = (role: 'owner' | 'tenant') => {
  const baseSchema = z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
    acceptTerms: z
      .boolean()
      .refine(val => val === true, 'You must accept the terms and conditions'),
    role: z.literal(role)
  });

  if (role === 'owner') {
    return baseSchema.extend({
      companyName: z.string().optional(),
      businessLicense: z.string().optional()
    });
  } else {
    return baseSchema.extend({
      emergencyContactName: z.string().optional(),
      emergencyContactPhone: z.string().optional(),
      emergencyContactRelationship: z.string().optional()
    });
  }
};

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

export function RegisterScreen({
  onBack,
  onLogin,
  selectedRole
}: RegisterScreenProps) {
  const { authState, register, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const schema = createRegisterSchema(selectedRole);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    trigger
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      role: selectedRole,
      acceptTerms: false
    }
  });

  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  // Check if passwords match
  const passwordsMatch =
    watchedPassword === watchedConfirmPassword && watchedPassword !== '';

  const onSubmit = async (data: RegisterFormData) => {
    if (!passwordsMatch) {
      return;
    }

    const result = await register(data as RegisterData);

    // If registration is successful, redirect to dashboard
    if (result.success) {
      // Use window.location to force a full page reload and redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  const roleConfig = {
    owner: {
      icon: Building,
      title: 'Property Owner/Manager',
      color: 'bg-property-action',
      description: 'Create your property management account'
    },
    tenant: {
      icon: Home,
      title: 'Tenant/Resident',
      color: 'bg-purple-500',
      description: 'Create your tenant account'
    }
  };

  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  const isFormValid = isValid && passwordsMatch && isDirty;

  return (
    <div className="min-h-screen bg-property-background flex items-center justify-center p-4 lg:p-8">
      <Card className="w-full max-w-md lg:max-w-2xl bg-property-card shadow-lg border border-gray-100 lg:shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <Badge className={`${config.color} text-white px-3 py-1`}>
                <Icon className="w-4 h-4 mr-2" />
                {config.title}
              </Badge>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-property-text-primary">
            Create Account
          </CardTitle>
          <p className="text-property-text-secondary text-sm">
            {config.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-6 lg:space-y-8">
          {authState.error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700 text-sm">
                {authState.error}
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 lg:space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-property-text-primary lg:text-xl">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <Label
                    htmlFor="firstName"
                    className="text-property-text-primary font-medium text-sm lg:text-base">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    {...registerField('firstName')}
                    placeholder="John"
                    className={`mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base ${
                      errors.firstName
                        ? 'border-red-300 focus:border-red-500'
                        : ''
                    }`}
                    disabled={authState.isLoading}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs lg:text-sm mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="lastName"
                    className="text-property-text-primary font-medium text-sm lg:text-base">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    {...registerField('lastName')}
                    placeholder="Doe"
                    className={`mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base ${
                      errors.lastName
                        ? 'border-red-300 focus:border-red-500'
                        : ''
                    }`}
                    disabled={authState.isLoading}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs lg:text-sm mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className="text-property-text-primary font-medium lg:text-base">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...registerField('email')}
                    placeholder="john@example.com"
                    className={`pl-10 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base ${
                      errors.email ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    disabled={authState.isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs lg:text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className="text-property-text-primary font-medium lg:text-base">
                  Phone Number
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    {...registerField('phone')}
                    placeholder="+63 912 345 6789"
                    className={`pl-10 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base ${
                      errors.phone ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    disabled={authState.isLoading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs lg:text-sm mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Role-specific fields */}
            {selectedRole === 'owner' && (
              <div className="space-y-4 border-t border-gray-200 pt-6 lg:pt-8">
                <h4 className="text-property-text-primary font-medium text-sm lg:text-lg">
                  Business Information
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <Label
                      htmlFor="companyName"
                      className="text-property-text-primary font-medium text-sm lg:text-base">
                      Company Name (Optional)
                    </Label>
                    <Input
                      id="companyName"
                      {...registerField('companyName')}
                      placeholder="Your Property Management Company"
                      className="mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                      disabled={authState.isLoading}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="businessLicense"
                      className="text-property-text-primary font-medium text-sm lg:text-base">
                      Business License (Optional)
                    </Label>
                    <Input
                      id="businessLicense"
                      {...registerField('businessLicense')}
                      placeholder="BL-2024-001"
                      className="mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                      disabled={authState.isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedRole === 'tenant' && (
              <div className="space-y-4 border-t border-gray-200 pt-6 lg:pt-8">
                <h4 className="text-property-text-primary font-medium text-sm lg:text-lg">
                  Emergency Contact (Optional)
                </h4>
                <div>
                  <Label
                    htmlFor="emergencyContactName"
                    className="text-property-text-primary font-medium text-sm lg:text-base">
                    Contact Name
                  </Label>
                  <Input
                    id="emergencyContactName"
                    {...registerField('emergencyContactName')}
                    placeholder="Jane Doe"
                    className="mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                    disabled={authState.isLoading}
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <Label
                      htmlFor="emergencyContactPhone"
                      className="text-property-text-primary font-medium text-sm lg:text-base">
                      Phone
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      {...registerField('emergencyContactPhone')}
                      placeholder="+63 912 345 6789"
                      className="mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                      disabled={authState.isLoading}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="emergencyContactRelationship"
                      className="text-property-text-primary font-medium text-sm lg:text-base">
                      Relationship
                    </Label>
                    <Input
                      id="emergencyContactRelationship"
                      {...registerField('emergencyContactRelationship')}
                      placeholder="Sister"
                      className="mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                      disabled={authState.isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password fields */}
            <div className="space-y-4 border-t border-gray-200 pt-6 lg:pt-8">
              <h3 className="text-lg font-semibold text-property-text-primary lg:text-xl">
                Security
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <Label
                    htmlFor="password"
                    className="text-property-text-primary font-medium lg:text-base">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...registerField('password')}
                      placeholder="Create a strong password"
                      className={`pr-10 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base ${
                        errors.password
                          ? 'border-red-300 focus:border-red-500'
                          : ''
                      }`}
                      disabled={authState.isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={authState.isLoading}>
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs lg:text-sm mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="confirmPassword"
                    className="text-property-text-primary font-medium lg:text-base">
                    Confirm Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...registerField('confirmPassword')}
                      placeholder="Confirm your password"
                      className={`pr-10 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base ${
                        watchedConfirmPassword && !passwordsMatch
                          ? 'border-red-300 focus:border-red-500'
                          : ''
                      }`}
                      disabled={authState.isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={authState.isLoading}>
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
                      ) : (
                        <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  {watchedConfirmPassword && !passwordsMatch && (
                    <p className="text-red-500 text-xs lg:text-sm mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3 lg:space-x-4">
              <Checkbox
                id="terms"
                checked={watch('acceptTerms')}
                onCheckedChange={checked =>
                  setValue('acceptTerms', checked as boolean)
                }
                disabled={authState.isLoading}
                className="mt-1 lg:mt-2"
              />
              <Label
                htmlFor="terms"
                className="text-sm lg:text-base text-property-text-secondary leading-relaxed cursor-pointer">
                I agree to the{' '}
                <span className="text-property-action hover:underline">
                  Terms of Service
                </span>{' '}
                and{' '}
                <span className="text-property-action hover:underline">
                  Privacy Policy
                </span>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-500 text-xs lg:text-sm">
                {errors.acceptTerms.message}
              </p>
            )}

            <Button
              type="submit"
              className={`w-full ${config.color} hover:opacity-90 text-white font-medium h-12 lg:h-14 text-base lg:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
              disabled={authState.isLoading || !isFormValid}>
              {authState.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="border-t border-gray-200 pt-6 lg:pt-8">
            <p className="text-center text-property-text-secondary text-sm lg:text-base mb-3">
              Already have an account?
            </p>
            <Button
              variant="outline"
              onClick={onLogin}
              className="w-full border-gray-300 text-property-text-primary hover:bg-gray-50 bg-transparent h-12 lg:h-14 text-base lg:text-lg rounded-xl"
              disabled={authState.isLoading}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
