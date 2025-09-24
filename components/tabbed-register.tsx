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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail,
  Lock,
  Building,
  Users,
  Shield,
  Eye,
  EyeOff,
  Check,
  User,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { RegisterData } from '@/types/auth';

// Zod schema for register form validation
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
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
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
    return baseSchema;
  }
};

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

interface TabbedRegisterProps {
  selectedRole: 'owner' | 'tenant' | 'admin';
  onBack: () => void;
  onLogin: () => void;
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
  }
  // {
  //   id: 'admin' as const,
  //   label: 'Administrator',
  //   icon: Shield,
  //   description: 'System administration'
  // }
];

export function TabbedRegister({
  selectedRole,
  onBack,
  onLogin
}: TabbedRegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const router = useRouter();
  const { register, authState } = useAuth();

  const schema = createRegisterSchema(selectedRole);

  console.log({ selectedRole });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      acceptTerms: false,
      role: selectedRole
    }
  });

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');
  const passwordsMatch = password === confirmPassword;

  // Function to check email uniqueness
  const checkEmailUniqueness = async (email: string) => {
    if (!email || !email.includes('@')) return;

    setIsCheckingEmail(true);
    setEmailError('');

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (result.success && result.exists) {
        setEmailError(
          'This email is already registered. Please use a different email or try signing in.'
        );
        return false;
      } else {
        setEmailError('');
        return true;
      }
    } catch (error) {
      console.error('Email check error:', error);
      // Don't set error for network issues, let server handle it
      return true;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    console.log('Form submission started:', {
      data,
      passwordsMatch,
      emailError
    });
    console.log('Form validation state:', {
      isValid: form.formState.isValid,
      isDirty: form.formState.isDirty,
      errors: form.formState.errors
    });

    if (!passwordsMatch) {
      toast.error('Passwords do not match', {
        description: 'Please make sure both passwords are identical.',
        duration: 5000,
        style: {
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626'
        }
      });
      return;
    }

    console.log('here');
    // Check email uniqueness before submitting
    const isEmailAvailable = await checkEmailUniqueness(data.email);
    if (!isEmailAvailable) {
      console.log('Email not available, stopping submission');

      toast.error('Email already exist', {
        description:
          'This email is already registered. Please use a different email or try signing in.',
        duration: 5000,
        style: {
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626'
        }
      });
      return; // Stop submission if email is already taken
    }

    // Show loading toast
    const loadingToast = toast.loading('Creating your account...', {
      description: 'Please wait while we set up your account.',
      duration: 10000
    });

    try {
      const result = await register(data as RegisterData);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.success) {
        // Show success toast
        toast.success('Account created successfully!', {
          description: 'Please check your email to verify your account.',
          duration: 5000,
          style: {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534'
          }
        });

        // Redirect to login with the same role
        setTimeout(() => {
          router.push(`/login?role=${selectedRole}`);
        }, 2000);
      } else {
        // Handle specific error messages
        let errorMessage = result.message;
        let errorDescription = 'Please try again.';

        if (
          result.message.includes('already registered') ||
          result.message.includes('already exists') ||
          result.message.includes('duplicate')
        ) {
          errorMessage = 'Email already registered';
          errorDescription =
            'This email is already registered. Please use a different email or try signing in.';
        } else if (result.message.includes('password')) {
          errorMessage = 'Password requirements not met';
          errorDescription =
            'Please ensure your password meets all requirements.';
        } else if (result.message.includes('phone')) {
          errorMessage = 'Invalid phone number';
          errorDescription = 'Please enter a valid phone number.';
        }

        // Show error toast with modern red styling
        toast.error(errorMessage, {
          description: errorDescription,
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
      toast.error('Registration failed', {
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="absolute left-4 text-blue-600 hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Building className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                  PropertyEase
                </h1>
              </div>
            </div>
            <p className="text-blue-600/80 text-sm sm:text-base font-medium">
              Create your {currentRole?.label} account
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Role Display */}
            <div className="space-y-4">
              <Label className="text-blue-700 font-semibold text-sm sm:text-base">
                Account Type
              </Label>
              <div className="flex justify-center">
                <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border-blue-600 w-full max-w-xs">
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20">
                        {currentRole && (
                          <currentRole.icon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-white">
                          {currentRole?.label}
                        </h3>
                        <p className="text-xs text-white/80">
                          {currentRole?.description}
                        </p>
                      </div>
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <Label className="text-blue-700 font-semibold text-sm sm:text-base">
                  Personal Information
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-blue-700 font-medium">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        className="pl-10 sm:pl-12 h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                        {...form.register('firstName')}
                      />
                    </div>
                    {form.formState.errors.firstName && (
                      <p className="text-red-500 text-sm">
                        {form.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-blue-700 font-medium">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        className="pl-10 sm:pl-12 h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                        {...form.register('lastName')}
                      />
                    </div>
                    {form.formState.errors.lastName && (
                      <p className="text-red-500 text-sm">
                        {form.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

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
                  <Label htmlFor="phone" className="text-blue-700 font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      className="pl-10 sm:pl-12 h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                      {...form.register('phone')}
                    />
                  </div>
                  {form.formState.errors.phone && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <Label className="text-blue-700 font-semibold text-sm sm:text-base">
                  Password
                </Label>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-blue-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
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

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-blue-700 font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                      {...form.register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }>
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      )}
                    </Button>
                  </div>
                  {!passwordsMatch && confirmPassword && (
                    <p className="text-red-500 text-sm">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              {/* Role-specific fields */}
              {selectedRole === 'owner' && (
                <div className="space-y-4">
                  <Label className="text-blue-700 font-semibold text-sm sm:text-base">
                    Business Information
                  </Label>

                  <div className="space-y-2">
                    <Label
                      htmlFor="companyName"
                      className="text-blue-700 font-medium">
                      Company Name (Optional)
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="Enter your company name"
                      className="h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                      {...form.register('companyName' as any)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="businessLicense"
                      className="text-blue-700 font-medium">
                      Business License (Optional)
                    </Label>
                    <Input
                      id="businessLicense"
                      placeholder="Enter your business license number"
                      className="h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                      {...form.register('businessLicense' as any)}
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'tenant' && (
                <div className="space-y-4">
                  <Label className="text-blue-700 font-semibold text-sm sm:text-base">
                    Emergency Contact (Optional)
                  </Label>

                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactName"
                      className="text-blue-700 font-medium">
                      Emergency Contact Name
                    </Label>
                    <Input
                      id="emergencyContactName"
                      placeholder="Enter emergency contact name"
                      className="h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                      {...form.register('emergencyContactName' as any)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactPhone"
                      className="text-blue-700 font-medium">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      placeholder="Enter emergency contact phone"
                      className="h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                      {...form.register('emergencyContactPhone' as any)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContactRelationship"
                      className="text-blue-700 font-medium">
                      Relationship
                    </Label>
                    <Input
                      id="emergencyContactRelationship"
                      placeholder="e.g., Parent, Spouse, Friend"
                      className="h-10 sm:h-12 border-blue-200 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base bg-blue-50/30"
                      {...form.register('emergencyContactRelationship' as any)}
                    />
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={form.watch('acceptTerms')}
                    onCheckedChange={checked =>
                      form.setValue('acceptTerms', !!checked)
                    }
                    className="mt-1"
                  />
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm text-gray-600 leading-relaxed">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      className="text-blue-600 hover:text-blue-700 underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="/privacy"
                      className="text-blue-600 hover:text-blue-700 underline">
                      Privacy Policy
                    </a>
                  </Label>
                </div>
                {form.formState.errors.acceptTerms && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.acceptTerms.message}
                  </p>
                )}
              </div>

              {/* Debug Info - Remove in production */}
              {/* {process.env.NODE_ENV === 'development' && (
                <div className="p-3 bg-gray-100 rounded-lg text-xs">
                  <p>
                    <strong>Form State:</strong>
                  </p>
                  <p>Passwords Match: {passwordsMatch ? '✅' : '❌'}</p>
                  <p>Email Error: {emailError ? '❌' : '✅'}</p>
                  <p>Checking Email: {isCheckingEmail ? '⏳' : '✅'}</p>
                  <p>Form Valid: {form.formState.isValid ? '✅' : '❌'}</p>
                  <p>Form Dirty: {form.formState.isDirty ? '✅' : '❌'}</p>
                  <p>
                    Button Disabled:{' '}
                    {authState.isLoading ||
                    !passwordsMatch ||
                    !!emailError ||
                    isCheckingEmail
                      ? '❌'
                      : '✅'}
                  </p>
                </div>
              )} */}

              <Button
                type="submit"
                disabled={
                  authState.isLoading ||
                  !passwordsMatch ||
                  !!emailError ||
                  isCheckingEmail
                }
                onClick={() => {
                  console.log('Submit button clicked');
                  console.log('Form state:', {
                    isValid: form.formState.isValid,
                    isDirty: form.formState.isDirty,
                    errors: form.formState.errors,
                    passwordsMatch,
                    emailError,
                    isCheckingEmail
                  });
                }}
                className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 text-white text-sm sm:text-base font-semibold rounded-lg">
                {authState.isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  `Create ${currentRole?.label} Account`
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Button
                  variant="link"
                  onClick={onLogin}
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto">
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
