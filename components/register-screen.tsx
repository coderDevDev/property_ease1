'use client';

import type React from 'react';

import { useState } from 'react';
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

export function RegisterScreen({
  onBack,
  onLogin,
  selectedRole
}: RegisterScreenProps) {
  const { authState, register, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: selectedRole,
    // Owner specific
    companyName: '',
    businessLicense: '',
    // Tenant specific
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (authState.error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (!acceptTerms) {
      return;
    }

    const result = await register(formData);

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

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid =
    formData.email &&
    formData.password &&
    formData.firstName &&
    formData.lastName &&
    formData.phone &&
    passwordsMatch &&
    acceptTerms;

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

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
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
                    value={formData.firstName}
                    onChange={e =>
                      handleInputChange('firstName', e.target.value)
                    }
                    placeholder="John"
                    required
                    className="mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                    disabled={authState.isLoading}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="lastName"
                    className="text-property-text-primary font-medium text-sm lg:text-base">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e =>
                      handleInputChange('lastName', e.target.value)
                    }
                    placeholder="Doe"
                    required
                    className="mt-1 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                    disabled={authState.isLoading}
                  />
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
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    required
                    className="pl-10 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                    disabled={authState.isLoading}
                  />
                </div>
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
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    placeholder="+63 912 345 6789"
                    required
                    className="pl-10 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
                    disabled={authState.isLoading}
                  />
                </div>
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
                      value={formData.companyName}
                      onChange={e =>
                        handleInputChange('companyName', e.target.value)
                      }
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
                      value={formData.businessLicense}
                      onChange={e =>
                        handleInputChange('businessLicense', e.target.value)
                      }
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
                    value={formData.emergencyContactName}
                    onChange={e =>
                      handleInputChange('emergencyContactName', e.target.value)
                    }
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
                      value={formData.emergencyContactPhone}
                      onChange={e =>
                        handleInputChange(
                          'emergencyContactPhone',
                          e.target.value
                        )
                      }
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
                      value={formData.emergencyContactRelationship}
                      onChange={e =>
                        handleInputChange(
                          'emergencyContactRelationship',
                          e.target.value
                        )
                      }
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
                      value={formData.password}
                      onChange={e =>
                        handleInputChange('password', e.target.value)
                      }
                      placeholder="Create a strong password"
                      required
                      className="pr-10 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base"
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
                      value={formData.confirmPassword}
                      onChange={e =>
                        handleInputChange('confirmPassword', e.target.value)
                      }
                      placeholder="Confirm your password"
                      required
                      className={`pr-10 border-gray-300 focus:border-property-action h-12 lg:h-14 text-base ${
                        formData.confirmPassword && !passwordsMatch
                          ? 'border-red-300'
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
                  {formData.confirmPassword && !passwordsMatch && (
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
                checked={acceptTerms}
                onCheckedChange={checked => setAcceptTerms(checked as boolean)}
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
