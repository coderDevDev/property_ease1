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
import { Zap, Search, Plus, Eye, Trash2, DollarSign, AlertCircle } from 'lucide-react';
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
    const matchesSearch = 
      bill.bill_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.tenant?.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-600" />
            Utility Bills
          </h1>
          <p className="text-gray-600 mt-1">
            Manage utility bills for your properties
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bill
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Bills</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xl font-bold text-blue-600">
                ₱{stats.pendingAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Pending Amount</p>
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
                          Tenant: {bill.tenant?.user?.full_name || 'No tenant assigned'}
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
  );
}
