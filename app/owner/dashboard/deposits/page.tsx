/**
 * Owner Deposits Management Page
 * Manage security deposits, inspections, and refunds
 * 
 * @page OwnerDepositsPage
 * @created October 25, 2025
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DepositsAPI } from '@/lib/api/deposits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, Search, Plus, Eye, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MoveOutInspectionDialog } from '@/components/owner/MoveOutInspectionDialog';
import { ViewInspectionDialog } from '@/components/owner/ViewInspectionDialog';
import { CreateDepositDialog } from '@/components/owner/CreateDepositDialog';

export default function OwnerDepositsPage() {
  const { authState } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, [authState.user?.id]);

  const fetchDeposits = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);
      const data = await DepositsAPI.getOwnerDeposits(authState.user.id);
      setDeposits(data);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast.error('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspection = (tenant: any) => {
    setSelectedTenant(tenant);
    setShowInspectionDialog(true);
  };

  const handleViewInspection = async (deposit: any) => {
    try {
      const inspection = await DepositsAPI.getTenantInspection(deposit.tenant_id);
      if (inspection) {
        setSelectedInspection(inspection);
        setShowViewDialog(true);
      } else {
        toast.info('No inspection found for this tenant');
      }
    } catch (error) {
      toast.error('Failed to load inspection');
    }
  };

  const handleProcessRefund = async (deposit: any) => {
    const tenantName = deposit.tenants?.users?.first_name && deposit.tenants?.users?.last_name
      ? `${deposit.tenants.users.first_name} ${deposit.tenants.users.last_name}`
      : 'this tenant';
    
    if (!confirm(`Process refund of ₱${deposit.refundable_amount.toLocaleString()} for ${tenantName}?`)) {
      return;
    }

    try {
      const result = await DepositsAPI.processDepositRefund(
        deposit.tenant_id,
        deposit.property_id
      );

      if (result.success) {
        toast.success(result.message);
        fetchDeposits();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process refund');
    }
  };

  const handleDeleteDeposit = async (deposit: any) => {
    const tenantName = deposit.tenants?.users?.first_name && deposit.tenants?.users?.last_name
      ? `${deposit.tenants.users.first_name} ${deposit.tenants.users.last_name}`
      : 'this tenant';
    
    if (!confirm(`Are you sure you want to delete the deposit for ${tenantName}?\n\nThis will also delete:\n- All move-out inspections\n- All deductions\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      const result = await DepositsAPI.deleteDeposit(deposit.id);

      if (result.success) {
        toast.success(result.message);
        fetchDeposits();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete deposit');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'held': return 'bg-blue-500';
      case 'fully_refunded': return 'bg-green-500';
      case 'partially_refunded': return 'bg-yellow-500';
      case 'forfeited': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const filteredDeposits = deposits.filter(deposit => {
    const firstName = deposit.tenants?.users?.first_name?.toLowerCase() || '';
    const lastName = deposit.tenants?.users?.last_name?.toLowerCase() || '';
    const tenantName = `${firstName} ${lastName}`.trim();
    const propertyName = deposit.properties?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return tenantName.includes(search) || propertyName.includes(search);
  });

  const stats = {
    total: deposits.length,
    held: deposits.filter(d => d.status === 'held').length,
    refunded: deposits.filter(d => d.status === 'fully_refunded').length,
    totalAmount: deposits.reduce((sum, d) => sum + Number(d.deposit_amount), 0),
    totalRefundable: deposits.filter(d => d.status === 'held').reduce((sum, d) => sum + Number(d.refundable_amount), 0),
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deposits...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Security Deposits
          </h1>
          <p className="text-gray-600 mt-1">
            Manage tenant deposits, inspections, and refunds
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Deposit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Deposits</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.held}</p>
              <p className="text-sm text-gray-600">Held</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.refunded}</p>
              <p className="text-sm text-gray-600">Refunded</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                ₱{stats.totalRefundable.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Refundable</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by tenant or property name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Deposits List */}
      <div className="grid gap-4">
        {filteredDeposits.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No deposits found matching your search' : 'No deposits yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDeposits.map((deposit) => (
            <Card key={deposit.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Tenant & Property Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {deposit.tenants?.users?.first_name && deposit.tenants?.users?.last_name
                            ? `${deposit.tenants.users.first_name} ${deposit.tenants.users.last_name}`
                            : 'Unknown Tenant'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {deposit.properties?.name || 'Unknown Property'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {deposit.properties?.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Original</p>
                      <p className="font-semibold text-gray-900">
                        ₱{Number(deposit.deposit_amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Deductions</p>
                      <p className="font-semibold text-red-600">
                        -₱{Number(deposit.deductions).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Refundable</p>
                      <p className="font-semibold text-green-600">
                        ₱{Number(deposit.refundable_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <Badge className={getStatusColor(deposit.status)}>
                      {getStatusLabel(deposit.status)}
                    </Badge>

                    <div className="flex gap-2">
                      {deposit.status === 'held' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateInspection(deposit)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Inspection
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInspection(deposit)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </>
                      )}

                      {deposit.status === 'held' && deposit.refundable_amount > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleProcessRefund(deposit)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Process Refund
                        </Button>
                      )}

                      {deposit.status === 'fully_refunded' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInspection(deposit)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      )}

                      {/* Delete button - only show for non-refunded deposits */}
                      {deposit.status !== 'fully_refunded' && deposit.status !== 'partially_refunded' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteDeposit(deposit)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {deposit.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Notes:</p>
                    <p className="text-sm text-gray-600">{deposit.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      {showInspectionDialog && selectedTenant && (
        <MoveOutInspectionDialog
          tenant={selectedTenant}
          onClose={() => {
            setShowInspectionDialog(false);
            setSelectedTenant(null);
          }}
          onComplete={() => {
            setShowInspectionDialog(false);
            setSelectedTenant(null);
            fetchDeposits();
          }}
        />
      )}

      {showViewDialog && selectedInspection && (
        <ViewInspectionDialog
          inspection={selectedInspection}
          onClose={() => {
            setShowViewDialog(false);
            setSelectedInspection(null);
          }}
        />
      )}

      {showCreateDialog && authState.user?.id && (
        <CreateDepositDialog
          ownerId={authState.user.id}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            fetchDeposits();
          }}
        />
      )}
    </div>
  );
}
