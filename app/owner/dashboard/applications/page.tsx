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
  Table2
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Applications
              </h1>
              <p className="text-blue-600/80 font-medium">
                Review and manage rental applications
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">
                    Total Applications
                  </p>
                  <p className="text-3xl font-bold">{applications.length}</p>
                </div>
                <ClipboardList className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm mb-1">Pending Review</p>
                  <p className="text-3xl font-bold">
                    {
                      applications.filter(app => app.status === 'pending')
                        .length
                    }
                  </p>
                </div>
                <Clock className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Approved</p>
                  <p className="text-3xl font-bold">
                    {
                      applications.filter(app => app.status === 'approved')
                        .length
                    }
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">Rejected</p>
                  <p className="text-3xl font-bold">
                    {
                      applications.filter(app => app.status === 'rejected')
                        .length
                    }
                  </p>
                </div>
                <XCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search applications, properties, or units..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm">
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
            <CardContent className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Applications Found
              </h3>
              <p className="text-gray-600 mb-6">
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
                    <th className="text-left p-4 text-sm font-medium text-gray-600">
                      Applicant
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">
                      Property
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">
                      Unit
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">
                      Move-in Date
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">
                      Monthly Rent
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">
                      Submitted
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map(application => (
                    <tr
                      key={application.id}
                      className="border-b border-blue-50 hover:bg-blue-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {application.user_name
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {application.user_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {application.user_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">
                          {application.property_name}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">
                          {application.unit_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {application.unit_type}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-gray-900">
                          {format(new Date(application.move_in_date), 'PPP')}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-blue-600">
                          ₱{application.monthly_rent.toLocaleString()}
                        </p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="p-4">
                        <p className="text-gray-900">
                          {format(
                            new Date(application.submitted_at),
                            'MMM d, yyyy'
                          )}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetailsDialog(true);
                          }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredApplications.map(application => (
              <Card
                key={application.id}
                className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                onClick={() => {
                  setSelectedApplication(application);
                  setShowDetailsDialog(true);
                }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {application.user_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">
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
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Property Information */}
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">Property:</span>
                      <span className="font-medium text-gray-900 truncate">
                        {application.property_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Home className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">Unit:</span>
                      <span className="font-medium text-gray-900">
                        {application.unit_number} ({application.unit_type})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">Move-in:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(application.move_in_date), 'PPP')}
                      </span>
                    </div>

                    {/* Financial Information */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Monthly Rent</p>
                        <p className="font-bold text-lg text-blue-600">
                          ₱{application.monthly_rent.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Documents</p>
                        <p className="text-sm font-medium text-gray-900">
                          {application.documents.length} attached
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve'
                ? 'Approve Application'
                : 'Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Are you sure you want to approve this application? This will create a new tenant record.'
                : 'Please provide a reason for rejecting this application.'}
            </DialogDescription>
          </DialogHeader>
          {actionType === 'reject' && (
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder="Please provide a reason for rejecting this application..."
                className="mt-2"
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
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              className={cn(
                'text-white',
                actionType === 'approve'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              )}>
              {actionType === 'approve'
                ? 'Confirm Approval'
                : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
