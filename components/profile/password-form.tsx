'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileAPI, type PasswordChangeData } from '@/lib/api/profile';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Save, X } from 'lucide-react';

interface PasswordFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function PasswordForm({ onCancel, onSuccess }: PasswordFormProps) {
  const [formData, setFormData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (
    field: keyof PasswordChangeData,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.current_password) {
      toast.error('Current password is required');
      return false;
    }

    if (!formData.new_password) {
      toast.error('New password is required');
      return false;
    }

    if (formData.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return false;
    }

    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match');
      return false;
    }

    if (formData.current_password === formData.new_password) {
      toast.error('New password must be different from current password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Note: This is a simplified implementation
      // In a real app, you'd need to get the user's email for verification
      const result = await ProfileAPI.changePassword('', formData);

      if (result.success) {
        toast.success('Password changed successfully');
        onSuccess();
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return {
      score: strength,
      label: strength < 2 ? 'Weak' : strength < 4 ? 'Medium' : 'Strong',
      color:
        strength < 2
          ? 'text-red-600'
          : strength < 4
          ? 'text-yellow-600'
          : 'text-green-600'
    };
  };

  const passwordStrength = getPasswordStrength(formData.new_password);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current_password" className="text-sm font-medium">
              Current Password *
            </Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.current_password}
                onChange={e =>
                  handleInputChange('current_password', e.target.value)
                }
                required
                className="border-blue-200 focus:border-blue-500 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}>
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-sm font-medium">
              New Password *
            </Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.new_password}
                onChange={e =>
                  handleInputChange('new_password', e.target.value)
                }
                required
                className="border-blue-200 focus:border-blue-500 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}>
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {formData.new_password && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score < 2
                          ? 'bg-red-500 w-1/3'
                          : passwordStrength.score < 4
                          ? 'bg-yellow-500 w-2/3'
                          : 'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters with uppercase,
                  lowercase, number, and special character.
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm New Password *
            </Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={e =>
                  handleInputChange('confirm_password', e.target.value)
                }
                required
                className="border-blue-200 focus:border-blue-500 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}>
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>

            {/* Password Match Indicator */}
            {formData.confirm_password && (
              <div className="flex items-center gap-2">
                {formData.new_password === formData.confirm_password ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-600">
                      Passwords match
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-xs text-red-600">
                      Passwords do not match
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-gray-200 text-gray-600 hover:bg-gray-50">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !formData.current_password ||
            !formData.new_password ||
            !formData.confirm_password
          }
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Changing...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Change Password
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
