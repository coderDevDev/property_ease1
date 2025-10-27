'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Clock } from 'lucide-react';

interface Payment {
  id: string;
  payment_type: string;
  amount: number;
  due_date: string;
  payment_status: string;
  late_fee?: number;
  property: {
    name: string;
  };
}

interface PaymentTimelineProps {
  payments: Payment[];
  daysAhead?: number;
  onPayNow?: (payment: Payment) => void;
}

export function PaymentTimeline({ payments, daysAhead = 30, onPayNow }: PaymentTimelineProps) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  // Get upcoming payments within the specified days
  const upcomingPayments = payments
    .filter(payment => {
      if (payment.payment_status === 'paid') return false;
      const dueDate = new Date(payment.due_date);
      return dueDate >= today && dueDate <= futureDate;
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const getDaysUntil = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusColor = (daysUntil: number) => {
    if (daysUntil <= 3) return 'bg-red-100 border-red-300 text-red-700';
    if (daysUntil <= 7) return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    return 'bg-blue-100 border-blue-300 text-blue-700';
  };

  const getStatusDot = (daysUntil: number) => {
    if (daysUntil <= 3) return 'bg-red-500';
    if (daysUntil <= 7) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const totalUpcoming = upcomingPayments.reduce((sum, p) => sum + Number(p.amount) + (p.late_fee || 0), 0);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <TrendingUp className="w-5 h-5" />
          Upcoming Payment Timeline
        </CardTitle>
        <CardDescription>
          Next {daysAhead} days • {upcomingPayments.length} payment{upcomingPayments.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingPayments.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No upcoming payments in the next {daysAhead} days</p>
            <p className="text-gray-400 text-sm mt-1">You're all caught up! 🎉</p>
          </div>
        ) : (
          <>
            {/* Total Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Due (Next {daysAhead} Days)</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    ₱{totalUpcoming.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-700">{upcomingPayments.length} Payments</p>
                  <p className="text-xs text-blue-600 mt-1">Plan ahead!</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-4">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-300 via-gray-200 to-transparent" />

              {/* Today marker */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative z-10">
                  <div className="w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-md flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700">Today</p>
                  <p className="text-xs text-gray-600">
                    {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Payment items */}
              {upcomingPayments.map((payment, index) => {
                const daysUntil = getDaysUntil(payment.due_date);
                const isLast = index === upcomingPayments.length - 1;

                return (
                  <div key={payment.id} className="flex items-start gap-3 relative">
                    {/* Timeline dot */}
                    <div className="relative z-10 mt-1">
                      <div className={`w-6 h-6 rounded-full ${getStatusDot(daysUntil)} border-4 border-white shadow-md`} />
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-${isLast ? '0' : '4'}`}>
                      <div className={`p-3 rounded-lg border ${getStatusColor(daysUntil)}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Date badge */}
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-3 h-3" />
                              <span className="text-xs font-semibold">
                                {new Date(payment.due_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full font-medium">
                                {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`}
                              </span>
                            </div>

                            {/* Payment info */}
                            <p className="font-semibold text-gray-900 capitalize mb-1">
                              {payment.payment_type.replace('_', ' ')} - {payment.property.name}
                            </p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-lg font-bold text-gray-900">
                                ₱{payment.amount.toLocaleString()}
                              </p>
                              {payment.late_fee && payment.late_fee > 0 ? (
                                <p className="text-xs text-red-600 font-medium">
                                  +₱{payment.late_fee.toLocaleString()} late fee
                                </p>
                              ) : (
                                <p className="text-xs text-gray-600 font-medium">
                                 
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action button */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => onPayNow?.(payment)}>
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
