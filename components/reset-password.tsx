'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

// Zod schema for reset password form validation
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function ResetPassword({
  token,
  onSuccess,
  onBack
}: ResetPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');
  const passwordsMatch = password === confirmPassword;

  const onSubmit = async (data: ResetPasswordFormData) => {
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

    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          password: data.password
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        toast.success('Password reset successfully!', {
          description: result.message,
          duration: 5000,
          style: {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534'
          }
        });
      } else {
        toast.error('Failed to reset password', {
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
      console.error('Reset password error:', error);
      toast.error('An error occurred', {
        description: 'Please try again later.',
        duration: 5000,
        style: {
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-3 sm:p-4 lg:p-6">
        <div className="w-full max-w-md">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                    Password Reset
                  </h1>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Password Reset Successful!
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Your password has been successfully updated. You can now
                    sign in with your new password.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-green-900 mb-1">
                        What's next?
                      </p>
                      <ul className="text-xs text-green-700 space-y-1">
                        <li>• Your password has been updated</li>
                        <li>• You can now sign in with your new password</li>
                        <li>• Keep your password secure and don't share it</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={onSuccess}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
                  Continue to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-md">
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
                  PropertEase
                </h1>
              </div>
            </div>
            <p className="text-blue-600/80 text-sm sm:text-base font-medium">
              Create new password
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Set your new password
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Choose a strong password that you haven't used before.
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-700 font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
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
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
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
                {form.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
                {!passwordsMatch && confirmPassword && (
                  <p className="text-red-500 text-sm">Passwords do not match</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Password Requirements:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase letter (A-Z)</li>
                      <li>• Contains lowercase letter (a-z)</li>
                      <li>• Contains number (0-9)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !passwordsMatch}
                className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 text-white text-sm sm:text-base font-semibold rounded-lg">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


