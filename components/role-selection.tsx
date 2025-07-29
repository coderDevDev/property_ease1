'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building,
  Home,
  Users,
  ArrowRight,
  Check,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelect: (role: 'owner' | 'tenant') => void;
  onBack: () => void;
}

export function RoleSelection({ onRoleSelect, onBack }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'owner' | 'tenant' | null>(
    null
  );

  const roles = [
    {
      id: 'owner' as const,
      title: 'Property Owner',
      subtitle: 'Manager',
      description: 'Manage properties, tenants, and lease agreements',
      icon: Building,
      features: [
        'Add and manage properties',
        'Track rental income',
        'Manage tenant profiles',
        'Handle maintenance requests',
        'Generate reports'
      ],
      gradient: 'from-blue-500 to-purple-600',
      bgGradient: 'from-blue-50 to-purple-50',
      iconColor: 'text-blue-500',
      glowColor: 'shadow-blue-500/25'
    },
    {
      id: 'tenant' as const,
      title: 'Tenant',
      subtitle: 'Resident',
      description: 'Access rental information and communicate with managers',
      icon: Home,
      features: [
        'View lease information',
        'Submit maintenance requests',
        'Pay rent securely online',
        'Receive notifications',
        'Access documents'
      ],
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      iconColor: 'text-purple-500',
      glowColor: 'shadow-purple-500/25'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200/30 rounded-full blur-2xl" />
        {/* Desktop decorations */}
        <div className="hidden lg:block absolute top-20 right-20 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="hidden lg:block absolute bottom-20 left-20 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col relative z-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8 pt-8 lg:pt-12">
          <div className="relative w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-75" />
            <div className="relative w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
              <Users className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 animate-bounce" />
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Choose Your Role
          </h1>
          <p className="text-gray-600 text-sm lg:text-lg">
            Select how you'll be using PropertyEase
          </p>
        </div>

        {/* Role Cards - Mobile Layout */}
        <div className="flex-1 space-y-4 mb-6 lg:hidden">
          {roles.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? `bg-gradient-to-br ${role.bgGradient} border-2 border-transparent bg-clip-padding shadow-xl ${role.glowColor}`
                    : 'bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-gray-300 hover:shadow-lg active:scale-95'
                }`}
                onClick={() => setSelectedRole(role.id)}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      {isSelected && (
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${role.gradient} rounded-xl blur-md opacity-75`}
                        />
                      )}
                      <div
                        className={`relative w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          isSelected
                            ? `bg-gradient-to-r ${role.gradient}`
                            : 'bg-gray-100'
                        }`}>
                        <Icon
                          className={`w-6 h-6 ${
                            isSelected ? 'text-white' : role.iconColor
                          }`}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {role.title}
                        </h3>
                        <p className="text-sm font-medium text-gray-600">
                          {role.subtitle}
                        </p>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {role.description}
                      </p>

                      <div className="space-y-2">
                        {role.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected
                                  ? `bg-gradient-to-r ${role.gradient}`
                                  : 'bg-gray-400'
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isSelected
                                  ? 'text-gray-800 font-medium'
                                  : 'text-gray-600'
                              }`}>
                              {feature}
                            </span>
                          </div>
                        ))}
                        {role.features.length > 3 && (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected
                                  ? `bg-gradient-to-r ${role.gradient}`
                                  : 'bg-gray-400'
                              }`}
                            />
                            <span
                              className={`text-xs ${
                                isSelected
                                  ? 'text-gray-800 font-medium'
                                  : 'text-gray-600'
                              }`}>
                              +{role.features.length - 3} more features
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role Cards - Desktop Layout */}
        <div className="hidden lg:flex flex-1 gap-6 mb-8">
          {roles.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <Card
                key={role.id}
                className={`flex-1 cursor-pointer transition-all duration-500 hover:scale-105 ${
                  isSelected
                    ? `bg-gradient-to-br ${role.bgGradient} border-2 border-transparent bg-clip-padding shadow-2xl ${role.glowColor}`
                    : 'bg-white/90 backdrop-blur-sm border border-gray-200 hover:border-gray-300 hover:shadow-xl'
                }`}
                onClick={() => setSelectedRole(role.id)}>
                <CardContent className="p-8 h-full flex flex-col">
                  {/* Icon and Title Section */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block mb-4">
                      {isSelected && (
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${role.gradient} rounded-2xl blur-lg opacity-75`}
                        />
                      )}
                      <div
                        className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${
                          isSelected
                            ? `bg-gradient-to-r ${role.gradient}`
                            : 'bg-gray-100'
                        }`}>
                        <Icon
                          className={`w-10 h-10 ${
                            isSelected ? 'text-white' : role.iconColor
                          }`}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {role.title}
                    </h3>
                    <p className="text-lg font-medium text-gray-600 mb-3">
                      {role.subtitle}
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  {/* Features Section */}
                  {/* <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                      Key Features:
                    </h4>
                    <div className="space-y-3">
                      {role.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              isSelected
                                ? `bg-gradient-to-r ${role.gradient}`
                                : 'bg-gray-400'
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              isSelected
                                ? 'text-gray-800 font-medium'
                                : 'text-gray-600'
                            }`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div> */}

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="mt-6 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Selected
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-safe lg:pb-8 lg:justify-center lg:gap-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 lg:flex-none lg:px-10 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:shadow-lg hover:border-gray-400 transition-all duration-300 h-12 lg:h-16 lg:text-lg lg:font-semibold lg:rounded-xl">
            <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => {
              if (selectedRole) {
                // Check if we're on a specific route and navigate accordingly
                const currentPath = window.location.pathname;
                if (currentPath === '/register') {
                  onRoleSelect(selectedRole); // This will navigate to /register?role=...
                } else if (currentPath === '/forgot-password') {
                  onRoleSelect(selectedRole); // This will navigate to /forgot-password?role=...
                } else {
                  onRoleSelect(selectedRole); // Default to login
                }
              }
            }}
            disabled={!selectedRole}
            className={`flex-1 lg:flex-none lg:px-16 text-white font-medium shadow-lg transition-all duration-300 h-12 lg:h-16 lg:text-lg lg:font-semibold lg:rounded-xl ${
              selectedRole
                ? `bg-gradient-to-r ${
                    roles.find(r => r.id === selectedRole)?.gradient
                  } hover:shadow-2xl hover:scale-105 active:scale-95 lg:hover:shadow-3xl`
                : 'bg-gray-400 lg:cursor-not-allowed'
            }`}>
            Continue
            <ArrowRight className="w-4 h-4 lg:w-6 lg:h-6 ml-2" />
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-4 pb-4 lg:pb-8">
          <p className="text-xs lg:text-sm text-gray-500">
            You can change your role later in settings
          </p>
        </div>
      </div>
    </div>
  );
}
