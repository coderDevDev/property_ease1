'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  Users,
  Building2,
  DollarSign,
  Wrench,
  Settings,
  Shield,
  FileText,
  Bell,
  Database,
  Activity,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthAPI } from '@/lib/api/auth';

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authState } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      route: '/dashboard',
      icon: BarChart3,
      description: 'System overview and analytics'
    },
    {
      name: 'Users',
      route: '/dashboard/users',
      icon: Users,
      description: 'Manage all user accounts'
    },
    {
      name: 'Properties',
      route: '/dashboard/properties',
      icon: Building2,
      description: 'Property oversight and management'
    },
    {
      name: 'Payments',
      route: '/dashboard/payments',
      icon: DollarSign,
      description: 'Payment tracking and analytics'
    },
    {
      name: 'Maintenance',
      route: '/dashboard/maintenance',
      icon: Wrench,
      description: 'System-wide maintenance requests'
    },
    // {
    //   name: 'Content Moderation',
    //   route: '/dashboard/content',
    //   icon: Shield,
    //   description: 'Review and moderate content'
    // },
    {
      name: 'Analytics',
      route: '/dashboard/analytics',
      icon: BarChart3,
      description: 'System analytics and reports'
    },
    // {
    //   name: 'System Health',
    //   route: '/dashboard/health',
    //   icon: Activity,
    //   description: 'Monitor system performance'
    // },
    {
      name: 'Settings',
      route: '/dashboard/settings',
      icon: Settings,
      description: 'System configuration'
    }
  ];

  const handleSidebarItemClick = (route: string) => {
    router.push(route);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await AuthAPI.logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (route: string) => {
    const normalize = (path: string) => path.replace(/\/+$/, '');
    return normalize(pathname) === normalize(route);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PropertyEase</h1>
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-700 text-xs">
              Admin Panel
            </Badge>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start p-0 h-auto hover:bg-gray-50">
              <div className="flex items-center gap-3 w-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={authState.user?.avatar}
                    alt={authState.user?.firstName}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {authState.user?.firstName?.[0]}
                    {authState.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {authState.user?.firstName} {authState.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {authState.user?.email}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Administrator</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleSidebarItemClick('/dashboard/profile')}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSidebarItemClick('/dashboard/security')}>
              Security Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map(item => {
          const Icon = item.icon;
          const active = isActive(item.route);

          return (
            <button
              key={item.route}
              onClick={() => handleSidebarItemClick(item.route)}
              className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                active
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-5 w-5 ${
                    active
                      ? 'text-blue-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium ${
                      active ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-gray-200">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">
                  System Status
                </div>
                <div className="text-xs text-blue-600">
                  All systems operational
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg">
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[90vw]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block w-80 ${className}`}>
        {sidebarContent}
      </div>
    </>
  );
}
