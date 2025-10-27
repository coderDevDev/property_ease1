'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  Building,
  Users,
  Wrench,
  Megaphone,
  History,
  MessageSquare,
  Bell,
  Settings,
  User,
  LogOut,
  ChevronRight,
  X,
  FileText,
  BarChart3,
  Calendar,
  ClipboardList,
  PhilippinePeso,
  Menu,
  FileCheck,
  ScrollText,
  CreditCard,
  HelpCircle,
  ChevronDown,
  Shield,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { PropertiesAPI } from '@/lib/api/properties';
import { TenantsAPI } from '@/lib/api/tenants';
import { PaymentsAPI } from '@/lib/api/payments';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { MessagesAPI } from '@/lib/api/messages';
import { NotificationsAPI } from '@/lib/api/notifications';
import { TenantAPI } from '@/lib/api/tenant';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  properties: { total: number; active: number };
  tenants: { total: number; active: number };
  maintenance: { pending: number; total: number };
  payments: { pending: number; overdue: number };
  messages: { unread: number };
  notifications: { unread: number };
  applications: { pending: number; total: number };
  documents: { count: number };
  upcomingPayment: Date | null;
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
  subItems?: Array<{
    id: string;
    label: string;
    href: string;
    count?: number;
  }>;
}

interface SharedSidebarProps {
  role: 'owner' | 'tenant';
}

