'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TenantAPI } from '@/lib/api/tenant';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Home,
  Building,
  User,
  FileCheck,
  ScrollText,
  CreditCard,
  Wrench,
  MessageSquare,
  FileText,
  Bell,
  Users,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Calendar,
  Megaphone
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  count?: number;
  subItems?: Array<{
    id: string;
    label: string;
    href: string;
    count?: number;
  }>;
}

export function TenantSidebar() {
  const { authState, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Dashboard statistics
  const [stats, setStats] = useState({
    notifications: 0,
    maintenanceRequests: 0,
    messages: 0,
    documentsCount: 0,
    upcomingPayment: null as Date | null,
    announcements: 0
  });

  useEffect(() => {
    // Fetch real-time statistics
    const fetchStats = async () => {
      if (!authState.user?.id) return;

      try {
        const result = await TenantAPI.getDashboardStats(authState.user.id);

        if (result.success && result.data) {
          const dashboardData = result.data;
          setStats({
            notifications: dashboardData.notifications.length,
            maintenanceRequests: dashboardData.quickStats.activeRequests,
            messages: dashboardData.quickStats.unreadMessages,
            documentsCount: dashboardData.quickStats.documentsCount,
            upcomingPayment:
              dashboardData.upcomingPayments.length > 0
                ? dashboardData.upcomingPayments[0].dueDate
                : null,
            announcements: 0 // TODO: Add announcements to TenantAPI if needed
          });
        }
      } catch (error) {
        console.error('Failed to fetch tenant stats:', error);
      }
    };

    fetchStats();
    // Set up polling for real-time updates
    const interval = setInterval(fetchStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [authState.user?.id]);

  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/tenant/dashboard'
    },
    {
      id: 'properties',
      label: 'Find Properties',
      icon: Building,
      href: '/tenant/dashboard/properties'
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      href: '/tenant/dashboard/profile'
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileCheck,
      href: '/tenant/dashboard/applications'
    },
    {
      id: 'lease',
      label: 'Lease Agreement',
      icon: ScrollText,
      href: '/tenant/dashboard/lease'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      href: '/tenant/dashboard/payments',
      count: stats.upcomingPayment ? 1 : 0
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      href: '/tenant/dashboard/maintenance',
      count: stats.maintenanceRequests
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      href: '/tenant/dashboard/messages',
      count: stats.messages
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      href: '/tenant/dashboard/documents',
      count: stats.documentsCount
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      href: '/tenant/dashboard/notifications',
      count: stats.notifications
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Megaphone,
      href: '/tenant/dashboard/announcements',
      count: stats.announcements
    },
    {
      id: 'support',
      label: 'Support Center',
      icon: HelpCircle,
      href: '/tenant/dashboard/support'
    }
  ];

  const handleItemClick = (item: SidebarItem) => {
    if (item.subItems) {
      toggleExpanded(item.id);
    } else {
      router.push(item.href);
      setIsMobileOpen(false);
    }
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md shadow-xl border-r border-blue-100">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">PropertyEase</h1>
            <p className="text-sm text-blue-600 font-medium">Tenant Portal</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setIsMobileOpen(false)}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 ring-2 ring-blue-100">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold">
              {authState.user?.firstName?.[0]}
              {authState.user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {authState.user?.firstName} {authState.user?.lastName}
            </p>
            <p className="text-xs text-blue-600 truncate">
              {authState.user?.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Active Tenant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-6 border-b border-blue-100">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-blue-700">
                {stats.messages}
              </div>
              <div className="text-xs text-blue-600">New Messages</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-orange-700">
                {stats.maintenanceRequests}
              </div>
              <div className="text-xs text-orange-600">Maintenance</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sidebarItems.map(item => {
          const isActive = pathname.startsWith(item.href);
          const isExpanded = expandedItems.includes(item.id);

          return (
            <div key={item.id}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start h-12 px-4 transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
                onClick={() => handleItemClick(item)}>
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="flex-1 text-left text-sm font-medium">
                  {item.label}
                </span>
                {item.count && item.count > 0 && (
                  <Badge
                    className={`ml-2 h-5 px-2 text-xs ${
                      isActive
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}>
                    {item.count}
                  </Badge>
                )}
                {item.subItems && (
                  <div className="ml-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                )}
              </Button>

              {/* Sub Items */}
              {item.subItems && isExpanded && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.subItems.map(subItem => {
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Button
                        key={subItem.id}
                        variant={isSubActive ? 'default' : 'ghost'}
                        size="sm"
                        className={`w-full justify-start h-10 px-3 transition-all duration-200 ${
                          isSubActive
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                        onClick={() => {
                          router.push(subItem.href);
                          setIsMobileOpen(false);
                        }}>
                        <span className="flex-1 text-left text-sm">
                          {subItem.label}
                        </span>
                        {subItem.count && subItem.count > 0 && (
                          <Badge
                            className={`ml-2 h-4 px-1.5 text-xs ${
                              isSubActive
                                ? 'bg-white/20 text-white hover:bg-white/30'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}>
                            {subItem.count}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Alert */}
      {stats.upcomingPayment && (
        <div className="p-4 border-t border-blue-100">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">
                  Payment Due Soon
                </span>
              </div>
              <p className="text-xs text-orange-700 mb-3">
                Rent payment due on{' '}
                {stats.upcomingPayment?.toLocaleDateString()}
              </p>
              <Button
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  router.push('/tenant/dashboard/payments');
                  setIsMobileOpen(false);
                }}>
                Pay Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-blue-100">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 px-4 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
          onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Sign Out</span>
        </Button>
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
          onClick={() => setIsMobileOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-80 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {sidebarContent}
      </div>
    </>
  );
}
