'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AnalyticsFiltersProps {
  onFiltersChange: (filters: {
    dateRange?: { start: string; end: string };
    propertyIds?: string[];
    tenantIds?: string[];
  }) => void;
  properties?: Array<{ id: string; name: string }>;
  tenants?: Array<{ id: string; name: string }>;
  className?: string;
}

export function AnalyticsFilters({
  onFiltersChange,
  properties = [],
  tenants = [],
  className
}: AnalyticsFiltersProps) {
  const [filters, setFilters] = useState({
    dateRange: undefined as { start: string; end: string } | undefined,
    propertyIds: [] as string[],
    tenantIds: [] as string[]
  });

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });

  const handleDateRangeChange = (
    from: Date | undefined,
    to: Date | undefined
  ) => {
    setDateRange({ from, to });

    if (from && to) {
      const newFilters = {
        ...filters,
        dateRange: {
          start: from.toISOString().split('T')[0],
          end: to.toISOString().split('T')[0]
        }
      };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    }
  };

  const handlePropertyChange = (propertyId: string, checked: boolean) => {
    const newPropertyIds = checked
      ? [...filters.propertyIds, propertyId]
      : filters.propertyIds.filter(id => id !== propertyId);

    const newFilters = { ...filters, propertyIds: newPropertyIds };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTenantChange = (tenantId: string, checked: boolean) => {
    const newTenantIds = checked
      ? [...filters.tenantIds, tenantId]
      : filters.tenantIds.filter(id => id !== tenantId);

    const newFilters = { ...filters, tenantIds: newTenantIds };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateRange: undefined,
      propertyIds: [],
      tenantIds: []
    };
    setFilters(clearedFilters);
    setDateRange({ from: undefined, to: undefined });
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters =
    filters.dateRange ||
    filters.propertyIds.length > 0 ||
    filters.tenantIds.length > 0;

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200',
        className
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={range =>
                  handleDateRangeChange(range?.from, range?.to)
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Properties Filter */}
        {properties.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Properties</Label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {properties.map(property => (
                <div key={property.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`property-${property.id}`}
                    checked={filters.propertyIds.includes(property.id)}
                    onChange={e =>
                      handlePropertyChange(property.id, e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <Label
                    htmlFor={`property-${property.id}`}
                    className="text-sm font-normal cursor-pointer">
                    {property.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tenants Filter */}
        {tenants.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tenants</Label>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {tenants.map(tenant => (
                <div key={tenant.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`tenant-${tenant.id}`}
                    checked={filters.tenantIds.includes(tenant.id)}
                    onChange={e =>
                      handleTenantChange(tenant.id, e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <Label
                    htmlFor={`tenant-${tenant.id}`}
                    className="text-sm font-normal cursor-pointer">
                    {tenant.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Date Filters */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Filters</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(
                  today.getFullYear(),
                  today.getMonth() - 1,
                  today.getDate()
                );
                handleDateRangeChange(lastMonth, today);
              }}>
              Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const last3Months = new Date(
                  today.getFullYear(),
                  today.getMonth() - 3,
                  today.getDate()
                );
                handleDateRangeChange(last3Months, today);
              }}>
              Last 3 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const last6Months = new Date(
                  today.getFullYear(),
                  today.getMonth() - 6,
                  today.getDate()
                );
                handleDateRangeChange(last6Months, today);
              }}>
              Last 6 Months
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastYear = new Date(
                  today.getFullYear() - 1,
                  today.getMonth(),
                  today.getDate()
                );
                handleDateRangeChange(lastYear, today);
              }}>
              Last Year
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
