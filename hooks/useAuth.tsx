'use client';

import React from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import type {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData
} from '@/types/auth';
import { mockUsers } from '@/data/authData';

const AuthContext = createContext<{
  authState: AuthState;
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; message: string }>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (
    data: ForgotPasswordData
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  clearError: () => void;
} | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem('propertyease_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
      } catch (error) {
        localStorage.removeItem('propertyease_user');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; message: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const user = mockUsers.find(
      u => u.email === credentials.email && u.role === credentials.role
    );

    if (!user) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid email or role. Please check your credentials.'
      }));
      return { success: false, message: 'Invalid email or role' };
    }

    // In real app, verify password here
    const updatedUser = { ...user, lastLogin: new Date().toISOString() };

    localStorage.setItem('propertyease_user', JSON.stringify(updatedUser));
    setAuthState({
      user: updatedUser,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });

    return { success: true, message: 'Login successful' };
  };

  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; message: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === data.email);
    if (existingUser) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'An account with this email already exists.'
      }));
      return { success: false, message: 'Email already exists' };
    }

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: data.role,
      isVerified: false,
      createdAt: new Date().toISOString(),
      ...(data.role === 'owner' && {
        companyName: data.companyName,
        businessLicense: data.businessLicense
      }),
      ...(data.role === 'tenant' && {
        emergencyContact: {
          name: data.emergencyContactName || '',
          phone: data.emergencyContactPhone || '',
          relationship: data.emergencyContactRelationship || ''
        }
      })
    };

    mockUsers.push(newUser);
    localStorage.setItem('propertyease_user', JSON.stringify(newUser));

    setAuthState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });

    return { success: true, message: 'Registration successful' };
  };

  const forgotPassword = async (
    data: ForgotPasswordData
  ): Promise<{ success: boolean; message: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const user = mockUsers.find(
      u => u.email === data.email && u.role === data.role
    );

    setAuthState(prev => ({ ...prev, isLoading: false }));

    if (!user) {
      return {
        success: false,
        message: 'No account found with this email and role'
      };
    }

    return {
      success: true,
      message: 'Password reset instructions sent to your email'
    };
  };

  const logout = () => {
    localStorage.removeItem('propertyease_user');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        forgotPassword,
        logout,
        clearError
      }}>
      {children}
    </AuthContext.Provider>
  );
}
