'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-blue-600',
  className
}: StatCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600 bg-green-50';
      case 'decrease':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200',
        className
      )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 bg-gradient-to-r rounded-lg flex items-center justify-center',
              iconColor === 'text-blue-600'
                ? 'from-blue-500 to-blue-600'
                : iconColor === 'text-green-600'
                ? 'from-green-500 to-green-600'
                : iconColor === 'text-purple-600'
                ? 'from-purple-500 to-purple-600'
                : iconColor === 'text-orange-600'
                ? 'from-orange-500 to-orange-600'
                : iconColor === 'text-red-600'
                ? 'from-red-500 to-red-600'
                : 'from-gray-500 to-gray-600'
            )}>
            {Icon && <Icon className="w-5 h-5 text-white" />}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </p>
            <p className="text-sm text-gray-600">{title}</p>
            {change && (
              <div
                className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1',
                  getChangeColor(change.type)
                )}>
                <span className="mr-1">{getChangeIcon(change.type)}</span>
                {Math.abs(change.value)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
