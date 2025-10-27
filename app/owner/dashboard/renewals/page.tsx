'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { LeaseRenewalsAPI } from '@/lib/api/lease-renewals';
import { ReviewRenewalDialog } from '@/components/owner/ReviewRenewalDialog';

export default function RenewalsPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [filteredRenewals, setFilteredRenewals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRenewal, setSelectedRenewal] = useState<any | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  useEffect(() => {
    fetchRenewals();
  }, [authState.user?.id]);

  useEffect(() => {
    filterRenewals();
  }, [renewals, searchTerm, statusFilter]);

  const fetchRenewals = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);
      const data = await LeaseRenewalsAPI.getOwnerRenewals(authState.user.id);
      setRenewals(data);
    } catch (error) {
      console.error('Error fetching renewals:', error);
      toast.error('Failed to load renewals');
    } finally {
      setLoading(false);
    }
  };

  const filterRenewals = () => {
    let filtered = [...renewals];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.property?.name?.toLowerCase().includes(term) ||
          r.tenant?.user?.first_name?.toLowerCase().includes(term) ||
          r.tenant?.user?.last_name?.toLowerCase().includes(term)
      );
    }

    setFilteredRenewals(filtered);
  };

  const handleReview = (renewal: any) => {
    setSelectedRenewal(renewal);
    setShowReviewDialog(true);
  };

  const handleReviewComplete = () => {
    setShowReviewDialog(false);
    setSelectedRenewal(null);
    fetchRenewals();
  };

  // Calculate stats
  const stats = {
    total: renewals.length,
    pending: renewals.filter(r => r.status === 'pending').length,
    approved: renewals.filter(r => r.status === 'approved').length,
    rejected: renewals.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">
              Loading renewal requests...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-white to-blue-50/50 rounded-xl p-4 sm:p-6 shadow-lg border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-700 to-purple-600 bg-clip-text text-transparent">
                Lease Renewals
              </h1>
              <p className="text-purple-600/70 text-sm sm:text-base">
                Review and manage tenant lease renewal requests
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.pending}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.approved}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.rejected}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by property or tenant name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : ''}>
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  className={statusFilter === 'pending' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' : ''}>
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('approved')}
                  className={statusFilter === 'approved' ? 'bg-gradient-to-r from-green-600 to-green-700' : ''}>
                  Approved
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('rejected')}
                  className={statusFilter === 'rejected' ? 'bg-gradient-to-r from-red-600 to-red-700' : ''}>
                  Rejected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Renewals List */}
        {filteredRenewals.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-8 sm:p-12 text-center">
              <RefreshCw className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No Renewal Requests
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'No requests match your filters'
                  : 'No renewal requests have been submitted yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredRenewals.map((renewal) => (
              <Card
                key={renewal.id}
                className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left: Main Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                              {renewal.property?.name || 'Unknown Property'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {renewal.property?.address}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`${
                            renewal.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : renewal.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : renewal.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          } border-0 text-xs sm:text-sm`}>
                          {renewal.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Tenant Info */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          Tenant: {renewal.tenant?.user?.first_name}{' '}
                          {renewal.tenant?.user?.last_name}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{renewal.tenant?.user?.email}</span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Duration</p>
                          <p className="font-medium text-gray-900 text-sm">
                            {renewal.duration_months} months
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Proposed Start</p>
                          <p className="font-medium text-gray-900 text-sm">
                            {new Date(renewal.proposed_lease_start).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Current Rent</p>
                          <p className="font-medium text-gray-900 text-sm">
                            ₱{renewal.current_rent.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Proposed Rent</p>
                          <p className={`font-medium text-sm ${
                            renewal.proposed_rent !== renewal.current_rent
                              ? renewal.proposed_rent > renewal.current_rent
                                ? 'text-green-700'
                                : 'text-red-700'
                              : 'text-gray-900'
                          }`}>
                            ₱{renewal.proposed_rent.toLocaleString()}
                            {renewal.proposed_rent !== renewal.current_rent && (
                              <span className="text-xs ml-1">
                                ({renewal.proposed_rent > renewal.current_rent ? '+' : ''}
                                {((renewal.proposed_rent - renewal.current_rent) / renewal.current_rent * 100).toFixed(1)}%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {renewal.tenant_notes && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 mb-1">
                            Tenant Notes:
                          </p>
                          <p className="text-sm text-blue-700">{renewal.tenant_notes}</p>
                        </div>
                      )}

                      {renewal.owner_notes && (
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs font-medium text-purple-900 mb-1">
                            Your Response:
                          </p>
                          <p className="text-sm text-purple-700">{renewal.owner_notes}</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>
                          Submitted: {new Date(renewal.created_at).toLocaleDateString()}
                        </span>
                        {renewal.reviewed_at && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>
                              Reviewed: {new Date(renewal.reviewed_at).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    {renewal.status === 'pending' && (
                      <div className="flex lg:flex-col gap-2">
                        <Button
                          onClick={() => handleReview(renewal)}
                          className="flex-1 lg:flex-none bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
                          Review Request
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        {showReviewDialog && selectedRenewal && (
          <ReviewRenewalDialog
            open={showReviewDialog}
            onClose={() => {
              setShowReviewDialog(false);
              setSelectedRenewal(null);
            }}
            onSuccess={handleReviewComplete}
            renewal={selectedRenewal}
            ownerId={authState.user!.id}
          />
        )}
      </div>
    </div>
  );
}
