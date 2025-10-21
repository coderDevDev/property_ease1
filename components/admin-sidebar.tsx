'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BarChart3,
  Users,
  Building2,
  Wrench,
  Settings,
  Shield,
  FileText,
  Bell,
  Database,
  Activity,
  LogOut,
  ChevronRight,
  Menu,
  X,
  PhilippinePeso,
  Home,
  MessageSquare,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminAPI } from '@/lib/api/admin';

interface AdminSidebarProps {
  className?: string;
}

interface AdminStats {
  users: { total: number; active: number; newThisMonth: number };
  properties: { total: number; active: number };
  payments: { thisMonthAmount: number; pending: number };
  tenants: { active: number; pending: number };
  maintenance: { total: number };
}

interface SidebarItem {
  icon: any;
  label: string;
  route: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  section: string;
  count?: number;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authState, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    users: { total: 0, active: 0, newThisMonth: 0 },
    properties: { total: 0, active: 0 },
    payments: { thisMonthAmount: 0, pending: 0 },
    tenants: { active: 0, pending: 0 },
    maintenance: { total: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load admin stats
  useEffect(() => {
    const loadAdminStats = async () => {
      try {
        setIsLoading(true);
        const result = await AdminAPI.getSystemStats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminStats();
  }, []);

  // Define sidebar items with sections
  const sidebarItems: SidebarItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      route: '/dashboard',
      description: 'System overview',
      section: 'main'
    },
    {
      icon: Users,
      label: 'Users',
      route: '/dashboard/users',
      description: 'Manage all accounts',
      badge: isLoading ? '...' : `${stats.users.total} total`,
      section: 'management'
    },
    {
      icon: Building2,
      label: 'Properties',
      route: '/dashboard/properties',
      description: 'Property oversight',
      badge: isLoading ? '...' : `${stats.properties.active} active`,
      section: 'management'
    },
    {
      icon: PhilippinePeso,
      label: 'Payments',
      route: '/dashboard/payments',
      description: 'Payment monitoring',
      badge: isLoading
        ? '...'
        : stats.payments.pending > 0
        ? `${stats.payments.pending} pending`
        : 'All processed',
      badgeColor:
        stats.payments.pending > 0
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-green-100 text-green-700',
      section: 'financial'
    },
    {
      icon: Wrench,
      label: 'Maintenance',
      route: '/dashboard/maintenance',
      description: 'Service requests',
      section: 'operations'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      route: '/dashboard/analytics',
      description: 'System insights',
      section: 'reports'
    },
    {
      icon: Settings,
      label: 'Settings',
      route: '/dashboard/settings',
      description: 'Configuration',
      section: 'system'
    }
  ];

  const handleSidebarItemClick = (route: string) => {
    router.push(route);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (route: string) => {
    const normalize = (path: string) => path.replace(/\/+$/, '');
    return normalize(pathname) === normalize(route);
  };

  // Group sidebar items by section
  const sectionConfig = {
    main: {
      title: 'Main',
      items: sidebarItems.filter(item => item.section === 'main')
    },
    management: {
      title: 'Management',
      items: sidebarItems.filter(item => item.section === 'management')
    },
    financial: {
      title: 'Financial',
      items: sidebarItems.filter(item => item.section === 'financial')
    },
    operations: {
      title: 'Operations',
      items: sidebarItems.filter(item => item.section === 'operations')
    },
    reports: {
      title: 'Reports',
      items: sidebarItems.filter(item => item.section === 'reports')
    },
    system: {
      title: 'System',
      items: sidebarItems.filter(item => item.section === 'system')
    }
  };

  const renderSidebarItem = (item: SidebarItem, index: number) => (
    <button
      key={`${item.section}-${index}`}
      onClick={() => handleSidebarItemClick(item.route)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover:bg-blue-50 hover:scale-[1.02] ${
        isActive(item.route)
          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm'
          : 'text-gray-700 hover:text-blue-600'
      }`}>
      <item.icon
        className={`w-5 h-5 transition-colors ${
          isActive(item.route) ? 'text-blue-600' : 'text-gray-500'
        }`}
      />
      <div className="flex-1 text-left">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{item.label}</span>
          {(item.badge || item.count !== undefined) && (
            <Badge
              className={`text-xs px-2 py-0.5 transition-all ${
                item.badgeColor || 'bg-blue-100 text-blue-700'
              }`}>
              {item.badge || item.count}
            </Badge>
          )}
          {isActive(item.route) && (
            <ChevronRight className="w-4 h-4 text-blue-600" />
          )}
        </div>
        <p
          className={`text-xs mt-0.5 transition-colors ${
            isActive(item.route) ? 'text-blue-600' : 'text-gray-500'
          }`}>
          {item.description}
        </p>
      </div>
    </button>
  );

  const sidebarContent = (
    <div className="flex flex-col w-full h-full bg-gradient-to-b from-white to-blue-50/30 shadow-2xl backdrop-blur-sm border-r border-blue-100">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                PropertEase
              </h1>
              <p className="text-blue-600/70 text-sm font-medium">
                Admin Portal
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <nav className="space-y-6">
          {Object.entries(sectionConfig).map(
            ([sectionKey, section]) =>
              section.items.length > 0 && (
                <div key={sectionKey} className="space-y-2">
                  <h3 className="text-xs font-bold text-blue-700/80 uppercase tracking-wider px-4 mb-3 flex items-center gap-2">
                    {section.title}
                    {sectionKey === 'main' && <Home className="w-3 h-3" />}
                    {sectionKey === 'management' && <Users className="w-3 h-3" />}
                    {sectionKey === 'financial' && <PhilippinePeso className="w-3 h-3" />}
                    {sectionKey === 'operations' && <Wrench className="w-3 h-3" />}
                    {sectionKey === 'reports' && <BarChart3 className="w-3 h-3" />}
                    {sectionKey === 'system' && <Settings className="w-3 h-3" />}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, index) =>
                      renderSidebarItem(item, index)
                    )}
                  </div>
                </div>
              )
          )}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-blue-100">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-900">
                  System Status
                </div>
                <div className="text-xs text-green-700">
                  All systems operational
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-blue-100 bg-gradient-to-r from-blue-50/50 to-white">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm">
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
          onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-72 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-80 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {sidebarContent}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </>
  );
}
