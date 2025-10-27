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
  Mail,
  CheckCircle,
  AlertCircle,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

// Zod schema for forgot password form validation
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function ForgotPassword({ onBack, onSuccess }: ForgotPasswordProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        toast.success('Password reset link sent!', {
          description: result.message,
          duration: 5000,
          style: {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534'
          }
        });

        // Show development reset link if available
        if (result.resetLink && process.env.NODE_ENV === 'development') {
          console.log('Development reset link:', result.resetLink);
          toast.info('Development Mode', {
            description: `Reset link: ${result.resetLink}`,
            duration: 10000
          });
        }
      } else {
        toast.error('Failed to send reset link', {
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
      console.error('Forgot password error:', error);
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="absolute left-4 text-blue-600 hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                    Check Your Email
                  </h1>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Password Reset Link Sent
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    We've sent a password reset link to{' '}
                    <span className="font-medium text-blue-600">
                      {form.getValues('email')}
                    </span>
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        What's next?
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Check your email inbox</li>
                        <li>• Click the reset link in the email</li>
                        <li>• Create a new password</li>
                        <li>• Sign in with your new password</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={onBack}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
                    Back to Sign In
                  </Button>

                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      form.reset();
                    }}
                    variant="outline"
                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
                    Send Another Link
                  </Button>
                </div>
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
              Reset your password
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Forgot your password?
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">
                No worries! Enter your email address and we'll send you a link
                to reset your password.
              </p>
            </div>

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
                    placeholder="Enter your email address"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 text-white text-sm sm:text-base font-semibold rounded-lg">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Button
                  variant="link"
                  onClick={onBack}
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