export function SharedSidebar({ role }: SharedSidebarProps) {
  const { authState, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    properties: { total: 0, active: 0 },
    tenants: { total: 0, active: 0 },
    maintenance: { pending: 0, total: 0 },
    payments: { pending: 0, overdue: 0 },
    messages: { unread: 0 },
    notifications: { unread: 0 },
    applications: { pending: 0, total: 0 },
    documents: { count: 0 },
    upcomingPayment: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard statistics based on role
  useEffect(() => {
    const loadDashboardStats = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);

        if (role === 'owner') {
          // Owner statistics
          const [
            propertiesResult,
            tenantsResult,
            maintenanceResult,
            paymentsResult,
            messagesResult,
            notificationsResult,
            applicationsResult
          ] = await Promise.all([
            PropertiesAPI.getProperties(authState.user.id),
            TenantsAPI.getTenants(authState.user.id),
            MaintenanceAPI.getMaintenanceRequests(),
            PaymentsAPI.getPayments(),
            MessagesAPI.getUnreadMessagesCount(authState.user.id),
            NotificationsAPI.getNotificationStats(authState.user.id),
            // Fetch applications for owner's properties
            (async () => {
              if (!authState.user?.id) return { success: true, data: [] };

              const { data: properties } = await supabase
                .from('properties')
                .select('id')
                .eq('owner_id', authState.user.id);

              if (!properties) return { success: true, data: [] };

              const propertyIds = properties.map((p: { id: string }) => p.id);
              const { data: applications } = await supabase
                .from('rental_applications')
                .select('*')
                .in('property_id', propertyIds);

              return { success: true, data: applications || [] };
            })()
          ]);

          const properties = propertiesResult.success
            ? propertiesResult.data
            : [];
          const tenants = tenantsResult.success ? tenantsResult.data : [];
          const maintenance = maintenanceResult.success
            ? maintenanceResult.data
            : [];
          const payments = paymentsResult.success ? paymentsResult.data : [];

          setStats({
            properties: {
              total: properties.length,
              active: properties.filter((p: any) => p.status === 'active')
                .length
            },
            tenants: {
              total: tenants.length,
              active: tenants.filter((t: any) => t.status === 'active').length
            },
            maintenance: {
              pending: maintenance.filter(
                (m: any) => m.status === 'pending' || m.status === 'in_progress'
              ).length,
              total: maintenance.length
            },
            payments: {
              pending:
                payments?.filter((p: any) => p.payment_status === 'pending')
                  .length || 0,
              overdue:
                payments?.filter(
                  (p: any) =>
                    p.payment_status === 'failed' ||
                    (p.payment_status === 'pending' &&
                      new Date(p.due_date) < new Date())
                ).length || 0
            },
            messages: {
              unread: messagesResult.success
                ? (messagesResult.data as any)?.count || 0
                : 0
            },
            notifications: {
              unread: notificationsResult.success
                ? (notificationsResult.data as any)?.count || 0
                : 0
            },
            applications: {
              total: applicationsResult.success
                ? applicationsResult.data.length
                : 0,
              pending: applicationsResult.success
                ? applicationsResult.data.filter(
                    (app: any) => app.status === 'pending'
                  ).length
                : 0
            },
            documents: { count: 0 },
            upcomingPayment: null
          });
        } else {
          // Tenant statistics
          const result = await TenantAPI.getDashboardStats(authState.user.id);

          if (result.success && result.data) {
            const dashboardData = result.data;
            setStats({
              properties: { total: 0, active: 0 },
              tenants: { total: 0, active: 0 },
              maintenance: {
                pending: dashboardData.quickStats.activeRequests,
                total: dashboardData.quickStats.activeRequests
              },
              payments: { pending: 0, overdue: 0 },
              messages: { unread: dashboardData.quickStats.unreadMessages },
              notifications: { unread: dashboardData.notifications.length },
              applications: { pending: 0, total: 0 },
              documents: { count: dashboardData.quickStats.documentsCount },
              upcomingPayment:
                dashboardData.upcomingPayments.length > 0
                  ? dashboardData.upcomingPayments[0].dueDate
                  : null
            });
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardStats();
  }, [authState.user?.id, role]);

  // Define sidebar items based on role
  const getSidebarItems = (): SidebarItem[] => {
    if (role === 'owner') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          route: '/owner/dashboard',
          description: 'Overview & analytics',
          section: 'main'
        },
        {
          icon: Building,
          label: 'Properties',
          route: '/owner/dashboard/properties',
          description: 'Manage your properties',
          badge: isLoading ? '...' : `${stats.properties.active} active`,
          section: 'property'
        },
        {
          icon: Users,
          label: 'Tenants',
          route: '/owner/dashboard/tenants',
          description: 'Tenant management',
          badge: isLoading ? '...' : `${stats.tenants.active} active`,
          section: 'property'
        },
        {
          icon: ClipboardList,
          label: 'Applications',
          route: '/owner/dashboard/applications',
          description: 'Rental applications',
          badge: isLoading
            ? '...'
            : stats.applications.pending > 0
            ? `${stats.applications.pending} pending`
            : 'No pending',
          badgeColor:
            stats.applications.pending > 0
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700',
          section: 'property'
        },
        {
          icon: Wrench,
          label: 'Maintenance',
          route: '/owner/dashboard/maintenance',
          description: 'Repairs & requests',
          badge: isLoading
            ? '...'
            : stats.maintenance.pending > 0
            ? `${stats.maintenance.pending} pending`
            : 'No pending',
          badgeColor:
            stats.maintenance.pending > 0
              ? 'bg-orange-100 text-orange-700'
              : 'bg-green-100 text-green-700',
          section: 'operations'
        },
        {
          icon: PhilippinePeso,
          label: 'Payments',
          route: '/owner/dashboard/payments',
          description: 'Payment tracking',
          badge: isLoading
            ? '...'
            : stats.payments.overdue > 0
            ? `${stats.payments.overdue} overdue`
            : 'Up to date',
          badgeColor:
            stats.payments.overdue > 0
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700',
          section: 'financial'
        },
        {
          icon: Shield,
          label: 'Deposits',
          route: '/owner/dashboard/deposits',
          description: 'Security deposits',
          section: 'financial'
        },
        {
          icon: Zap,
          label: 'Utility Bills',
          route: '/owner/dashboard/utility-bills',
          description: 'Utility management',
          section: 'financial'
        },
        {
          icon: TrendingUp,
          label: 'Advance Payments',
          route: '/owner/dashboard/advance-payments',
          description: 'Advance rent tracking',
          section: 'financial'
        },
        {
          icon: MessageSquare,
          label: 'Messages',
          route: '/owner/dashboard/messages',
          description: 'Tenant communication',
          badge: isLoading
            ? '...'
            : stats.messages.unread > 0
            ? `${stats.messages.unread} unread`
            : 'No new',
          badgeColor:
            stats.messages.unread > 0
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700',
          section: 'communication'
        },
        {
          icon: Megaphone,
          label: 'Announcements',
          route: '/owner/dashboard/announcements',
          description: 'Property updates',
          section: 'communication'
        },
        {
          icon: BarChart3,
          label: 'Analytics',
          route: '/owner/dashboard/analytics',
          description: 'Property insights',
          section: 'reports'
        },
        {
          icon: User,
          label: 'Profile',
          route: '/owner/dashboard/profile',
          description: 'Personal information',
          section: 'account'
        }
      ];
    } else {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          route: '/tenant/dashboard',
          description: 'Overview & analytics',
          section: 'main'
        },
        {
          icon: Building,
          label: 'Find Properties',
          route: '/tenant/dashboard/properties',
          description: 'Browse available properties',
          section: 'property'
        },
        {
          icon: User,
          label: 'My Profile',
          route: '/tenant/dashboard/profile',
          description: 'Personal information',
          section: 'account'
        },
        {
          icon: FileCheck,
          label: 'Applications',
          route: '/tenant/dashboard/applications',
          description: 'Rental applications',
          section: 'property'
        },
        // {
        //   icon: ScrollText,
        //   label: 'Lease Agreement',
        //   route: '/tenant/dashboard/lease',
        //   description: 'Lease documents',
        //   section: 'property'
        // },
        {
          icon: CreditCard,
          label: 'Payments',
          route: '/tenant/dashboard/payments',
          description: 'Payment management',
          count: stats.upcomingPayment ? 1 : 0,
          section: 'financial'
        },
        {
          icon: Wrench,
          label: 'Maintenance',
          route: '/tenant/dashboard/maintenance',
          description: 'Request repairs',
          count: stats.maintenance.pending,
          section: 'operations'
        },
        {
          icon: MessageSquare,
          label: 'Messages',
          route: '/tenant/dashboard/messages',
          description: 'Owner communication',
          count: stats.messages.unread,
          section: 'communication'
        },
        // {
        //   icon: FileText,
        //   label: 'Documents',
        //   route: '/tenant/dashboard/documents',
        //   description: 'File management',
        //   count: stats.documents.count,
        //   section: 'communication'
        // },
        {
          icon: Bell,
          label: 'Notifications',
          route: '/tenant/dashboard/notifications',
          description: 'System alerts',
          count: stats.notifications.unread,
          section: 'communication'
        },
        {
          icon: Megaphone,
          label: 'Announcements',
          route: '/tenant/dashboard/announcements',
          description: 'Property updates',
          section: 'communication'
        }
        // {
        //   icon: BarChart3,
        //   label: 'Analytics',
        //   route: '/tenant/dashboard/analytics',
        //   description: 'Personal insights',
        //   section: 'reports'
        // }
      ];
    }
  };

  const sidebarItems = getSidebarItems();

  const handleSidebarItemClick = (route: string) => {
    router.push(route);
    setSidebarOpen(false);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Helper to determine if a sidebar item is active
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
    property: {
      title: role === 'owner' ? 'Property Management' : 'Property',
      items: sidebarItems.filter(item => item.section === 'property')
    },
    operations: {
      title: 'Operations',
      items: sidebarItems.filter(item => item.section === 'operations')
    },
    financial: {
      title: 'Financial',
      items: sidebarItems.filter(item => item.section === 'financial')
    },
    communication: {
      title: 'Communication',
      items: sidebarItems.filter(item => item.section === 'communication')
    },
    reports: {
      title: 'Reports',
      items: sidebarItems.filter(item => item.section === 'reports')
    },
    account: {
      title: 'Account',
      items: sidebarItems.filter(item => item.section === 'account')
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

  // Sidebar content component
  const sidebarContent = (
    <div className="flex flex-col w-full h-full bg-gradient-to-b from-white to-blue-50/30 shadow-2xl backdrop-blur-sm border-r border-blue-100">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Building className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                PropertEase
              </h1>
              <p className="text-blue-600/70 text-sm font-medium">
                {role === 'owner' ? 'Owner Portal' : 'Tenant Portal'}
              </p>
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
      </div>

      {/* User Profile Section */}
      {/* <div className="p-6 border-b border-blue-100">
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
              <span className="text-xs text-gray-500 capitalize">
                Active {role}
              </span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Quick Stats for Tenant */}
      {/* {role === 'tenant' && (
        <div className="p-6 border-b border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-blue-700">
                  {stats.messages.unread}
                </div>
                <div className="text-xs text-blue-600">New Messages</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-orange-700">
                  {stats.maintenance.pending}
                </div>
                <div className="text-xs text-orange-600">Maintenance</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )} */}

      {/* Payment Alert for Tenant */}
      {role === 'tenant' && stats.upcomingPayment && (
        <div className="p-4 border-b border-blue-100">
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
                    {sectionKey === 'property' && (
                      <Building className="w-3 h-3" />
                    )}
                    {sectionKey === 'operations' && (
                      <Wrench className="w-3 h-3" />
                    )}
                    {sectionKey === 'financial' && (
                      <PhilippinePeso className="w-3 h-3" />
                    )}
                    {sectionKey === 'communication' && (
                      <MessageSquare className="w-3 h-3" />
                    )}
                    {sectionKey === 'reports' && (
                      <BarChart3 className="w-3 h-3" />
                    )}
                    {sectionKey === 'account' && <User className="w-3 h-3" />}
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
      <div className="hidden lg:block fixed inset-y-0 left-0 w-72 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-80 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
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
