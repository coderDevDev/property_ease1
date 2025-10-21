'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface PaymentCalendarProps {
  payments: Payment[];
}

export function PaymentCalendar({ payments }: PaymentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getPaymentsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];

    return payments.filter(payment => {
      const paymentDate = new Date(payment.due_date).toISOString().split('T')[0];
      return paymentDate === dateStr;
    });
  };

  const getStatusColor = (payment: Payment) => {
    const today = new Date();
    const dueDate = new Date(payment.due_date);
    
    if (payment.payment_status === 'paid') return 'bg-green-500';
    if (dueDate < today) return 'bg-red-500';
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 7) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayPayments = getPaymentsForDay(day);
      const isToday = 
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 overflow-hidden hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          }`}>
          <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
            {isToday && <span className="ml-1 text-[10px]">Today</span>}
          </div>
          <div className="space-y-0.5">
            {dayPayments.slice(0, 2).map((payment) => (
              <div
                key={payment.id}
                className={`${getStatusColor(payment)} text-white text-[10px] px-1 py-0.5 rounded truncate`}
                title={`${payment.payment_type} - ${payment.property.name} (₱${payment.amount.toLocaleString()})`}>
                {payment.payment_type === 'rent' ? '🏠' : '⚡'} ₱{(payment.amount / 1000).toFixed(1)}k
              </div>
            ))}
            {dayPayments.length > 2 && (
              <div className="text-[10px] text-gray-600 font-medium">
                +{dayPayments.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <CalendarIcon className="w-5 h-5" />
            Payment Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousMonth}
              className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold min-w-[140px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-gray-600">Paid</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span className="text-gray-600">Due Soon</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-gray-600">Overdue</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-gray-600">Upcoming</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-gray-300 rounded-lg overflow-hidden">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="bg-blue-100 text-blue-700 text-center text-xs font-semibold py-2 border-b border-gray-300">
              {day}
            </div>
          ))}
          {/* Calendar days */}
          {renderCalendar()}
        </div>
      </CardContent>
    </Card>
  );
}
