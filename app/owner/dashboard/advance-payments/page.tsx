/**
 * Owner Advance Payments Management Page
 * View and manage advance payments for properties
 * 
 * @page OwnerAdvancePaymentsPage
 * @created October 25, 2025
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdvancePaymentsAPI } from '@/lib/api/advance-payments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Search, TrendingUp, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerAdvancePaymentsPage() {
  const { authState } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, [authState.user?.id]);

  const fetchPayments = async () => {
    if (!authState.user?.id) return;

    try {
      setLoading(true);
      const data = await AdvancePaymentsAPI.getOwnerAdvancePayments(authState.user.id);
      setPayments(data);
    } catch (error) {
      console.error('Error fetching advance payments:', error);
      toast.error('Failed to load advance payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'fully_allocated': return 'bg-blue-500';
      case 'cancelled': return 'bg-gray-500';
      case 'refunded': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateProgress = (payment: any) => {
    const allocated = Number(payment.allocated_amount);
    const total = Number(payment.total_amount);
    return (allocated / total) * 100;
  };

  const filteredPayments = payments.filter(payment => {
    const tenantName = payment.tenant?.user 
      ? `${payment.tenant.user.first_name} ${payment.tenant.user.last_name}`.toLowerCase()
      : '';
    
    const matchesSearch = 
      payment.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenantName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payments.length,
    active: payments.filter(p => p.status === 'active').length,
    totalAmount: payments.reduce((sum, p) => sum + Number(p.total_amount), 0),
    remainingBalance: payments.reduce((sum, p) => sum + Number(p.remaining_balance), 0),
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading advance payments...</p>
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
            <DollarSign className="h-8 w-8 text-green-600" />
            Advance Payments
          </h1>
          <p className="text-gray-600 mt-1">
            Track tenant prepayments and allocations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Prepayments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xl font-bold text-blue-600">
                ₱{stats.totalAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">
                ₱{stats.remainingBalance.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Remaining Balance</p>
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
                placeholder="Search by property or tenant..."
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
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'fully_allocated' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('fully_allocated')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="grid gap-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No advance payments found matching your search' : 'No advance payments yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => {
            const progress = calculateProgress(payment);

            return (
              <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Payment Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {payment.property?.name || 'Unknown Property'}
                        </h3>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Tenant: {payment.tenant?.user 
                          ? `${payment.tenant.user.first_name} ${payment.tenant.user.last_name}`
                          : 'No tenant'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.months_covered} months • {new Date(payment.start_month).toLocaleDateString()} - {new Date(payment.end_month).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Progress & Amounts */}
                    <div className="flex-1 max-w-md">
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Allocated</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-semibold text-sm">
                            ₱{Number(payment.total_amount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Allocated</p>
                          <p className="font-semibold text-sm text-green-600">
                            ₱{Number(payment.allocated_amount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Balance</p>
                          <p className="font-semibold text-sm text-blue-600">
                            ₱{Number(payment.remaining_balance).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
