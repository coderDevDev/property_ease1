/**
 * Owner Utility Bills Management Page
 * Create and manage utility bills for properties
 * 
 * @page OwnerUtilityBillsPage
 * @created October 25, 2025
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UtilitiesAPI } from '@/lib/api/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Zap, Search, Plus, Eye, Trash2, DollarSign, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CreateBillDialog } from '@/components/owner/CreateBillDialog';
import { ViewBillDialog } from '@/components/owner/ViewBillDialog';

export default function OwnerUtilityBillsPage() {
  const { authState } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  useEffect(() => {
    fetchBills();
  }, [authState.user?.id]);

  const fetchBills = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);
      const data = await UtilitiesAPI.getOwnerBills(authState.user.id);
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load utility bills');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      const result = await UtilitiesAPI.deleteBill(billId);
      if (result.success) {
        toast.success('Bill deleted successfully');
        fetchBills();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete bill');
    }
  };

  const handleViewBill = (bill: any) => {
    setSelectedBill(bill);
    setShowViewDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getBillTypeIcon = (type: string) => {
    return <Zap className="h-5 w-5" />;
  };

  const filteredBills = bills.filter(bill => {
    const tenantName = bill.tenant?.user 
      ? `${bill.tenant.user.first_name} ${bill.tenant.user.last_name}`.toLowerCase()
      : '';
    
    const matchesSearch = 
      bill.bill_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenantName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || bill.payment_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bills.length,
    pending: bills.filter(b => b.payment_status === 'pending').length,
    paid: bills.filter(b => b.payment_status === 'paid').length,
    overdue: bills.filter(b => b.payment_status === 'overdue').length,
    totalAmount: bills.reduce((sum, b) => sum + Number(b.total_amount), 0),
    pendingAmount: bills.filter(b => b.payment_status === 'pending').reduce((sum, b) => sum + Number(b.total_amount), 0),
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading utility bills...</p>
          </div>
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
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                <Zap className="h-6 h-6 sm:h-8 sm:w-8 text-blue-600" />
                Utility Bills
              </h1>
              <p className="text-blue-600/80 font-medium text-sm sm:text-base mt-1">
                Manage utility bills for your properties
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Bill
            </Button>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6 space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Bills</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
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
                <p className="text-xs sm:text-sm text-gray-600">Paid</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Overdue</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Pending Amount</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  ₱{stats.pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by bill type, property, or tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('paid')}
              >
                Paid
              </Button>
              <Button
                variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('overdue')}
              >
                Overdue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      <div className="grid gap-4">
        {filteredBills.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No bills found matching your search' : 'No utility bills yet'}
              </p>
              <Button 
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Bill
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredBills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Bill Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        {getBillTypeIcon(bill.bill_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900 capitalize">
                            {bill.bill_type}
                          </h3>
                          <Badge className={getStatusColor(bill.payment_status)}>
                            {bill.payment_status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {bill.property?.name || 'Unknown Property'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Tenant: {bill.tenant?.user 
                            ? `${bill.tenant.user.first_name} ${bill.tenant.user.last_name}`
                            : 'No tenant assigned'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Period: {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Consumption & Amount */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    {bill.consumption && (
                      <div>
                        <p className="text-xs text-gray-500">Consumption</p>
                        <p className="font-semibold text-gray-900">
                          {bill.consumption} {bill.unit}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Due Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(bill.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-bold text-lg text-blue-600">
                        ₱{Number(bill.total_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewBill(bill)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {bill.payment_status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteBill(bill.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Overdue Warning */}
                {bill.payment_status === 'overdue' && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Overdue Payment</p>
                      <p className="text-xs text-red-700">
                        This bill is past the due date. Please follow up with tenant.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateBillDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            fetchBills();
          }}
        />
      )}

      {showViewDialog && selectedBill && (
        <ViewBillDialog
          bill={selectedBill}
          onClose={() => {
            setShowViewDialog(false);
            setSelectedBill(null);
          }}
          onUpdate={fetchBills}
        />
      )}
      </div>
    </div>
  );
}
