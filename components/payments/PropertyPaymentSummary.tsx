'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface Payment {
  id: string;
  payment_type: string;
  amount: number;
  due_date: string;
  payment_status: string;
  late_fee?: number;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
}

interface PropertyPaymentSummaryProps {
  payments: Payment[];
  onPayNow?: (payment: Payment) => void;
}

export function PropertyPaymentSummary({ payments, onPayNow }: PropertyPaymentSummaryProps) {
  // Group payments by property
  const paymentsByProperty = payments.reduce((acc, payment) => {
    const propertyId = payment.property.id;
    if (!acc[propertyId]) {
      acc[propertyId] = {
        property: payment.property,
        payments: []
      };
    }
    acc[propertyId].payments.push(payment);
    return acc;
  }, {} as Record<string, { property: Payment['property']; payments: Payment[] }>);

  const getPropertyStats = (propertyPayments: Payment[]) => {
    const today = new Date();
    
    const pending = propertyPayments.filter(p => p.payment_status === 'pending');
    const paid = propertyPayments.filter(p => p.payment_status === 'paid');
    const overdue = pending.filter(p => new Date(p.due_date) < today);
    const upcoming = pending.filter(p => {
      const daysUntil = Math.ceil((new Date(p.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 30;
    });

    const nextPayment = upcoming.sort((a, b) => 
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )[0];

    const totalPending = pending.reduce((sum, p) => sum + Number(p.amount) + (p.late_fee || 0), 0);
    const totalPaid = paid.reduce((sum, p) => sum + Number(p.amount), 0);

    // Calculate recurring payments (assuming monthly)
    const rentPayments = propertyPayments.filter(p => p.payment_type === 'rent');
    const utilityPayments = propertyPayments.filter(p => p.payment_type === 'utility');
    
    const avgRent = rentPayments.length > 0 
      ? rentPayments.reduce((sum, p) => sum + Number(p.amount), 0) / Math.max(rentPayments.length, 1)
      : 0;
    
    const avgUtility = utilityPayments.length > 0
      ? utilityPayments.reduce((sum, p) => sum + Number(p.amount), 0) / Math.max(utilityPayments.length, 1)
      : 0;

    return {
      overdue: overdue.length,
      upcoming: upcoming.length,
      paid: paid.length,
      nextPayment,
      totalPending,
      totalPaid,
      monthlyEstimate: avgRent + avgUtility
    };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Home className="w-5 h-5" />
        Properties Overview
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(paymentsByProperty).map(({ property, payments: propertyPayments }) => {
          const stats = getPropertyStats(propertyPayments);
          
          return (
            <Card key={property.id} className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600" />
                  {property.name}
                </CardTitle>
                <p className="text-xs text-gray-600">
                  {property.address}, {property.city}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Next Payment */}
                {stats.nextPayment ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-yellow-700 font-medium mb-1">Next Payment</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {stats.nextPayment.payment_type.replace('_', ' ')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-600" />
                          <p className="text-xs text-gray-600">
                            {new Date(stats.nextPayment.due_date).toLocaleDateString()}
                            <span className="text-yellow-700 ml-1">
                              ({Math.ceil((new Date(stats.nextPayment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                            </span>
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mt-2">
                          ₱{stats.nextPayment.amount.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => onPayNow?.(stats.nextPayment)}>
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ) : stats.overdue > 0 ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm font-semibold text-red-700">
                        {stats.overdue} Overdue Payment{stats.overdue > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-semibold text-green-700">All Paid Up! ✓</p>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Monthly Est.</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₱{stats.monthlyEstimate.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Outstanding</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₱{stats.totalPending.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Payment Stats */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-gray-600">Paid: {stats.paid}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-gray-600">Upcoming: {stats.upcoming}</span>
                  </div>
                  {stats.overdue > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-gray-600">Overdue: {stats.overdue}</span>
                    </div>
                  )}
                </div>

                {/* Paid This Year */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Paid This Year</span>
                    <span className="text-sm font-bold text-green-600">
                      ₱{stats.totalPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
