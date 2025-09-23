'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  Calendar,
  User,
  Home,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Receipt
} from 'lucide-react';
import type { PaymentWithDetails } from '@/lib/api/payments';

interface PaymentCardProps {
  payment: PaymentWithDetails;
  role: 'owner' | 'tenant';
  onView?: (payment: PaymentWithDetails) => void;
  onEdit?: (payment: PaymentWithDetails) => void;
  onDelete?: (payment: PaymentWithDetails) => void;
  onMarkPaid?: (payment: PaymentWithDetails) => void;
  className?: string;
}

export function PaymentCard({
  payment,
  role,
  onView,
  onEdit,
  onDelete,
  onMarkPaid,
  className
}: PaymentCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-blue-100 text-blue-700';
      case 'partial':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'rent':
        return 'bg-blue-100 text-blue-700';
      case 'deposit':
        return 'bg-purple-100 text-purple-700';
      case 'security_deposit':
        return 'bg-indigo-100 text-indigo-700';
      case 'utility':
        return 'bg-green-100 text-green-700';
      case 'penalty':
        return 'bg-red-100 text-red-700';
      case 'other':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'gcash':
      case 'maya':
      case 'bank_transfer':
        return <CreditCard className="w-4 h-4" />;
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      case 'check':
        return <Receipt className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const isOverdue = payment.payment_status === 'pending' && new Date(payment.due_date) < new Date();

  return (
    <Card className={cn(
      'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200',
      isOverdue && 'border-red-200/50 bg-red-50/30',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900 mb-2">
              {payment.payment_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
            <div className="flex gap-2 mb-3">
              <Badge className={getStatusBadge(payment.payment_status)}>
                {payment.payment_status.replace('_', ' ')}
              </Badge>
              <Badge className={getPaymentTypeBadge(payment.payment_type)}>
                {payment.payment_type.replace('_', ' ')}
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-700">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(payment)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {role === 'owner' && payment.payment_status === 'pending' && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(payment)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Payment
                </DropdownMenuItem>
              )}
              {role === 'owner' && payment.payment_status === 'pending' && onMarkPaid && (
                <DropdownMenuItem onClick={() => onMarkPaid(payment)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              {role === 'owner' && payment.payment_status === 'pending' && onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(payment)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Payment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Amount */}
          <div className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">
              ₱{Number(payment.amount).toLocaleString()}
            </span>
            {payment.late_fee && payment.late_fee > 0 && (
              <span className="text-red-600 text-sm">
                (+₱{Number(payment.late_fee).toLocaleString()} late fee)
              </span>
            )}
          </div>

          {/* Property Info */}
          <div className="flex items-center gap-2 text-sm">
            <Home className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {payment.property.name}
            </span>
          </div>

          {/* Tenant Info (only for owners) */}
          {role === 'owner' && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {payment.tenant.user.first_name} {payment.tenant.user.last_name}
                {payment.tenant.unit_number && ` (Unit ${payment.tenant.unit_number})`}
              </span>
            </div>
          )}

          {/* Payment Method */}
          <div className="flex items-center gap-2 text-sm">
            {getPaymentMethodIcon(payment.payment_method)}
            <span className="text-gray-600 capitalize">
              {payment.payment_method.replace('_', ' ')}
            </span>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Due: {new Date(payment.due_date).toLocaleDateString()}
            </span>
          </div>

          {/* Paid Date */}
          {payment.paid_date && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600">
                Paid: {new Date(payment.paid_date).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Reference Number */}
          {payment.reference_number && (
            <div className="text-sm text-gray-500">
              Ref: {payment.reference_number}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
