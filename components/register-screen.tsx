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
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Building,
  Home,
  Users,
  Loader2,
  Phone,
  Mail,
  CheckCircle
} from 'lucide-react';
import type { RegisterData } from '@/types/auth';

interface RegisterScreenProps {
  onBack: () => void;
  onLogin: () => void;
  selectedRole: 'owner' | 'tenant' | 'admin';
}

// Zod schema for form validation
const createRegisterSchema = (role: 'owner' | 'tenant' | 'admin') => {
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
  } else if (role === 'tenant') {
    return baseSchema.extend({
      emergencyContactName: z.string().optional(),
      emergencyContactPhone: z.string().optional(),
      emergencyContactRelationship: z.string().optional()
    });
  } else {
    // Admin role - no additional fields required
    return baseSchema;
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
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);

  const schema = createRegisterSchema(selectedRole);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue
  } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      role: selectedRole
    }
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const passwordsMatch = password === confirmPassword;

  // Debug form state
  console.log('Form Debug:', {
    isValid,
    isDirty,
    passwordsMatch,
    password: password ? 'filled' : 'empty',
    confirmPassword: confirmPassword ? 'filled' : 'empty',
    errors: Object.keys(errors)
  });

  const isFormValid = isValid && passwordsMatch && isDirty;

  const onSubmit = async (data: RegisterFormData) => {
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Creating your account...');

    try {
      const result = await register(data as RegisterData);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        // Show success toast
        toast.success('Account created successfully!', {
          description: 'Please check your email to verify your account.',
          duration: 5000
        });

        setIsRegistrationSuccess(true);
      } else {
        // Show error toast
        toast.error('Registration failed', {
          description: result.message,
          duration: 5000
        });
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast
      toast.error('Registration failed', {
        description: 'An unexpected error occurred. Please try again.',
        duration: 5000
      });
    }
  };

  const roleConfig = {
    owner: {
      icon: Building,
      title: 'Property Owner/Manager',
      color: 'bg-blue-500',
      description: 'Create your property management account'
    },
    tenant: {
      icon: Home,
      title: 'Tenant/Resident',
      color: 'bg-blue-400',
      description: 'Create your tenant account'
    },
    admin: {
      icon: Users,
      title: 'System Administrator',
      color: 'bg-blue-600',
      description: 'Create your admin account'
    }
  } as const;

  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  // Show success message after registration
  if (isRegistrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md bg-property-card shadow-lg border border-gray-100 lg:shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-property-text-primary mb-2">
              Registration Successful!
            </h2>
            <p className="text-property-text-secondary text-sm mb-6">
              Your account has been created successfully. Please check your
              email to verify your account before signing in.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-blue-900 font-medium text-sm mb-2">
                Next Steps:
              </h4>
              <ul className="text-blue-700 text-xs space-y-1 text-left">
                <li>• Check your email for a verification link</li>
                <li>• Click the verification link to activate your account</li>
                <li>• Return here to sign in with your credentials</li>
              </ul>
            </div>
            <Button
              onClick={onLogin}
              className="w-full bg-property-action hover:bg-property-action/90 text-white mb-4">
              Go to Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsRegistrationSuccess(false)}
              className="w-full border-gray-300 text-property-text-primary hover:bg-gray-50">
              Register Another Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4 lg:p-8">
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

            {/* Email Field */}
            <div>
              <Label
                htmlFor="email"
                className="text-property-text-primary font-medium">
                Email Address
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  {...registerField('email')}
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className={`pl-10 focus:border-property-action ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={authState.isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="password"
                  className="text-property-text-primary font-medium">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    {...registerField('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    className={`pr-10 focus:border-property-action ${
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

              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-property-text-primary font-medium">
                  Confirm Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    {...registerField('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className={`pr-10 focus:border-property-action ${
                      errors.confirmPassword ||
                      (!passwordsMatch && confirmPassword)
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                    disabled={authState.isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={authState.isLoading}>
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
                {!passwordsMatch && confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="firstName"
                  className="text-property-text-primary font-medium">
                  First Name
                </Label>
                <Input
                  {...registerField('firstName')}
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  className={`focus:border-property-action ${
                    errors.firstName
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={authState.isLoading}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="lastName"
                  className="text-property-text-primary font-medium">
                  Last Name
                </Label>
                <Input
                  {...registerField('lastName')}
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  className={`focus:border-property-action ${
                    errors.lastName
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={authState.isLoading}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <Label
                htmlFor="phone"
                className="text-property-text-primary font-medium">
                Phone Number
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  {...registerField('phone')}
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  className={`pl-10 focus:border-property-action ${
                    errors.phone
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={authState.isLoading}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Role-specific Fields */}
            {selectedRole === 'owner' && (
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="companyName"
                    className="text-property-text-primary font-medium">
                    Company Name (Optional)
                  </Label>
                  <Input
                    {...registerField('companyName' as any)}
                    id="companyName"
                    type="text"
                    placeholder="Enter your company name"
                    className="border-gray-300 focus:border-blue-400"
                    disabled={authState.isLoading}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="businessLicense"
                    className="text-property-text-primary font-medium">
                    Business License (Optional)
                  </Label>
                  <Input
                    {...registerField('businessLicense' as any)}
                    id="businessLicense"
                    type="text"
                    placeholder="Enter your business license number"
                    className="border-gray-300 focus:border-blue-400"
                    disabled={authState.isLoading}
                  />
                </div>
              </div>
            )}

            {selectedRole === 'tenant' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="emergencyContactName"
                      className="text-property-text-primary font-medium">
                      Emergency Contact Name (Optional)
                    </Label>
                    <Input
                      {...registerField('emergencyContactName' as any)}
                      id="emergencyContactName"
                      type="text"
                      placeholder="Enter emergency contact name"
                      className="border-gray-300 focus:border-blue-400"
                      disabled={authState.isLoading}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="emergencyContactPhone"
                      className="text-property-text-primary font-medium">
                      Emergency Contact Phone (Optional)
                    </Label>
                    <Input
                      {...registerField('emergencyContactPhone' as any)}
                      id="emergencyContactPhone"
                      type="tel"
                      placeholder="Enter emergency contact phone"
                      className="border-gray-300 focus:border-blue-400"
                      disabled={authState.isLoading}
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="emergencyContactRelationship"
                    className="text-property-text-primary font-medium">
                    Relationship to Emergency Contact (Optional)
                  </Label>
                  <Input
                    {...registerField('emergencyContactRelationship' as any)}
                    id="emergencyContactRelationship"
                    type="text"
                    placeholder="e.g., Spouse, Parent, Friend"
                    className="border-gray-300 focus:border-blue-400"
                    disabled={authState.isLoading}
                  />
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={watch('acceptTerms')}
                onCheckedChange={checked =>
                  setValue('acceptTerms', checked as boolean)
                }
                disabled={authState.isLoading}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="acceptTerms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I accept the terms and conditions
                </Label>
                <p className="text-xs text-property-text-secondary">
                  By checking this box, you agree to our Terms of Service and
                  Privacy Policy.
                </p>
              </div>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-500 text-xs mt-1">
                {errors.acceptTerms.message}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full ${config.color} hover:opacity-90 text-white font-medium`}
              disabled={authState.isLoading || !isFormValid}>
              {authState.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-property-text-secondary text-sm">
              Already have an account?{' '}
              <Button
                variant="link"
                onClick={onLogin}
                className="text-property-action hover:text-property-action/80 p-0 h-auto text-sm"
                disabled={authState.isLoading}>
                Sign In
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
