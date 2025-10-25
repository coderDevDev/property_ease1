'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ClipboardList,
  Search,
  Calendar,
  Building,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  Filter,
  User,
  Phone,
  Mail,
  Home,
  Building2,
  Eye,
  LayoutGrid,
  Table2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Application {
  id: string;
  user_id: string;
  property_id: string;
  property_name: string;
  unit_type: string;
  unit_number: string;
  monthly_rent: number;
  move_in_date: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  notes?: string;
  rejection_reason?: string;
  // User details
  user_name: string;
  user_email: string;
  user_phone: string;
}

export default function OwnerApplicationsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(
    null
  );
  const [actionNote, setActionNote] = useState('');
  const [leaseDuration, setLeaseDuration] = useState(12); // Default 12 months
  const [showLeasePreview, setShowLeasePreview] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const fetchApplications = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', authState.user.id);

      if (!properties) return;

      const propertyIds = properties.map(p => p.id);

      const { data, error } = await supabase
        .from('rental_applications')
        .select(
          `
          *,
          properties(name),
          users!rental_applications_user_id_fkey(
            first_name,
            last_name,
            email,
            phone
          ),
          documents:application_documents(
            id,
            name,
            type,
            url
          )
        `
        )
        .in('property_id', propertyIds)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const formattedApplications: Application[] = data.map(app => ({
        id: app.id,
        user_id: app.user_id,
        property_id: app.property_id,
        property_name: app.properties.name,
        unit_type: app.unit_type,
        unit_number: app.unit_number,
        monthly_rent: parseFloat(app.monthly_rent),
        move_in_date: app.move_in_date,
        status: app.status,
        submitted_at: app.submitted_at,
        updated_at: app.updated_at,
        documents: app.documents || [],
        notes: app.notes,
        rejection_reason: app.rejection_reason,
        user_name: `${app.users.first_name} ${app.users.last_name}`,
        user_email: app.users.email,
        user_phone: app.users.phone
      }));

      setApplications(formattedApplications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [authState.user?.id]);

  const handleAction = async () => {
    if (!selectedApplication || !actionType) return;

    try {
      // Check unit availability first
      if (actionType === 'approve') {
        const { data: availabilityStatusData } = await supabase.rpc(
          'get_unit_availability_status',
          {
            p_property_id: selectedApplication.property_id,
            p_unit_number: selectedApplication.unit_number,
            p_application_id: selectedApplication.id
          }
        );

        console.log({ availabilityStatusData });

        let availabilityStatus = availabilityStatusData[0];

        if (!availabilityStatus?.is_available) {
          const details = availabilityStatus?.details;
          let description = 'Please check the unit status and try again.';

          // Add more specific details based on the status
          if (details?.application_status) {
            description = `This unit already has a ${details.application_status} application.`;
          } else if (details?.tenant_id) {
            description = 'This unit is currently occupied by a tenant.';
          } else if (details?.occupied_units) {
            description = `Property is at capacity (${details.occupied_units}/${details.total_units} units occupied).`;
          }

          toast.error(details?.message || 'Unit is not available', {
            description
          });
          return;
        }
      }

      // Start a transaction using RPC for atomic operations
      const { data: result, error: rpcError } = await supabase.rpc(
        actionType === 'approve'
          ? 'approve_rental_application'
          : 'reject_rental_application',
        {
          application_id: selectedApplication.id,
          ...(actionType === 'approve' ? { lease_duration_months: leaseDuration } : {}),
          ...(actionType === 'reject' ? { rejection_reason: actionNote } : {})
        }
      );

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(rpcError.message);
      }

      let resultData = result[0];

      if (!resultData?.success) {
        throw new Error(resultData?.message || 'Failed to process application');
      }

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === selectedApplication.id
            ? {
                ...app,
                status: actionType === 'approve' ? 'approved' : 'rejected',
                ...(actionType === 'reject'
                  ? { rejection_reason: actionNote }
                  : {})
              }
            : app
        )
      );

      // Show success message with next steps
      if (actionType === 'approve') {
        toast.success(
          'Application approved successfully. A new tenant record has been created.',
          {
            duration: 5000,
            action: {
              label: 'View Tenant',
              onClick: () =>
                router.push(`/owner/dashboard/tenants/${resultData.tenant_id}`)
            }
          }
        );

        // Create welcome notification for the tenant
        // await supabase.rpc('send_notification', {
        //   user_ids: [selectedApplication.user_id],
        //   title: 'Application Approved! 🎉',
        //   message: `Your application for ${selectedApplication.property_name} - Unit ${selectedApplication.unit_number} has been approved. Welcome to our community!`,
        //   type: 'system',
        //   priority: 'high'
        // });

        // Send email notification (you'll need to implement this in your backend)
        // await supabase.functions.invoke('send-application-approval-email', {
        //   body: {
        //     email: selectedApplication.user_email,
        //     name: selectedApplication.user_name,
        //     property: selectedApplication.property_name,
        //     unit: selectedApplication.unit_number,
        //     moveInDate: format(
        //       new Date(selectedApplication.move_in_date),
        //       'PPP'
        //     )
        //   }
        // });
      } else {
        toast.success('Application rejected successfully.');

        // Create notification for the tenant
        // await supabase.rpc('send_notification', {
        //   user_ids: [selectedApplication.user_id],
        //   title: 'Application Status Update',
        //   message: `Your application for ${selectedApplication.property_name} - Unit ${selectedApplication.unit_number} has been reviewed. Unfortunately, we cannot proceed with your application at this time.`,
        //   type: 'system',
        //   priority: 'high'
        // });

        // // Send email notification
        // await supabase.functions.invoke('send-application-rejection-email', {
        //   body: {
        //     email: selectedApplication.user_email,
        //     name: selectedApplication.user_name,
        //     property: selectedApplication.property_name,
        //     unit: selectedApplication.unit_number,
        //     reason: actionNote
        //   }
        // });
      }

      // Close both dialogs and reset state
      setShowDetailsDialog(false); // Close the details dialog
      setShowActionDialog(false); // Close the action dialog
      setSelectedApplication(null); // Clear selected application
      setActionType(null);
      setActionNote('');

      // Refresh the applications list to get updated data
      await fetchApplications(); // Wait for the refresh to complete
    } catch (error) {
      console.error('Failed to process application:', error);
      toast.error('Failed to process application', {
        description:
          error instanceof Error ? error.message : 'Please try again later'
      });
    }
  };

  const handleDeleteApplication = async (application: Application) => {
    // Safety check: Don't allow deleting approved applications that created tenants
    if (application.status === 'approved') {
      const confirmDelete = confirm(
        `⚠️ WARNING: This application was APPROVED and may have created a tenant record.\n\n` +
        `Deleting this will NOT delete the tenant record.\n\n` +
        `Are you sure you want to delete this application record?\n\n` +
        `Applicant: ${application.user_name}\n` +
        `Property: ${application.property_name}`
      );
      
      if (!confirmDelete) return;
    } else {
      const confirmDelete = confirm(
        `Delete application from ${application.user_name}?\n\n` +
        `Property: ${application.property_name}\n` +
        `Status: ${application.status}\n\n` +
        `This will also delete all uploaded documents.\n` +
        `This action cannot be undone!`
      );
      
      if (!confirmDelete) return;
    }

    try {
      // Delete application (documents will be cascade deleted)
      const { error } = await supabase
        .from('rental_applications')
        .delete()
        .eq('id', application.id);

      if (error) throw error;

      // Update local state
      setApplications(prev => prev.filter(app => app.id !== application.id));

      toast.success('Application deleted successfully', {
        description: 'All related documents have been removed'
      });
    } catch (error) {
      console.error('Failed to delete application:', error);
      toast.error('Failed to delete application', {
        description: error instanceof Error ? error.message : 'Please try again later'
      });
    }
  };

  const handleDownloadDocument = async (document: { url: string }) => {
    try {
      window.open(document.url, '_blank');
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error('Failed to download document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(application => {
    const matchesFilter = filter === 'all' || application.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      application.property_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      application.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.unit_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm sm:text-base">
            Loading applications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Applications
              </h1>
              <p className="text-blue-600/80 font-medium text-sm sm:text-base">
                Review and manage rental applications
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total Applications
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {applications.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Pending Review
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      applications.filter(app => app.status === 'pending')
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Approved</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      applications.filter(app => app.status === 'approved')
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {
                      applications.filter(app => app.status === 'rejected')
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search applications, properties, or units..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm sm:text-base"
            />
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm sm:text-base">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center rounded-lg border border-blue-200 bg-white/80 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-3 rounded-r-md',
                  viewMode === 'table' && 'bg-blue-50 text-blue-600'
                )}
                onClick={() => setViewMode('table')}>
                <Table2 className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-3 rounded-l-md border-r border-blue-200',
                  viewMode === 'grid' && 'bg-blue-50 text-blue-600'
                )}
                onClick={() => setViewMode('grid')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardContent className="text-center py-8 sm:py-12">
              <ClipboardList className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No Applications Found
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {searchQuery
                  ? 'Try adjusting your search or filter criteria.'
                  : 'You have no rental applications yet.'}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-100">
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600">
                      Applicant
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600">
                      Property
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600">
                      Unit
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 hidden sm:table-cell">
                      Move-in Date
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600">
                      Monthly Rent
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 hidden md:table-cell">
                      Submitted
                    </th>
                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map(application => (
                    <tr
                      key={application.id}
                      className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors">
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                            {application.user_name
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                              {application.user_name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              {application.user_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                          {application.property_name}
                        </p>
                      </td>
                      <td className="p-3 sm:p-4">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm">
                          {application.unit_number}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {application.unit_type}
                        </p>
                      </td>
                      <td className="p-3 sm:p-4 hidden sm:table-cell">
                        <p className="text-gray-900 text-xs sm:text-sm">
                          {format(new Date(application.move_in_date), 'PPP')}
                        </p>
                      </td>
                      <td className="p-3 sm:p-4">
                        <p className="font-medium text-blue-600 text-xs sm:text-sm">
                          ₱{application.monthly_rent.toLocaleString()}
                        </p>
                      </td>
                      <td className="p-3 sm:p-4">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="p-3 sm:p-4 hidden md:table-cell">
                        <p className="text-gray-900 text-xs sm:text-sm">
                          {format(
                            new Date(application.submitted_at),
                            'MMM d, yyyy'
                          )}
                        </p>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailsDialog(true);
                          }}>
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredApplications.map(application => (
              <Card
                key={application.id}
                className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                onClick={() => {
                  setSelectedApplication(application);
                  setShowDetailsDialog(true);
                }}>
                <CardHeader className="pb-3 p-3 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                        {application.user_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                          {application.user_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(application.status)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'text-xs',
                        application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : application.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      )}>
                      {format(
                        new Date(application.submitted_at),
                        'MMM d, yyyy'
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-3 sm:p-6">
                  <div className="space-y-3">
                    {/* Property Information */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Building className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                      <span className="text-gray-600">Property:</span>
                      <span className="font-medium text-gray-900 truncate">
                        {application.property_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Home className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                      <span className="text-gray-600">Unit:</span>
                      <span className="font-medium text-gray-900">
                        {application.unit_number} ({application.unit_type})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                      <span className="text-gray-600">Move-in:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(application.move_in_date), 'PPP')}
                      </span>
                    </div>

                    {/* Financial Information */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                        <p className="font-bold text-base sm:text-lg text-blue-600">
                          ₱{application.monthly_rent.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Documents</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">
                          {application.documents.length} attached
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs sm:text-sm">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Application Details
            </DialogTitle>
          </DialogHeader>
          {selectedApplication ? (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge
                  className={cn(
                    'text-lg',
                    getStatusColor(selectedApplication.status)
                  )}>
                  <span className="flex items-center gap-2">
                    {getStatusIcon(selectedApplication.status)}
                    {selectedApplication.status.charAt(0).toUpperCase() +
                      selectedApplication.status.slice(1)}
                  </span>
                </Badge>
                <span className="text-sm text-gray-500">
                  Submitted:{' '}
                  {format(new Date(selectedApplication.submitted_at), 'PPP')}
                </span>
              </div>

              {/* Applicant Details */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-blue-900">
                  Applicant Information
                </h4>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-blue-700">
                    <User className="w-4 h-4" />
                    <span>{selectedApplication.user_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Mail className="w-4 h-4" />
                    <span>{selectedApplication.user_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Phone className="w-4 h-4" />
                    <span>{selectedApplication.user_phone}</span>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Property Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="font-medium text-gray-900">
                      {selectedApplication.property_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unit Number</p>
                    <p className="font-medium text-gray-900">
                      {selectedApplication.unit_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unit Type</p>
                    <p className="font-medium text-gray-900">
                      {selectedApplication.unit_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                    <p className="font-medium text-gray-900">
                      ₱{selectedApplication.monthly_rent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Move-in Date</p>
                    <p className="font-medium text-gray-900">
                      {format(
                        new Date(selectedApplication.move_in_date),
                        'PPP'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedApplication.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">
                    Additional Notes
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {selectedApplication.notes}
                  </p>
                </div>
              )}

              {/* Documents */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Supporting Documents
                </h4>
                <div className="grid gap-3">
                  {selectedApplication.documents.map(document => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {document.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {document.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleDownloadDocument(document)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    onClick={() => {
                      setActionType('reject');
                      setShowActionDialog(true);
                    }}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      setActionType('approve');
                      setShowActionDialog(true);
                    }}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}

              {/* Delete Button */}
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleDeleteApplication(selectedApplication);
                  }}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Application
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {selectedApplication.status === 'approved' 
                    ? '⚠️ This will NOT delete the tenant record'
                    : 'This will delete the application and all documents'}
                </p>
              </div>

              {/* Rejection Reason */}
              {selectedApplication.status === 'rejected' &&
                selectedApplication.rejection_reason && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">
                      Rejection Reason
                    </h4>
                    <p className="text-red-700">
                      {selectedApplication.rejection_reason}
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No application selected
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {actionType === 'approve'
                ? 'Approve Application & Set Lease Terms'
                : 'Reject Application'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {actionType === 'approve'
                ? 'Review and set the lease terms before approving this application.'
                : 'Please provide a reason for rejecting this application.'}
            </DialogDescription>
          </DialogHeader>

          {/* Approval Form */}
          {actionType === 'approve' && selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Applicant Info Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2">
                  Applicant Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-700">Tenant</p>
                    <p className="font-medium text-blue-900">
                      {selectedApplication.user_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Property</p>
                    <p className="font-medium text-blue-900">
                      {selectedApplication.property_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Unit Number</p>
                    <p className="font-medium text-blue-900">
                      {selectedApplication.unit_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Monthly Rent</p>
                    <p className="font-medium text-blue-900">
                      ₱{selectedApplication.monthly_rent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lease Start Date */}
              <div className="space-y-2">
                <Label>Lease Start Date</Label>
                <Input
                  type="date"
                  value={selectedApplication.move_in_date}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Based on tenant's preferred move-in date
                </p>
              </div>

              {/* Lease Duration Selector */}
              <div className="space-y-2">
                <Label>Lease Duration *</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={leaseDuration === 6 ? 'default' : 'outline'}
                    onClick={() => setLeaseDuration(6)}
                    className={cn(
                      leaseDuration === 6 &&
                        'bg-blue-600 hover:bg-blue-700 text-white'
                    )}>
                    <Calendar className="w-4 h-4 mr-2" />
                    6 Months
                  </Button>
                  <Button
                    type="button"
                    variant={leaseDuration === 12 ? 'default' : 'outline'}
                    onClick={() => setLeaseDuration(12)}
                    className={cn(
                      leaseDuration === 12 &&
                        'bg-blue-600 hover:bg-blue-700 text-white'
                    )}>
                    <Calendar className="w-4 h-4 mr-2" />
                    12 Months
                  </Button>
                  <Button
                    type="button"
                    variant={leaseDuration === 24 ? 'default' : 'outline'}
                    onClick={() => setLeaseDuration(24)}
                    className={cn(
                      leaseDuration === 24 &&
                        'bg-blue-600 hover:bg-blue-700 text-white'
                    )}>
                    <Calendar className="w-4 h-4 mr-2" />
                    24 Months
                  </Button>
                </div>
                <Select
                  value={leaseDuration.toString()}
                  onValueChange={val => setLeaseDuration(Number(val))}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Or select custom duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month (Short-term)</SelectItem>
                    <SelectItem value="3">3 Months (Quarterly)</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="9">9 Months</SelectItem>
                    <SelectItem value="12">12 Months (Standard)</SelectItem>
                    <SelectItem value="18">18 Months</SelectItem>
                    <SelectItem value="24">24 Months (Long-term)</SelectItem>
                    <SelectItem value="36">36 Months (3 Years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lease Summary Preview */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Lease Terms Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Start Date:</span>
                    <span className="font-medium text-green-900">
                      {format(
                        new Date(selectedApplication.move_in_date),
                        'PPP'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">End Date:</span>
                    <span className="font-medium text-green-900">
                      {format(
                        new Date(
                          new Date(selectedApplication.move_in_date).setMonth(
                            new Date(
                              selectedApplication.move_in_date
                            ).getMonth() + leaseDuration
                          )
                        ),
                        'PPP'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="text-green-700 font-medium">
                      Total Duration:
                    </span>
                    <span className="font-semibold text-green-900">
                      {leaseDuration} {leaseDuration === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Monthly Payments:</span>
                    <span className="font-medium text-green-900">
                      {leaseDuration} payments
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Total Rent:</span>
                    <span className="font-semibold text-green-900">
                      ₱
                      {(
                        selectedApplication.monthly_rent * leaseDuration
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-2">
                <Label htmlFor="approval-note">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="approval-note"
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder="Any additional notes or special terms..."
                  className="resize-none"
                  rows={3}
                />
              </div>

              {/* What Will Happen */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  What happens next:
                </h4>
                <ul className="space-y-1 text-sm text-yellow-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <span>Tenant record will be created</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <span>
                      {leaseDuration} monthly payment records will be
                      auto-generated
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <span>Unit will be marked as occupied</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-yellow-600" />
                    <span>Tenant will be notified of approval</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {actionType === 'reject' && (
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder="Please provide a reason for rejecting this application..."
                className="mt-2 resize-none"
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowActionDialog(false);
                setActionType(null);
                setActionNote('');
                setLeaseDuration(12);
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionType === 'reject' && !actionNote.trim()}
              className={cn(
                'text-white',
                actionType === 'approve'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              )}>
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Create Lease
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
